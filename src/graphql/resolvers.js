/**
 * ============================================================================
 * GRAPHQL/RESOLVERS.JS — Resolutores de Queries
 * ============================================================================
 */

import { supabase } from "../db/supabase.js";
import { Producer } from "../models/producer.model.js";

export const resolvers = {
  Query: {
    // ─────────────────────────────────────────────
    // USUARIOS (Supabase)
    // ─────────────────────────────────────────────
    users: async (_, __, context) => {
      // Opcional: Verificar si el usuario es admin vía context
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw new Error(error.message);
      return data;
    },

    user: async (_, { id }) => {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw new Error(error.message);
      return data;
    },

    me: async (_, __, context) => {
      if (!context.user) return null;
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", context.user.userId)
        .single();
      if (error) return null;
      return data;
    },

    // ─────────────────────────────────────────────
    // PRODUCTORES (MongoDB)
    // ─────────────────────────────────────────────
    producers: async (_, { category, search }) => {
      const filter = {};
      if (category) filter.category = category;
      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
        ];
      }

      const producers = await Producer.find(filter).lean();
      return producers.map((p) => ({
        ...p,
        id: p._id.toString(),
        products: p.products.map((prod) => ({
          ...prod,
          id: prod._id.toString(),
        })),
        comments: (p.comments || []).map((c) => ({
          ...c,
          id: c._id.toString(),
          createdAt: c.createdAt
            ? c.createdAt.toISOString()
            : new Date().toISOString(),
        })),
      }));
    },

    producer: async (_, { id }) => {
      // Detectar si el ID es un UUID de Supabase o un ObjectId de MongoDB
      const isUUID =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          id,
        );

      const p = isUUID
        ? await Producer.findOne({ userId: id }).lean()
        : await Producer.findById(id).lean();

      if (!p) return null;
      return {
        ...p,
        id: p._id.toString(),
        products: p.products.map((prod) => ({
          ...prod,
          id: prod._id.toString(),
        })),
        comments: (p.comments || []).map((c) => ({
          ...c,
          id: c._id.toString(),
          createdAt: c.createdAt
            ? c.createdAt.toISOString()
            : new Date().toISOString(),
        })),
      };
    },

    producerByUserId: async (_, { userId }) => {
      const p = await Producer.findOne({ userId }).lean();
      if (!p) return null;
      return {
        ...p,
        id: p._id.toString(),
        products: p.products.map((prod) => ({
          ...prod,
          id: prod._id.toString(),
        })),
      };
    },
  },

  // ─────────────────────────────────────────────
  // RELACIONES (Campos calculados)
  // ─────────────────────────────────────────────
  User: {
    producer: async (parent) => {
      const p = await Producer.findOne({ userId: parent.id }).lean();
      if (!p) return null;
      return {
        ...p,
        id: p._id.toString(),
      };
    },
  },

  Producer: {
    user: async (parent) => {
      if (!parent.userId) return null;
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", parent.userId)
        .single();
      if (error) return null;
      return data;
    },
  },
};
