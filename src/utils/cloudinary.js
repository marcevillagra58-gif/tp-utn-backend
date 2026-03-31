/**
 * ============================================================================
 * UTILS/CLOUDINARY.JS — Cliente de Cloudinary para subida de imágenes
 * ============================================================================
 *
 * Las imágenes se suben DESDE EL BACKEND, no desde el frontend.
 * Esto protege las API keys de Cloudinary (nunca se exponen al browser).
 *
 * USO:
 *   import { uploadImage, deleteImage } from '../utils/cloudinary.js';
 *   const result = await uploadImage(file.buffer, 'hurlingham/avatars');
 * ============================================================================
 */

import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

// Validar que las variables de entorno estén definidas
if (
  !process.env.CLOUDINARY_CLOUD_NAME ||
  !process.env.CLOUDINARY_API_KEY ||
  !process.env.CLOUDINARY_API_SECRET
) {
  console.error("❌ Error: Variables de Cloudinary no configuradas en .env");
  process.exit(1);
}

// Configurar cliente de Cloudinary con las variables de entorno
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Sube una imagen a Cloudinary desde un buffer (Multer en memoria).
 * @param {Buffer} buffer - Buffer del archivo de imagen
 * @param {string} folder - Carpeta destino en Cloudinary (ej: 'hurlingham/avatars')
 * @returns {Promise<{url: string, publicId: string}>}
 */
export const uploadImage = (buffer, folder = "hurlingham") => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        transformation: [{ quality: "auto", fetch_format: "auto" }],
      },
      (error, result) => {
        if (error) return reject(error);
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
        });
      },
    );
    uploadStream.end(buffer);
  });
};

/**
 * Elimina una imagen de Cloudinary por su public_id.
 * @param {string} publicId - El public_id de la imagen en Cloudinary
 * @returns {Promise<void>}
 */
export const deleteImage = async (publicId) => {
  if (!publicId) return;
  await cloudinary.uploader.destroy(publicId);
};

console.log("✅ Cloudinary configurado correctamente");

export default cloudinary;
