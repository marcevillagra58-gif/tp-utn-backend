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

// POST /api/upload/image
// multipart/form-data con campo "image"
// Se usa un wrapper para capturar errores de Multer (ej: File too large)
router.post(
  "/image",
  authMiddleware,
  (req, res, next) => {
    uploadMiddleware.single("image")(req, res, (err) => {
      if (err) {
        // Multer lanza errores antes de llegar al controller
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

// DELETE /api/upload/image
// Body: { publicId: "..." }
router.delete("/image", authMiddleware, deleteImageHandler);

export default router;
