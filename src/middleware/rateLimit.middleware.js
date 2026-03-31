/**
 * ============================================================================
 * MIDDLEWARE/RATE-LIMIT.MIDDLEWARE.JS — Protección contra fuerza bruta y DDoS
 * ============================================================================
 *
 * loginRateLimiter : máximo 50 intentos por IP cada 15 minutos en /api/auth/login.
 * apiLimiter       : máximo 1000 peticiones por IP cada 15 minutos en /api/*
 *
 * Si se supera el límite, devuelve HTTP 429 Too Many Requests.
 * ============================================================================
 */

import rateLimit from "express-rate-limit";

export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 50, // máximo 5 intentos por IP
  message: {
    error: "Demasiados intentos de login. Esperá 15 minutos.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 1000, // Límite de 1000 peticiones por usuario cada 15 min
  message: {
    error: "Demasiadas peticiones desde esta IP, por favor intente nuevamente luego de 15 minutos.",
  },
  standardHeaders: true, // Devuelve información de límite en las cabeceras `RateLimit-*`
  legacyHeaders: false, // Deshabilita cabeceras `X-RateLimit-*`
});
