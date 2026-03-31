/**
 * ============================================================================
 * MIDDLEWARE/UPLOAD.MIDDLEWARE.JS — Configuración de Multer (manejo de archivos)
 * ============================================================================
 *
 * Multer recibe la imagen del request (multipart/form-data),
 * la guarda EN MEMORIA (no en disco) y la pasa al controlador
 * como req.file.buffer para subirla a Cloudinary.
 *
 * Por qué en memoria:
 *  - Railway y otros servicios cloud NO tienen sistema de archivos persistente.
 *  - Guardar en /tmp causaría pérdida de archivos al redeploy.
 * ============================================================================
 */

import multer from "multer";

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];
const MAX_SIZE_MB = 10;

const storage = multer.memoryStorage(); // ← en memoria, no en disco

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Tipo de archivo no permitido. Solo se aceptan: jpg, png, webp",
      ),
      false,
    );
  }
};

export const uploadMiddleware = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_SIZE_MB * 1024 * 1024 }, // 5 MB máximo
});
