/**
 * ============================================================================
 * DB/MONGO.JS — Conexión a la base de datos NoSQL (MongoDB Atlas)
 * ============================================================================
 *
 * Almacena: productores, productos, mensajes de contacto.
 * Datos no sensibles que se benefician de la flexibilidad de documentos.
 *
 * USO: import { connectMongoDB } from './db/mongo.js';
 *      Llamar a connectMongoDB() una vez al iniciar el servidor (index.js).
 * ============================================================================
 */

import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌ Error: MONGODB_URI no está definida en .env");
  process.exit(1);
}

export const connectMongoDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ MongoDB Atlas conectado correctamente");
  } catch (error) {
    console.error("❌ Error al conectar MongoDB:", error.message);
    throw error;
  }
};

// Manejar desconexión inesperada
mongoose.connection.on("disconnected", () => {
  console.warn("⚠️ MongoDB desconectado. Intentando reconectar...");
});
