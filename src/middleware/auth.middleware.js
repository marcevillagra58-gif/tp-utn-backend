/**
 * ============================================================================
 * MIDDLEWARE/AUTH.MIDDLEWARE.JS — Verificación de JWT
 * ============================================================================
 *
 * Protege las rutas que requieren autenticación.
 * Uso: agregar `authMiddleware` o `adminMiddleware` como segundo argumento en la ruta.
 *
 * Ejemplo:
 *   router.get('/users', authMiddleware, adminMiddleware, getUsers);
 * ============================================================================
 */

import jwt from "jsonwebtoken";

/**
 * Verifica que el request tenga un JWT válido en el header Authorization.
 * Si es válido, adjunta el payload del token a `req.user`.
 */
export const authMiddleware = (req, res, next) => {
  const authHeader = req.headers["authorization"];

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token de autenticación requerido" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { userId, role, email }
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res
        .status(401)
        .json({ error: "Token expirado. Renovar con /api/auth/refresh" });
    }
    return res.status(401).json({ error: "Token inválido" });
  }
};

/**
 * Verifica que el usuario autenticado tenga rol 'admin'.
 * Debe usarse DESPUÉS de authMiddleware.
 */
export const adminMiddleware = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res
      .status(403)
      .json({ error: "Acceso denegado. Se requiere rol admin." });
  }
  next();
};

/**
 * Middleware de autenticación OPCIONAL.
 * Si viene un JWT válido, adjunta el payload a req.user.
 * Si no viene token o es inválido, continúa sin bloquear (req.user queda undefined).
 * Útil para rutas públicas que cambian comportamiento según si el llamante es admin.
 */
export const optionalAuthMiddleware = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(); // Sin token → seguir como anónimo
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
  } catch {
    // Token inválido o expirado → seguir como anónimo (no bloquear)
  }
  next();
};
