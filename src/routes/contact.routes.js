/**
 * ============================================================================
 * ROUTES/CONTACT.ROUTES.JS — Rutas para el formulario de contacto
 * ============================================================================
 * 
 * @swagger
 * tags:
 *   name: Contact / Messages
 *   description: Formulario de contacto y bandeja de entrada del Administrador
 */

import { Router } from "express";
import { body } from "express-validator";
import {
  sendContactMessage,
  getContactMessages,
  markAsRead,
} from "../controllers/contact.controller.js";
import {
  authMiddleware,
  adminMiddleware,
} from "../middleware/auth.middleware.js";

const router = Router();

// Validaciones
const contactValidation = [
  body("name").trim().notEmpty().withMessage("El nombre es requerido"),
  body("email").isEmail().withMessage("Email inválido").normalizeEmail(),
  body("message")
    .trim()
    .isLength({ min: 10 })
    .withMessage("El mensaje debe tener al menos 10 caracteres"),
];

// ─── Rutas públicas ──────────────────────────
/**
 * @swagger
 * /api/contact:
 *   post:
 *     summary: Enviar un mensaje al buzón del Administrador
 *     tags: [Contact / Messages]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               message:
 *                 type: string
 *     responses:
 *       201:
 *         description: Mensaje enviado exitosamente.
 */
router.post("/", contactValidation, sendContactMessage);

// ─── Rutas protegidas (admin) ─────────────────
// GET /api/contact → Listar mensajes
router.get("/", authMiddleware, adminMiddleware, getContactMessages);

// PATCH /api/contact/:id/read → Marcar como leído
router.patch("/:id/read", authMiddleware, adminMiddleware, markAsRead);

export default router;
