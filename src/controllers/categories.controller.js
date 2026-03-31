/**
 * ============================================================================
 * CONTROLLERS/CATEGORIES.CONTROLLER.JS — ABM de Categorías de Productores
 * ============================================================================
 *
 * GET    /api/categorias         → Listar todas las categorías (público)
 * POST   /api/categorias         → Crear categoría (admin)
 * PUT    /api/categorias/:id     → Editar nombre/icono (admin)
 * DELETE /api/categorias/:id     → Eliminar (admin, solo si sin productores)
 * ============================================================================
 */

import { supabase } from "../db/supabase.js";

// ─────────────────────────────────────────────
// GET /api/categorias — Público
// ─────────────────────────────────────────────
export const getCategorias = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("categorias")
      .select("*")
      .order("nombre", { ascending: true });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error("getCategorias error:", err);
    res.status(500).json({ error: "No se pudieron obtener las categorías" });
  }
};

// ─────────────────────────────────────────────
// POST /api/categorias — Admin
// ─────────────────────────────────────────────
export const createCategoria = async (req, res) => {
  try {
    const { nombre, icono = "🏷️" } = req.body;

    if (!nombre || nombre.trim() === "") {
      return res.status(400).json({ error: "El nombre es requerido" });
    }

    const { data, error } = await supabase
      .from("categorias")
      .insert({ nombre: nombre.trim().toLowerCase(), icono })
      .select()
      .single();

    if (error) {
      // Código 23505 = unique_violation en PostgreSQL
      if (error.code === "23505") {
        return res.status(409).json({ error: "Ya existe una categoría con ese nombre" });
      }
      throw error;
    }

    res.status(201).json(data);
  } catch (err) {
    console.error("createCategoria error:", err);
    res.status(500).json({ error: "No se pudo crear la categoría" });
  }
};

// ─────────────────────────────────────────────
// PUT /api/categorias/:id — Admin
// ─────────────────────────────────────────────
export const updateCategoria = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, icono } = req.body;

    const updates = {};
    if (nombre) updates.nombre = nombre.trim().toLowerCase();
    if (icono)  updates.icono  = icono.trim();

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "Nada que actualizar" });
    }

    const { data, error } = await supabase
      .from("categorias")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return res.status(409).json({ error: "Ya existe una categoría con ese nombre" });
      }
      throw error;
    }

    if (!data) {
      return res.status(404).json({ error: "Categoría no encontrada" });
    }

    res.json(data);
  } catch (err) {
    console.error("updateCategoria error:", err);
    res.status(500).json({ error: "No se pudo actualizar la categoría" });
  }
};

// ─────────────────────────────────────────────
// DELETE /api/categorias/:id — Admin
// ─────────────────────────────────────────────
export const deleteCategoria = async (req, res) => {
  try {
    const { id } = req.params;

    // Obtener nombre de la categoría a borrar
    const { data: cat, error: catErr } = await supabase
      .from("categorias")
      .select("nombre")
      .eq("id", id)
      .single();

    if (catErr || !cat) {
      return res.status(404).json({ error: "Categoría no encontrada" });
    }

    // Verificar si hay productores usando esta categoría
    const { count, error: countErr } = await supabase
      .from("producers")
      .select("id", { count: "exact", head: true })
      .eq("category", cat.nombre);

    if (countErr) throw countErr;

    if (count > 0) {
      return res.status(409).json({
        error: `No se puede eliminar "${cat.nombre}" porque ${count} productor(es) la tienen asignada.`,
      });
    }

    const { error: deleteErr } = await supabase
      .from("categorias")
      .delete()
      .eq("id", id);

    if (deleteErr) throw deleteErr;

    res.json({ message: `Categoría "${cat.nombre}" eliminada correctamente` });
  } catch (err) {
    console.error("deleteCategoria error:", err);
    res.status(500).json({ error: "No se pudo eliminar la categoría" });
  }
};
