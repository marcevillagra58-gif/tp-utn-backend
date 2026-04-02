/**
 * ============================================================================
 * ROUTES/USERS.ROUTES.JS — Rutas de usuarios
 * ============================================================================
 *
 * GET    /api/users              → Listar todos (solo admin)
 * GET    /api/users/:id          → Ver uno (admin o propio usuario)
 * POST   /api/users              → Registrar nuevo usuario (público)
 * PUT    /api/users/:id          → Actualizar perfil (admin o propio)
 * DELETE /api/users/:id          → Eliminar (solo admin)
 * PATCH  /api/users/:id/block    → Bloquear/desbloquear (solo admin)
 * PUT    /api/users/:id/password → Cambiar contraseña (solo propio)
 * ============================================================================
 * 
 * @swagger
 * tags:
 *   name: Users
 *   description: Endpoints para gestión de usuarios (Registro, Perfiles, Admin)
 */

import { Router } from "express";
import { body } from "express-validator";
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  toggleBlockUser,
  changePassword,
} from "../controllers/users.controller.js";
import {
  authMiddleware,
  adminMiddleware,
  optionalAuthMiddleware,
} from "../middleware/auth.middleware.js";

const router = Router();

// Validaciones reutilizables
const createUserValidation = [
  body("username")
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage("Username debe tener entre 3 y 50 caracteres"),
  body("name")
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage("El nombre público debe tener entre 3 y 100 caracteres"),
  body("email").isEmail().withMessage("Email inválido").normalizeEmail(),
  body("password")
    .isLength({ min: 8 })
    .withMessage("La contraseña debe tener al menos 8 caracteres")
    .matches(/[A-Z]/)
    .withMessage("Debe incluir al menos una mayúscula")
    .matches(/[0-9]/)
    .withMessage("Debe incluir al menos un número"),
];

const updateUserValidation = [
  body("username")
    .optional()
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage("Username inválido"),
  body("avatar")
    .optional()
    .isURL()
    .withMessage("Avatar debe ser una URL válida"),
];

const changePasswordValidation = [
  body("currentPassword")
    .notEmpty()
    .withMessage("La contraseña actual es requerida"),
  body("newPassword")
    .isLength({ min: 8 })
    .withMessage("La nueva contraseña debe tener al menos 8 caracteres")
    .matches(/[A-Z]/)
    .withMessage("Debe incluir al menos una mayúscula")
    .matches(/[0-9]/)
    .withMessage("Debe incluir al menos un número"),
];

// ─── Rutas ───────────────────────────────────

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Listar todos los usuarios (Requiere rol Admin)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de usuarios recuperada exitosamente
 *       403:
 *         description: Acceso denegado. Se requiere rol de administrador.
 */
router.get("/", authMiddleware, adminMiddleware, getUsers);

// GET /api/users/:id → admin o propio usuario
router.get("/:id", authMiddleware, getUserById);

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Crear nuevo usuario/productor (Requiere rol Admin)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: Usuario creado exitosamente
 *       400:
 *         description: Error de validación (ej. constraseña débil)
 */
router.post("/", authMiddleware, adminMiddleware, createUserValidation, createUser);

// PUT /api/users/:id → admin o propio
router.put("/:id", authMiddleware, updateUserValidation, updateUser);

// DELETE /api/users/:id → solo admin
router.delete("/:id", authMiddleware, adminMiddleware, deleteUser);

// PATCH /api/users/:id/block → solo admin
router.patch("/:id/block", authMiddleware, adminMiddleware, toggleBlockUser);

// PUT /api/users/:id/password → propio usuario
router.put(
  "/:id/password",
  authMiddleware,
  changePasswordValidation,
  changePassword,
);

export default router;
