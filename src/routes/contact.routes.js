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
 *             required:
 *               - name
 *               - email
 *               - message
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Juan Pérez"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "juan@ejemplo.com"
 *               phone:
 *                 type: string
 *                 example: "11-1234-5678"
 *               message:
 *                 type: string
 *                 example: "Quiero obtener más información sobre los servicios disponibles."
 *     responses:
 *       201:
 *         description: Mensaje enviado exitosamente.
 *       400:
 *         description: Datos de entrada inválidos (validación fallida).
 *       500:
 *         description: Error interno del servidor.
 */
router.post("/", contactValidation, sendContactMessage);

// ─── Rutas protegidas (admin) ─────────────────
// GET /api/contact → Listar mensajes
router.get("/", authMiddleware, adminMiddleware, getContactMessages);

// PATCH /api/contact/:id/read → Marcar como leído
router.patch("/:id/read", authMiddleware, adminMiddleware, markAsRead);

export default router;
