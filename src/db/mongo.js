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
import { MONGODB_URI } from "../config/config.js";

if (!MONGODB_URI) {
  console.warn(
    "⚠️ Advertencia: MONGODB_URI no está definida en .env. La conexión a MongoDB fallará.",
  );
}

export const connectMongoDB = async () => {
  try {
    if (!MONGODB_URI) throw new Error("MONGODB_URI no definida");
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
