/**
 * ============================================================================
 * CONTROLLERS/AUTH.CONTROLLER.JS — Lógica de autenticación
 * ============================================================================
 *
 * Endpoints:
 *   POST /api/auth/login   → Verifica credenciales, devuelve JWT
 *   POST /api/auth/refresh → Renueva access token con refresh token
 *   POST /api/auth/logout  → Invalida el refresh token
 * ============================================================================
 */

import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { supabase } from "../db/supabase.js";
import { ResetToken } from "../models/resetToken.model.js";
import { sendPasswordResetEmail } from "../services/mailer.js";
import { hashPassword, verifyPassword, isLegacyHash } from "../utils/passwordUtils.js";
import { JWT_SECRET, JWT_REFRESH_SECRET, FRONTEND_URL } from "../config/config.js";

const JWT_EXPIRES_IN = "8h";
const REFRESH_EXPIRES_IN = "7d";
const REFRESH_EXPIRES_MS = 7 * 24 * 60 * 60 * 1000; // 7 días en ms

// ─────────────────────────────────────────────
// Helpers privados
// ─────────────────────────────────────────────

const generateTokens = (user) => {
  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    username: user.username,
  };

  const accessToken = jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
  const refreshToken = jwt.sign(
    { userId: user.id },
    JWT_REFRESH_SECRET,
    { expiresIn: REFRESH_EXPIRES_IN },
  );

  return { accessToken, refreshToken };
};

const saveRefreshToken = async (userId, token) => {
  const expiresAt = new Date(Date.now() + REFRESH_EXPIRES_MS).toISOString();
  await supabase
    .from("refresh_tokens")
    .insert({ user_id: userId, token, expires_at: expiresAt });
};

// ─────────────────────────────────────────────
// POST /api/auth/login
// ─────────────────────────────────────────────

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Buscar usuario por email O por username
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .or(`email.eq.${email},username.eq.${email}`)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    // Verificar si el usuario está bloqueado
    if (user.is_blocked) {
      return res
        .status(403)
        .json({ error: "Usuario bloqueado. Contactá al administrador." });
    }

    // ── Verificación con esquema dual ──────────────────────────────────
    // Si el hash tiene 60 chars = esquema legacy (bcrypt puro).
    // Si tiene 120 chars = esquema dual (nuevo).
    // En ambos casos verifyPassword sabe qué hacer.
    const isValid = await verifyPassword(password, user.username, user.password);

    // DEBUG (se puede eliminar en producción)
    console.log(`🔐 LOGIN — usuario: "${user.username}" | esquema: ${
      isLegacyHash(user.password) ? 'LEGACY (60)' : 'DUAL (120)'
    } | válido: ${isValid}`);

    if (!isValid) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    // ── Migración transparente de hash legacy → dual ───────────────────
    if (isLegacyHash(user.password)) {
      try {
        const newHash = await hashPassword(password, user.username);
        await supabase
          .from("users")
          .update({ password: newHash })
          .eq("id", user.id);
        console.log(`✅ MIGRACIÓN — hash de "${user.username}" actualizado al esquema dual (120 chars)`);
      } catch (migrationErr) {
        // No bloqueamos el login si la migración falla
        console.error("⚠️ MIGRACIÓN fallida (login continúa):", migrationErr.message);
      }
    }

    // Generar tokens
    const { accessToken, refreshToken } = generateTokens(user);
    await saveRefreshToken(user.id, refreshToken);

    // Devolver respuesta sin el password
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      accessToken,
      refreshToken,
      user: userWithoutPassword,
    });
  } catch (err) {
    console.error("Error en login:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// ─────────────────────────────────────────────
// POST /api/auth/refresh
// ─────────────────────────────────────────────

export const refreshToken = async (req, res) => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      return res.status(400).json({ error: "Refresh token requerido" });
    }

    // Verificar firma del refresh token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_REFRESH_SECRET);
    } catch {
      return res
        .status(401)
        .json({ error: "Refresh token inválido o expirado" });
    }

    // Verificar que el token exista en la BD y no haya expirado
    const { data: storedToken, error } = await supabase
      .from("refresh_tokens")
      .select("*")
      .eq("user_id", decoded.userId)
      .eq("token", token)
      .gt("expires_at", new Date().toISOString())
      .single();

    if (error || !storedToken) {
      return res
        .status(401)
        .json({ error: "Refresh token inválido o expirado" });
    }

    // Obtener datos del usuario
    const { data: user } = await supabase
      .from("users")
      .select("id, email, role, username, avatar")
      .eq("id", decoded.userId)
      .single();

    if (!user) {
      return res.status(401).json({ error: "Usuario no encontrado" });
    }

    // Generar nuevo access token (el refresh token se reutiliza)
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN },
    );

    res.json({ accessToken });
  } catch (err) {
    console.error("Error en refresh:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// ─────────────────────────────────────────────
// POST /api/auth/logout
// ─────────────────────────────────────────────

export const logout = async (req, res) => {
  try {
    const { refreshToken: token } = req.body;

    if (token) {
      // Eliminar el refresh token de la BD (invalida la sesión)
      await supabase.from("refresh_tokens").delete().eq("token", token);
    }

    res.json({ message: "Logout exitoso" });
  } catch (err) {
    console.error("Error en logout:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// ─────────────────────────────────────────────
// POST /api/auth/forgot-password
// ─────────────────────────────────────────────
export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  // Siempre respondemos 200 para no revelar si el email existe o no
  if (!email) {
    return res.status(400).json({ error: "El email es requerido" });
  }

  try {
    // 1. Verificar si el usuario existe en Supabase
    const { data: user } = await supabase
      .from("users")
      .select("id, email")
      .eq("email", email.toLowerCase())
      .single();

    if (user) {
      // 2. Generar token seguro
      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

      // 3. Borrar tokens anteriores del mismo email
      await ResetToken.deleteMany({ email: email.toLowerCase() });

      // 4. Guardar nuevo token
      await ResetToken.create({ email: email.toLowerCase(), token, expiresAt });

      // 5. Construir link de reset y enviar email (siempre al desarrollador)
      const frontendUrl =
        FRONTEND_URL ||
        "http://localhost:5173/HURLINGHAM_PNO_REACT";
      const resetLink = `${frontendUrl}/#/reset-password?token=${token}`;
      await sendPasswordResetEmail(email, resetLink);
    }

    // Siempre 200 para no revelar si el email existe
    res.json({ message: "Si el email existe, recibirás las instrucciones." });
  } catch (err) {
    console.error("Error en forgotPassword:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// ─────────────────────────────────────────────
// POST /api/auth/reset-password
// ─────────────────────────────────────────────
export const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res
      .status(400)
      .json({ error: "Token y nueva contraseña son requeridos" });
  }

  if (newPassword.length < 6) {
    return res
      .status(400)
      .json({ error: "La contraseña debe tener al menos 6 caracteres" });
  }

  try {
    // 1. Buscar token válido y no usado
    const resetDoc = await ResetToken.findOne({
      token,
      used: false,
      expiresAt: { $gt: new Date() },
    });

    if (!resetDoc) {
      return res.status(400).json({ error: "Token inválido o expirado" });
    }

    // 2. Hashear nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // 3. Actualizar en Supabase y verificar que realmente se actualizó
    const { data: updated, error } = await supabase
      .from("users")
      .update({ password: hashedPassword })
      .eq("email", resetDoc.email)
      .select("id, email");

    if (error) throw error;

    // Si 0 filas actualizadas, el email no coincide o RLS lo bloqueó
    if (!updated || updated.length === 0) {
      console.error(
        `❌ resetPassword: ninguna fila actualizada para email "${resetDoc.email}"`,
      );
      return res.status(500).json({
        error: "No se pudo actualizar la contraseña. Verificá el email.",
      });
    }

    console.log(
      `✅ resetPassword: contraseña actualizada para ${resetDoc.email}`,
    );
    // 4. Marcar token como usado
    await ResetToken.updateOne({ token }, { used: true });

    res.json({ message: "Contraseña actualizada correctamente" });
  } catch (err) {
    console.error("Error en resetPassword:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};
