/**
 * MODELO: ResetToken
 * Almacena tokens temporales de recuperación de contraseña.
 * TTL automático: MongoDB elimina el documento al expirar.
 */
import mongoose from "mongoose";

const ResetTokenSchema = new mongoose.Schema({
  email: { type: String, required: true, lowercase: true },
  token: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true },
  used: { type: Boolean, default: false },
});

// Índice TTL: MongoDB borra el doc automáticamente al expirar
ResetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const ResetToken = mongoose.model("ResetToken", ResetTokenSchema);
