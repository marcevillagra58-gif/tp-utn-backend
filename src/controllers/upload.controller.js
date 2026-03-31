/**
 * ============================================================================
 * CONTROLLERS/UPLOAD.CONTROLLER.JS — Subida de imágenes a Cloudinary
 * ============================================================================
 *
 * POST /api/upload/image?folder=avatars   → Sube imagen, devuelve URL
 * DELETE /api/upload/image                → Elimina imagen por publicId
 *
 * Flujo:
 *  1. Multer recibe la imagen en req.file.buffer (en memoria)
 *  2. uploadImage() la sube a Cloudinary vía stream
 *  3. Devuelve { url, publicId } al cliente
 *  4. El cliente (frontend o siguiente endpoint) guarda la `url` en la BD
 * ============================================================================
 */

import { uploadImage, deleteImage } from "../utils/cloudinary.js";

// ─────────────────────────────────────────────
// POST /api/upload/image
// ─────────────────────────────────────────────
export const uploadImageHandler = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No se recibió ningún archivo" });
    }

    // Carpeta destino en Cloudinary (opcional, via query param)
    const folder = req.query.folder
      ? `hurlingham/${req.query.folder}`
      : "hurlingham/general";

    const { url, publicId } = await uploadImage(req.file.buffer, folder);

    res.status(201).json({
      url, // URL pública de la imagen en Cloudinary (para guardar en BD)
      publicId, // ID interno de Cloudinary (para poder borrarla después)
    });
  } catch (err) {
    console.error("Error subiendo imagen:", err);
    res.status(500).json({ error: "Error al subir la imagen" });
  }
};

// ─────────────────────────────────────────────
// DELETE /api/upload/image
// Body: { publicId: "hurlingham/avatars/abc123" }
// ─────────────────────────────────────────────
export const deleteImageHandler = async (req, res) => {
  try {
    const { publicId } = req.body;

    if (!publicId) {
      return res.status(400).json({ error: "publicId requerido" });
    }

    await deleteImage(publicId);
    res.json({ message: "Imagen eliminada correctamente" });
  } catch (err) {
    console.error("Error eliminando imagen:", err);
    res.status(500).json({ error: "Error al eliminar la imagen" });
  }
};
