/**
 * ============================================================================
 * ROUTES/PRODUCERS.ROUTES.JS — Rutas de productores
 * ============================================================================
 *
 * Públicas (sin auth):
 *   GET /api/producers         → Listar (con filtros: ?category= &search= )
 *   GET /api/producers/:id     → Ver detalle
 *
 * Protegidas (admin):
 *   POST   /api/producers                          → Crear
 *   PUT    /api/producers/:id                      → Actualizar
 *   DELETE /api/producers/:id                      → Eliminar
 *   POST   /api/producers/:id/products             → Agregar producto
 *   DELETE /api/producers/:id/products/:productId  → Eliminar producto
 * ============================================================================
 * 
 * @swagger
 * tags:
 *   name: Producers
 *   description: Directorio de perfiles, productos y comentarios locales.
 */

import { Router } from "express";
import { body } from "express-validator";
import {
  getProducers,
  getProducerById,
  createProducer,
  updateProducer,
  deleteProducer,
  addProduct,
  deleteProduct,
  addComment,
  deleteComment,
} from "../controllers/producers.controller.js";
import {
  authMiddleware,
  adminMiddleware,
  optionalAuthMiddleware,
} from "../middleware/auth.middleware.js";

const router = Router();

const producerValidation = [
  body("name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("El nombre es requerido"),
  // La categoría es string libre — el controlador valida contra la tabla 'categorias'
  body("category")
    .optional({ checkFalsy: true })
    .isString()
    .trim(),
  body("email")
    .optional({ checkFalsy: true })
    .isEmail()
    .withMessage("Email inválido")
    .normalizeEmail(),
];

const productValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("El nombre del producto es requerido"),
];

// ─── Rutas públicas ──────────────────────────

/**
 * @swagger
 * /api/producers:
 *   get:
 *     summary: Obtener el catálogo de productores (con filtros opcionales)
 *     tags: [Producers]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filtrar por categoría
 *     responses:
 *       200:
 *         description: Lista de productores y sus productos vinculados.
 */
router.get("/", getProducers);
router.get("/:id", getProducerById);

// ─── Rutas protegidas (admin) ─────────────────
router.post(
  "/",
  authMiddleware,
  adminMiddleware,
  producerValidation,
  createProducer,
);
router.put("/:id", authMiddleware, producerValidation, updateProducer);
router.delete("/:id", authMiddleware, adminMiddleware, deleteProducer);

// ─── Productos embebidos ─────────────────────
/**
 * @swagger
 * /api/producers/{id}/products:
 *   post:
 *     summary: Agregar un producto al catálogo del productor (Requiere autenticación)
 *     tags: [Producers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del Productor en MongoDB
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: Nombre del producto
 *               description:
 *                 type: string
 *               imageUrl:
 *                 type: string
 *                 description: URL de la imagen del producto
 *     responses:
 *       200:
 *         description: Producto agregado exitosamente
 */
router.post("/:id/products", authMiddleware, productValidation, addProduct);

/**
 * @swagger
 * /api/producers/{id}/products/{productId}:
 *   delete:
 *     summary: Eliminar un producto del productor (Requiere autenticación)
 *     tags: [Producers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del Productor en MongoDB
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del Producto a eliminar
 *     responses:
 *       200:
 *         description: Producto eliminado exitosamente
 */
router.delete("/:id/products/:productId", authMiddleware, deleteProduct);

// ─── Comentarios ──────────────────────────────
/**
 * @swagger
 * /api/producers/{id}/comments:
 *   post:
 *     summary: Dejar un comentario en el perfil de un productor
 *     tags: [Producers]
 *     security:
 *       - {}
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del Productor en MongoDB
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 description: Nombre del usuario (Cargado automático si está logueado)
 *               text:
 *                 type: string
 *                 description: El comentario
 *     responses:
 *       200:
 *         description: Comentario agregado.
 */
router.post("/:id/comments", optionalAuthMiddleware, addComment);
router.delete("/:id/comments/:commentId", authMiddleware, deleteComment);

export default router;
