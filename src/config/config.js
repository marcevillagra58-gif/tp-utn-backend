import dotenv from "dotenv";

dotenv.config();

// ============================================================
// CONFIGURACIÓN CENTRALIZADA DE VARIABLES DE ENTORNO
// ============================================================
// Patrón de Configuración Centralizada: todas las variables de
// entorno se leen una sola vez desde este archivo y se exportan
// como constantes con nombre. Si el nombre de una variable cambia
// en el .env, solo se actualiza aquí y no en cada archivo.
// ============================================================

// Servidor
export const PORT         = process.env.PORT         || 3000;
export const NODE_ENV     = process.env.NODE_ENV     || "development";
export const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

// JWT
export const JWT_SECRET         = process.env.JWT_SECRET;
export const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

// MongoDB
export const MONGODB_URI = process.env.MONGODB_URI;

// Supabase
export const SUPABASE_URL = process.env.SUPABASE_URL;
export const SUPABASE_KEY = process.env.SUPABASE_KEY;

// Cloudinary
export const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
export const CLOUDINARY_API_KEY    = process.env.CLOUDINARY_API_KEY;
export const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;

// Resend (emails)
export const RESEND_API_KEY   = process.env.RESEND_API_KEY;
export const DEVELOPER_EMAIL  = process.env.DEVELOPER_EMAIL;
