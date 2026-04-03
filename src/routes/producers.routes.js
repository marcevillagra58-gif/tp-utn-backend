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
  getProducts,
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
 *   get:
 *     summary: Obtener el catálogo de productos de un productor
 *     tags: [Producers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del Productor en MongoDB
 *     responses:
 *       200:
 *         description: Lista de productos asociados al productor
 *       404:
 *         description: Productor no encontrado
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/:id/products", getProducts);

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
 *       201:
 *         description: Producto agregado exitosamente
 *       400:
 *         description: Error de validación en los datos enviados
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Usuario no autenticado
 *       403:
 *         description: No tenés permiso para agregar productos a este productor
 *       404:
 *         description: Productor no encontrado
 *       500:
 *         description: Error interno del servidor
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
 *       401:
 *         description: Usuario no autenticado
 *       403:
 *         description: No tenés permiso para eliminar productos de este productor
 *       404:
 *         description: Productor no encontrado
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
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
 *       201:
 *         description: Comentario agregado.
 *       400:
 *         description: El comentario no puede estar vacío o supera los 500 caracteres
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Productor no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.post("/:id/comments", optionalAuthMiddleware, addComment);
/**
 * @swagger
 * /api/producers/{id}/comments/{commentId}:
 *   delete:
 *     summary: Eliminar un comentario (Requiere ser el autor o Admin)
 *     tags: [Producers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del Productor
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del Comentario
 *     responses:
 *       200:
 *         description: Comentario eliminado correctamente
 *       401:
 *         description: Usuario no autenticado
 *       403:
 *         description: No tenés permiso para eliminar este comentario
 *       404:
 *         description: Comentario no encontrado
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete("/:id/comments/:commentId", authMiddleware, deleteComment);

export default router;
