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
router.post("/",    authMiddleware, adminMiddleware, createCategoria);
router.put("/:id",  authMiddleware, adminMiddleware, updateCategoria);
router.delete("/:id", authMiddleware, adminMiddleware, deleteCategoria);

export default router;
