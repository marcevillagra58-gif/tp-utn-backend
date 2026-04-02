/**
 * ============================================================================
 * ROUTES/CATEGORIES.ROUTES.JS — Rutas para ABM de Categorías
 * ============================================================================
 *
 * Públicas:
 *   GET /api/categorias           → Listar
 *
 * Protegidas (admin):
 *   POST   /api/categorias        → Crear
 *   PUT    /api/categorias/:id    → Editar
 *   DELETE /api/categorias/:id    → Eliminar
 * ============================================================================
 * 
 * @swagger
 * tags:
 *   name: Categorias
 *   description: ABM de las tablas de categorías de productores
 */

import { Router } from "express";
import {
  getCategorias,
  createCategoria,
  updateCategoria,
  deleteCategoria,
} from "../controllers/categories.controller.js";
import { authMiddleware, adminMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

// Pública
/**
 * @swagger
 * /api/categorias:
 *   get:
 *     summary: Obtener todas las categorías habilitadas
 *     tags: [Categorias]
 *     responses:
 *       200:
 *         description: Arreglo JSON con las categorías disponibles.
 */
router.get("/", getCategorias);

// Protegidas — solo admin

/**
 * @swagger
 * /api/categorias:
 *   post:
 *     summary: Crear nueva categoría (Requiere rol Admin)
 *     tags: [Categorias]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *             properties:
 *               nombre:
 *                 type: string
 *               icono:
 *                 type: string
 *     responses:
 *       201:
 *         description: Categoría creada con éxito
 *       403:
 *         description: Requiere permisos de administrador
 *       409:
 *         description: Ya existe una categoría con ese nombre
 */
router.post("/",    authMiddleware, adminMiddleware, createCategoria);

/**
 * @swagger
 * /api/categorias/{id}:
 *   put:
 *     summary: Editar una categoría existente (Requiere rol Admin)
 *     tags: [Categorias]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *               icono:
 *                 type: string
 *     responses:
 *       200:
 *         description: Categoría actualizada
 *       403:
 *         description: Requiere permisos de administrador
 *       409:
 *         description: Ya existe una categoría con ese nombre
 */
router.put("/:id",  authMiddleware, adminMiddleware, updateCategoria);

/**
 * @swagger
 * /api/categorias/{id}:
 *   delete:
 *     summary: Eliminar una categoría (Requiere rol Admin)
 *     tags: [Categorias]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Categoría eliminada
 *       403:
 *         description: Requiere permisos de administrador
 */
router.delete("/:id", authMiddleware, adminMiddleware, deleteCategoria);

export default router;
