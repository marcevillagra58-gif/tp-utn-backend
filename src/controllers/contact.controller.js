/**
 * ============================================================================
 * CONTROLLERS/CONTACT.CONTROLLER.JS — Gestión de mensajes de contacto
 * ============================================================================
 *
 * POST   /api/contact        → Enviar mensaje (público)
 *   Entrada: { name, email, phone?, message }
 *   Salida:  201 { message, data } | 400 errores de validación
 *
 * GET    /api/contact        → Listar mensajes (solo admin)
 *   Salida:  200 [ ...mensajes en orden desc ]
 *
 * PATCH  /api/contact/:id/read → Marcar como leído/no leído (solo admin)
 *   Entrada: { read: boolean }
 *   Salida:  200 { message, data } | 404 no encontrado
 *
 * Los mensajes se almacenan en MongoDB (colección 'contacts').
 * ============================================================================
 */

import { Contact } from "../models/contact.model.js";
import { validationResult } from "express-validator";

/**
 * Recibe un nuevo mensaje desde el formulario de contacto público.
 */
export const sendContactMessage = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, phone, message } = req.body;

    const newMessage = await Contact.create({
      name,
      email,
      phone,
      message,
    });

    res.status(201).json({
      message:
        "Mensaje enviado correctamente. Nos pondremos en contacto pronto.",
      data: newMessage,
    });
  } catch (err) {
    console.error("Error en sendContactMessage:", err);
    res
      .status(500)
      .json({ error: "Error interno del servidor al enviar el mensaje" });
  }
};

/**
 * Obtiene todos los mensajes de contacto (solo admin).
 */
export const getContactMessages = async (req, res) => {
  try {
    const messages = await Contact.find().sort({ createdAt: -1 });

    res.json(messages);
  } catch (err) {
    console.error("Error en getContactMessages:", err);
    res
      .status(500)
      .json({ error: "Error interno del servidor al obtener los mensajes" });
  }
};

/**
 * Marca un mensaje como leído/no leído (solo admin).
 */
export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const { read } = req.body;

    if (read === undefined) {
      return res.status(400).json({ error: 'El campo "read" es requerido' });
    }

    const updatedMessage = await Contact.findByIdAndUpdate(
      id,
      { read },
      { new: true },
    );

    if (!updatedMessage) {
      return res.status(404).json({ error: "Mensaje no encontrado" });
    }

    res.json({
      message: `Mensaje marcado como ${read ? "leído" : "no leído"}`,
      data: updatedMessage,
    });
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(404).json({ error: "ID de mensaje inválido" });
    }
    console.error("Error en markAsRead:", err);
    res
      .status(500)
      .json({ error: "Error interno del servidor al actualizar el mensaje" });
  }
};
