/**
 * ============================================================================
 * ROUTES/UPLOAD.ROUTES.JS — Rutas de subida de imágenes
 * ============================================================================
 *
 * POST   /api/upload/image?folder=avatars  → Subir imagen
 * DELETE /api/upload/image                 → Eliminar imagen por publicId
 *
 * Ambas rutas requieren autenticación JWT.
 * ============================================================================
 */

import { Router } from "express";
import { uploadMiddleware } from "../middleware/upload.middleware.js";
import {
  uploadImageHandler,
  deleteImageHandler,
} from "../controllers/upload.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Uploads
 *   description: Subida y eliminación de imágenes a Cloudinary
 */

/**
 * @swagger
 * /api/upload/image:
 *   post:
 *     summary: Subir una imagen a Cloudinary (Requiere autenticación)
 *     tags: [Uploads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: folder
 *         schema:
 *           type: string
 *         description: Carpeta destino en Cloudinary (ej. avatars, products). Opcional.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Archivo de imagen a subir.
 *     responses:
 *       200:
 *         description: Imagen subida correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 imageUrl:
 *                   type: string
 *                 publicId:
 *                   type: string
 *       400:
 *         description: Archivo muy grande o error de validación
 */
router.post(
  "/image",
  authMiddleware,
  (req, res, next) => {
    uploadMiddleware.single("image")(req, res, (err) => {
      if (err) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res
            .status(400)
            .json({ error: "La imagen es demasiado grande. Máximo 10 MB." });
        }
        if (err.message) {
          return res.status(400).json({ error: err.message });
        }
        return res.status(400).json({ error: "Error al procesar la imagen" });
      }
      next();
    });
  },
  uploadImageHandler,
);

/**
 * @swagger
 * /api/upload/image:
 *   delete:
 *     summary: Eliminar una imagen de Cloudinary (Requiere autenticación)
 *     tags: [Uploads]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - publicId
 *             properties:
 *               publicId:
 *                 type: string
 *                 description: ID público de la imagen devuelto por Cloudinary
 *     responses:
 *       200:
 *         description: Imagen eliminada correctamente
 *       400:
 *         description: Faltan parámetros en la petición
 */
router.delete("/image", authMiddleware, deleteImageHandler);

export default router;
