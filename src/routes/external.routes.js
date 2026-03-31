/**
 * ============================================================================
 * ROUTES/EXTERNAL.ROUTES.JS — Rutas para APIs externas
 * ============================================================================
 * 
 * @swagger
 * tags:
 *   name: External APIs
 *   description: Integraciones con servicios de terceros (Clima)
 */

import express from "express";
import { getWeather } from "../controllers/external.controller.js";

const router = express.Router();

// Rutas públicas — no requieren autenticación
/**
 * @swagger
 * /api/external/weather:
 *   get:
 *     summary: Obtener el clima actual de Hurlingham
 *     tags: [External APIs]
 *     responses:
 *       200:
 *         description: Objeto JSON con la temperatura actual e icono del clima de Hurlingham.
 */
router.get("/weather",   getWeather);

export default router;
