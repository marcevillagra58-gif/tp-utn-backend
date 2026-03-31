/**
 * ============================================================================
 * MODELS/CONTACT.MODEL.JS — Esquema Mongoose para mensajes de contacto
 * ============================================================================
 */

import mongoose from "mongoose";

const ContactSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    message: { type: String, required: true, trim: true },
    read: { type: Boolean, default: false }, // Para marcar como leído en el panel admin
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export const Contact = mongoose.model("Contact", ContactSchema);
