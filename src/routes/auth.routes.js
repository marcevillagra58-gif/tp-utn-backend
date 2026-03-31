/**
 * ============================================================================
 * ROUTES/AUTH.ROUTES.JS — Rutas de autenticación
 * ============================================================================
 *
 * @swagger
 * tags:
 *   name: Auth
 *   description: Endpoints para gestión de sesión y acceso
 */

import { Router } from "express";
import { body } from "express-validator";
import {
  login,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword,
} from "../controllers/auth.controller.js";
import { loginRateLimiter } from "../middleware/rateLimit.middleware.js";

const router = Router();

// Validaciones para el login
const loginValidation = [
  body("email").notEmpty().withMessage("Email o usuario es requerido"),
  body("password").notEmpty().withMessage("La contraseña es requerida"),
];

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Iniciar sesión
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: JWT Token e información del usuario devueltos exitosamente.
 *       401:
 *         description: Credenciales inválidas.
 */
router.post("/login", loginRateLimiter, loginValidation, login);

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Renovar Access Token (usando Refresh Token en cookie)
 *     tags: [Auth]
 *     security: []
 *     responses:
 *       200:
 *         description: Nuevo accesToken generado
 *       403:
 *         description: Refresh token inválido o expirado
 */
router.post("/refresh", refreshToken);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Cerrar sesión (invalidar refresh token)
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: Refresh token a invalidar
 *     responses:
 *       200:
 *         description: Logout exitoso
 */
router.post("/logout", logout);

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Recuperación de contraseña (envía email con link)
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: usuario@example.com
 *     responses:
 *       200:
 *         description: Si el email existe, se envía el link (siempre 200 para no revelar información).
 *       400:
 *         description: Email no informado.
 */
router.post("/forgot-password", forgotPassword);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Restablecer contraseña con el token del email
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, newPassword]
 *             properties:
 *               token:
 *                 type: string
 *                 description: Token recibido en el email de recuperación
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *                 description: Nueva contraseña (mín. 6 caracteres)
 *     responses:
 *       200:
 *         description: Contraseña actualizada correctamente.
 *       400:
 *         description: Token inválido, expirado o contraseña muy corta.
 */
router.post("/reset-password", resetPassword);

export default router;
