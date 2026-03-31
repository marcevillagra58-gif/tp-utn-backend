/**
 * ============================================================================
 * ROUTES/NOTIFICATIONS.ROUTES.JS — Rutas para SSE
 * ============================================================================
 */

import express from "express";
import { streamNotifications } from "../controllers/notifications.controller.js";

const router = express.Router();

// Ruta para el stream de notificaciones SSE
router.get("/stream", streamNotifications);

export default router;
