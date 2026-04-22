import supertest from "supertest";
import app from "../index.js";
import { supabase } from "../src/db/supabase.js";
import { Producer } from "../src/models/producer.model.js";
import jwt from "jsonwebtoken";

/**
 * ============================================================================
 * TESTS DE CATEGORÍAS — categories.test.js
 * ============================================================================
 *
 * Cubre categories.controller.js al ~70%:
 *   GET    /api/categorias        → público, devuelve lista
 *   POST   /api/categorias        → admin, crea categoría
 *   PUT    /api/categorias/:id    → admin, actualiza categoría
 *   DELETE /api/categorias/:id    → admin, elimina si no tiene productores
 *
 * Técnica: stub manual de supabase.from() por escenario.
 * Los métodos de Supabase se encadenan (fluent builder), los terminales
 * son async (single, order, delete) para poder ser await-eados.
 * ============================================================================
 */

// ─── Builder base ─────────────────────────────────────────────────────────
const catBuilder = {
  select: function () {
    return this;
  },
  order: async function () {
    return { data: [], error: null };
  },
  eq: function () {
    return this;
  },
  single: async function () {
    return { data: null, error: null };
  },
  insert: function () {
    return this;
  },
  update: function () {
    return this;
  },
  delete: async function () {
    return { error: null };
  },
};

beforeAll(() => {});

afterEach(() => {
  // Reset a los defaults tras cada test
  catBuilder.order = async function () {
    return { data: [], error: null };
  };
  catBuilder.single = async function () {
    return { data: null, error: null };
  };
  catBuilder.delete = async function () {
    return { error: null };
  };
});

/** Genera un JWT de admin para pruebas */
const adminToken = () =>
  jwt.sign(
    {
      userId: "uuid-admin-cat",
      email: "admin@test.com",
      role: "admin",
      username: "admin",
    },
    process.env.JWT_SECRET,
    { expiresIn: "1h" },
  );

describe("Categories Controller — Tests de integración", () => {
  // ── GET /api/categorias ──────────────────────────────────────────────
  describe("GET /api/categorias", () => {
    it("debe devolver 200 con array vacío si no hay categorías", async () => {
      supabase.from = () => catBuilder;

      const res = await supertest(app).get("/api/categorias");
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it("debe devolver 200 con la lista de categorías", async () => {
      catBuilder.order = async function () {
        return {
          data: [
            { id: 1, nombre: "frutas", icono: "🍎" },
            { id: 2, nombre: "verduras", icono: "🥦" },
          ],
          error: null,
        };
      };
      supabase.from = () => catBuilder;

      const res = await supertest(app).get("/api/categorias");
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      expect(res.body[0]).toHaveProperty("nombre", "frutas");
    });

    it("debe devolver 500 si Supabase devuelve un error", async () => {
      catBuilder.order = async function () {
        return { data: null, error: { message: "DB error" } };
      };
      supabase.from = () => catBuilder;

      const res = await supertest(app).get("/api/categorias");
      expect(res.status).toBe(500);
    });
  });

  // ── POST /api/categorias ─────────────────────────────────────────────
  describe("POST /api/categorias", () => {
    it("debe devolver 400 si no se envía nombre", async () => {
      supabase.from = () => catBuilder;
      const res = await supertest(app)
        .post("/api/categorias")
        .set("Authorization", `Bearer ${adminToken()}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("error", "El nombre es requerido");
    });

    it("debe devolver 400 si nombre es un string vacío", async () => {
      supabase.from = () => catBuilder;
      const res = await supertest(app)
        .post("/api/categorias")
        .set("Authorization", `Bearer ${adminToken()}`)
        .send({ nombre: "   " });

      expect(res.status).toBe(400);
    });

    it("debe devolver 201 con la nueva categoría creada", async () => {
      catBuilder.single = async function () {
        return {
          data: { id: 5, nombre: "lácteos", icono: "🥛" },
          error: null,
        };
      };
      supabase.from = () => catBuilder;

      const res = await supertest(app)
        .post("/api/categorias")
        .set("Authorization", `Bearer ${adminToken()}`)
        .send({ nombre: "Lácteos", icono: "🥛" });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("nombre", "lácteos");
    });

    it("debe devolver 409 si el nombre ya existe (unique_violation)", async () => {
      catBuilder.single = async function () {
        return {
          data: null,
          error: { code: "23505", message: "unique violation" },
        };
      };
      supabase.from = () => catBuilder;

      const res = await supertest(app)
        .post("/api/categorias")
        .set("Authorization", `Bearer ${adminToken()}`)
        .send({ nombre: "frutas" });

      expect(res.status).toBe(409);
      expect(res.body.error).toContain("Ya existe");
    });
  });

  // ── PUT /api/categorias/:id ──────────────────────────────────────────
  describe("PUT /api/categorias/:id", () => {
    it("debe devolver 400 si no se envían campos a actualizar", async () => {
      supabase.from = () => catBuilder;
      const res = await supertest(app)
        .put("/api/categorias/1")
        .set("Authorization", `Bearer ${adminToken()}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("error", "Nada que actualizar");
    });

    it("debe devolver 200 con la categoría actualizada", async () => {
      catBuilder.single = async function () {
        return {
          data: { id: 1, nombre: "frutas frescas", icono: "🍎" },
          error: null,
        };
      };
      supabase.from = () => catBuilder;

      const res = await supertest(app)
        .put("/api/categorias/1")
        .set("Authorization", `Bearer ${adminToken()}`)
        .send({ nombre: "Frutas Frescas" });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("nombre", "frutas frescas");
    });

    it("debe devolver 404 si la categoría no existe", async () => {
      catBuilder.single = async function () {
        return { data: null, error: null }; // supabase devuelve null cuando no encuentra
      };
      supabase.from = () => catBuilder;

      const res = await supertest(app)
        .put("/api/categorias/9999")
        .set("Authorization", `Bearer ${adminToken()}`)
        .send({ nombre: "Inexistente" });

      expect(res.status).toBe(404);
    });
  });

  // ── DELETE /api/categorias/:id ───────────────────────────────────────
  describe("DELETE /api/categorias/:id", () => {
    it("debe devolver 404 si la categoría no existe", async () => {
      catBuilder.single = async function () {
        return { data: null, error: { message: "not found" } };
      };
      // El delete usa from() dos veces: categorias + producers
      supabase.from = () => catBuilder;

      const res = await supertest(app)
        .delete("/api/categorias/9999")
        .set("Authorization", `Bearer ${adminToken()}`);

      expect(res.status).toBe(404);
    });

    it("debe devolver 409 si hay productores asignados a la categoría", async () => {
      supabase.from = () => ({
        select: function() { return this; },
        eq:     function() { return this; },
        single: async function() { return { data: { nombre: "frutas" }, error: null }; },
      });

      const originalCount = Producer.countDocuments;
      Producer.countDocuments = async () => 3;

      const res = await supertest(app)
        .delete("/api/categorias/1")
        .set("Authorization", `Bearer ${adminToken()}`);

      expect(res.status).toBe(409);
      expect(res.body.error).toContain("No se puede eliminar");
      
      Producer.countDocuments = originalCount;
    });

    it("debe devolver 200 si la categoría se elimina correctamente", async () => {
      supabase.from = () => ({
        select: function() { return this; },
        eq:     function() { return this; },
        single: async function() { return { data: { nombre: "frutas" }, error: null }; },
        delete: function() { return { eq: async function() { return { error: null }; } }; },
      });

      const originalCount = Producer.countDocuments;
      Producer.countDocuments = async () => 0;

      const res = await supertest(app)
        .delete("/api/categorias/1")
        .set("Authorization", `Bearer ${adminToken()}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toContain("eliminada");

      Producer.countDocuments = originalCount;
    });
  });
});
