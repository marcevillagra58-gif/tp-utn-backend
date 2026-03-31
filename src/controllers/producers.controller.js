/**
 * ============================================================================
 * CONTROLLERS/PRODUCERS.CONTROLLER.JS — CRUD de productores (MongoDB)
 * ============================================================================
 *
 * GET    /api/producers               → Listar todos (público)
 * GET    /api/producers/:id           → Ver uno (público)
 * POST   /api/producers               → Crear (admin)
 * PUT    /api/producers/:id           → Actualizar (admin)
 * DELETE /api/producers/:id           → Eliminar (admin)
 * POST   /api/producers/:id/products  → Agregar producto (admin)
 * DELETE /api/producers/:id/products/:productId → Eliminar producto (admin)
 * ============================================================================
 */

import { Producer } from "../models/producer.model.js";
import { validationResult } from "express-validator";
import { io } from "../../index.js";
import { sendSSENotification } from "./notifications.controller.js";
import { supabase } from "../db/supabase.js";

// ─────────────────────────────────────────────
// GET /api/producers  (público)
// ─────────────────────────────────────────────
export const getProducers = async (req, res) => {
  try {
    const { category, search, active } = req.query;

    const filter = {};

    // Filtro por categoría
    if (category) filter.category = category;

    // Filtro por estado activo (por defecto solo activos para el público)
    filter.active = active === "all" ? { $in: [true, false] } : true;

    // Búsqueda full-text
    if (search) {
      filter.$text = { $search: search };
    }

    const producers = await Producer.find(filter)
      .select("-imagePublicId") // No exponer el publicId de Cloudinary
      .sort({ createdAt: -1 });

    res.json(producers);
  } catch (err) {
    console.error("Error en getProducers:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// ─────────────────────────────────────────────
// GET /api/producers/:id  (público)
// ─────────────────────────────────────────────
export const getProducerById = async (req, res) => {
  try {
    const { id } = req.params;

    // Detectar si el ID es un UUID de Supabase (formato: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
    // o un ObjectId de MongoDB (24 caracteres hex)
    const isUUID =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        id,
      );

    let producer;
    if (isUUID) {
      // Buscar por userId (UUID de Supabase)
      producer = await Producer.findOne({ userId: id }).select(
        "-imagePublicId",
      );
    } else {
      // Buscar por _id de MongoDB (ObjectId)
      producer = await Producer.findById(id).select("-imagePublicId");
    }

    if (!producer) {
      return res.status(404).json({ error: "Productor no encontrado" });
    }

    res.json(producer);
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(404).json({ error: "Productor no encontrado" });
    }
    console.error("Error en getProducerById:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// ─────────────────────────────────────────────
// POST /api/producers  (admin)
// ─────────────────────────────────────────────
export const createProducer = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      name,
      description,
      location,
      phone,
      email,
      category,
      userId,
      imageUrl,
    } = req.body;

    const producer = await Producer.create({
      name,
      description,
      location,
      phone,
      email,
      category,
      userId,
      imageUrl,
    });

    // NOTIFICACIÓN EN TIEMPO REAL
    const notification = {
      type: "producer_created",
      message: `Nuevo productor registrado: ${producer.name}`,
      producer: producer,
      timestamp: new Date().toISOString(),
    };
    io.emit("admin:notification", notification);
    sendSSENotification(notification);

    res.status(201).json(producer);
  } catch (err) {
    console.error("Error en createProducer:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// ─────────────────────────────────────────────
// PUT /api/producers/:id  (admin)
// ─────────────────────────────────────────────
export const updateProducer = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const allowed = [
      "name",
      "description",
      "location",
      "phone",
      "email",
      "category",
      "active",
      "imageUrl",
      "imagePublicId",
      "userId",
      "products",
    ];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    const producer = await Producer.findById(req.params.id);

    if (!producer) {
      return res.status(404).json({ error: "Productor no encontrado" });
    }

    // Autorización: admin o el dueño del perfil
    if (req.user.role !== "admin" && req.user.userId !== producer.userId) {
      return res
        .status(403)
        .json({ error: "No tenés permiso para editar este productor" });
    }

    const updatedProducer = await Producer.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true },
    ).select("-imagePublicId");

    // Sincronizar avatar en Supabase si la imagen cambió y hay userId
    if (updates.imageUrl && updatedProducer.userId) {
      await supabase
        .from("users")
        .update({ avatar: updates.imageUrl })
        .eq("id", updatedProducer.userId);
    }

    res.json(updatedProducer);
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(404).json({ error: "Productor no encontrado" });
    }
    console.error("Error en updateProducer:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// ─────────────────────────────────────────────
// DELETE /api/producers/:id  (admin)
// ─────────────────────────────────────────────
export const deleteProducer = async (req, res) => {
  try {
    const producer = await Producer.findByIdAndDelete(req.params.id);

    if (!producer) {
      return res.status(404).json({ error: "Productor no encontrado" });
    }

    res.json({ message: "Productor eliminado correctamente" });
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(404).json({ error: "Productor no encontrado" });
    }
    console.error("Error en deleteProducer:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// ─────────────────────────────────────────────
// POST /api/producers/:id/products  (admin)
// ─────────────────────────────────────────────
export const addProduct = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, imageUrl } = req.body;

    const producer = await Producer.findById(req.params.id);

    if (!producer) {
      return res.status(404).json({ error: "Productor no encontrado" });
    }

    // Autorización: admin o el dueño del perfil
    if (req.user.role !== "admin" && req.user.userId !== producer.userId) {
      return res.status(403).json({
        error: "No tenés permiso para agregar productos a este productor",
      });
    }

    const updatedProducer = await Producer.findByIdAndUpdate(
      req.params.id,
      {
        $push: {
          products: { name, description, imageUrl },
        },
      },
      { new: true, runValidators: true },
    ).select("-imagePublicId");

    // Devolver solo el producto recién agregado
    const newProduct =
      updatedProducer.products[updatedProducer.products.length - 1];

    // NOTIFICACIÓN EN TIEMPO REAL
    const notification = {
      type: "product_added",
      message: `Nuevo producto en ${producer.name}: ${newProduct.name}`,
      product: newProduct,
      producerId: updatedProducer._id,
      timestamp: new Date().toISOString(),
    };
    io.emit("admin:notification", notification);
    sendSSENotification(notification);

    res.status(201).json(newProduct);
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(404).json({ error: "Productor no encontrado" });
    }
    console.error("Error en addProduct:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// ─────────────────────────────────────────────
// DELETE /api/producers/:id/products/:productId  (admin)
// ─────────────────────────────────────────────
export const deleteProduct = async (req, res) => {
  try {
    const producer = await Producer.findById(req.params.id);

    if (!producer) {
      return res.status(404).json({ error: "Productor no encontrado" });
    }

    // Autorización: admin o el dueño del perfil
    if (req.user.role !== "admin" && req.user.userId !== producer.userId) {
      return res.status(403).json({
        error: "No tenés permiso para eliminar productos de este productor",
      });
    }

    await Producer.findByIdAndUpdate(
      req.params.id,
      { $pull: { products: { _id: req.params.productId } } },
      { new: true },
    ).select("-imagePublicId");

    res.json({ message: "Producto eliminado correctamente" });
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(404).json({ error: "Productor no encontrado" });
    }
    console.error("Error en deleteProduct:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// ─────────────────────────────────────────────
// POST /api/producers/:id/comments  (usuario autenticado)
// ─────────────────────────────────────────────
export const addComment = async (req, res) => {
  try {
    const { text, authorName, parentId } = req.body;

    if (!text || text.trim().length === 0) {
      return res
        .status(400)
        .json({ error: "El comentario no puede estar vacío" });
    }
    if (text.length > 500) {
      return res
        .status(400)
        .json({ error: "El comentario no puede superar los 500 caracteres" });
    }

    const newComment = {
      userId: req.user?.userId || null,
      username:
        req.user?.username || req.user?.email || authorName || "Visitante",
      text: text.trim(),
      parentId: parentId || null,
    };

    const producer = await Producer.findByIdAndUpdate(
      req.params.id,
      { $push: { comments: { $each: [newComment], $position: 0 } } },
      { new: true },
    ).select("-imagePublicId");

    if (!producer) {
      return res.status(404).json({ error: "Productor no encontrado" });
    }

    const savedComment = producer.comments[0];
    res.status(201).json(savedComment);
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(404).json({ error: "Productor no encontrado" });
    }
    console.error("Error en addComment:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// ─────────────────────────────────────────────
// DELETE /api/producers/:id/comments/:commentId  (autor o admin)
// ─────────────────────────────────────────────
export const deleteComment = async (req, res) => {
  try {
    const producer = await Producer.findById(req.params.id);

    if (!producer) {
      return res.status(404).json({ error: "Productor no encontrado" });
    }

    const comment = producer.comments.id(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ error: "Comentario no encontrado" });
    }

    // Solo el autor o un admin pueden eliminar el comentario
    if (comment.userId !== req.user.userId && req.user.role !== "admin") {
      return res
        .status(403)
        .json({ error: "No tenés permiso para eliminar este comentario" });
    }

    await Producer.findByIdAndUpdate(req.params.id, {
      $pull: { comments: { _id: req.params.commentId } },
    });

    res.json({ message: "Comentario eliminado correctamente" });
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(404).json({ error: "Recurso no encontrado" });
    }
    console.error("Error en deleteComment:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};
