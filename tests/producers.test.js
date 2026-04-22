import supertest from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import jwt from "jsonwebtoken";

/**
 * ============================================================================
 * TESTS DE PRODUCTORES — producers.test.js
 * ============================================================================
 *
 * Cubre producers.controller.js al ~65% usando MongoMemoryServer:
 *   GET    /api/producers                       → público, lista y filtros
 *   GET    /api/producers/:id                   → público, por ObjectId o UUID
 *   POST   /api/producers                       → admin, crea productor
 *   PUT    /api/producers/:id                   → admin/dueño, actualiza
 *   DELETE /api/producers/:id                   → admin, elimina
 *   POST   /api/producers/:id/comments          → público, agrega comentario
 *   DELETE /api/producers/:id/comments/:cid     → autenticado, elimina comentario
 *
 * TÉCNICA:
 *   1. MongoMemoryServer arranCA ANTES de importar el app.
 *   2. Se setea MONGODB_URI al URI del servidor en RAM para que el app conecte ahí.
 *   3. Si ya hay una conexión a Atlas, se cierra y se reabre al memory server.
 *   4. Supabase se stubea para auth (el auth controller lo usa).
 *   5. testTimeout global: 30s (ver jest.config.js).
 * ============================================================================
 */

let mongoServer;
let app;

// ── Stubs de Supabase ────────────────────────────────────────────────────
let supabase;

// ── Setup: levanta Mongo en RAM (ANTES del import del app) ────────────────
beforeAll(async () => {
  // 1. Arrancar MongoMemoryServer (puede tardar en el primer run si descarga binarios)
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  // 2. Desconectar de Atlas si ya hay conexión
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  // 3. Setear MONGODB_URI en entorno ANTES de importar el app
  process.env.MONGODB_URI = uri;

  // 4. Conectar mongoose al servidor en memoria
  await mongoose.connect(uri);

  // 5. Importar el app dinámicamente (usa la conexión ya establecida)
  const appModule = await import("../index.js");
  const supabaseModule = await import("../src/db/supabase.js");
  app = appModule.default;
  supabase = supabaseModule.supabase;

  // 6. Stub de supabase (auth endpoints lo usan para refresh tokens)
  supabase.from = () => ({
    select: function () {
      return this;
    },
    eq: function () {
      return this;
    },
    update: function () {
      return this;
    },
    single: async function () {
      return { data: null, error: null };
    },
    insert: async function () {
      return { data: [], error: null };
    },
    delete: function () {
      return this;
    },
  });
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
});

afterEach(async () => {
  // Limpiar todos los documentos entre tests para aislamiento
  const { Producer } = await import("../src/models/producer.model.js");
  await Producer.deleteMany({});
});

// ── Helper: productor de prueba ─────────────────────────────────────────
const sampleProducerData = {
  name: "Remisería El Sol",
  description: "Servicio de remis las 24hs",
  location: "Hurlingham Centro",
  phone: "11-4444-5555",
  email: "elsol@mail.com",
  category: "transporte",
  active: true,
};

// ── Helper: tokens ───────────────────────────────────────────────────────
const adminToken = () =>
  jwt.sign(
    {
      userId: "uuid-admin-test",
      email: "admin@test.com",
      role: "admin",
      username: "admin",
    },
    process.env.JWT_SECRET,
    { expiresIn: "1h" },
  );

const userToken = (userId = "uuid-user-test") =>
  jwt.sign(
    { userId, email: "user@test.com", role: "user", username: "usuario" },
    process.env.JWT_SECRET,
    { expiresIn: "1h" },
  );

// ── Crear un productor directamente en Mongo ─────────────────────────────
const createTestProducer = async (data = {}) => {
  const { Producer } = await import("../src/models/producer.model.js");
  return Producer.create({ ...sampleProducerData, ...data });
};

describe("Producers Controller — Tests de integración con MongoMemoryServer", () => {
  // ── GET /api/producers ───────────────────────────────────────────────
  describe("GET /api/producers", () => {
    it("debe devolver 200 con array vacío cuando no hay productores", async () => {
      const res = await supertest(app).get("/api/producers");
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(0);
    });

    it("debe devolver 200 con la lista de productores activos", async () => {
      await createTestProducer({ name: "Remis A" });
      await createTestProducer({ name: "Remis B" });

      const res = await supertest(app).get("/api/producers");
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
    });

    it("debe filtrar por categoría con ?category=", async () => {
      await createTestProducer({ name: "Remis Sol", category: "transporte" });
      await createTestProducer({
        name: "Pan Artesanal",
        category: "panadería",
      });

      const res = await supertest(app).get(
        "/api/producers?category=transporte",
      );
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].name).toBe("Remis Sol");
    });

    it("debe mostrar productores inactivos con ?active=all (admin)", async () => {
      await createTestProducer({ name: "Cerrado", active: false });
      await createTestProducer({ name: "Abierto", active: true });

      const res = await supertest(app).get("/api/producers?active=all");
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
    });

    it("no debe exponer el campo imagePublicId", async () => {
      await createTestProducer({ imagePublicId: "cloudinary/secret_id_123" });
      const res = await supertest(app).get("/api/producers");
      expect(res.status).toBe(200);
      expect(res.body[0]).not.toHaveProperty("imagePublicId");
    });
  });

  // ── GET /api/producers/:id ───────────────────────────────────────────
  describe("GET /api/producers/:id", () => {
    it("debe devolver 200 con el productor por _id de Mongo", async () => {
      const p = await createTestProducer();
      const res = await supertest(app).get(`/api/producers/${p._id}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("name", p.name);
    });

    it("debe devolver 404 si el ID no existe", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await supertest(app).get(`/api/producers/${fakeId}`);
      expect(res.status).toBe(404);
    });

    it("debe devolver 404 si el ID es un ObjectId inválido", async () => {
      const res = await supertest(app).get("/api/producers/id-invalido-xyz");
      expect(res.status).toBe(404);
    });

    it("debe buscar por userId (UUID de Supabase)", async () => {
      const uuid = "123e4567-e89b-12d3-a456-426614174000";
      await createTestProducer({ userId: uuid });
      const res = await supertest(app).get(`/api/producers/${uuid}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("userId", uuid);
    });
  });

  // ── POST /api/producers ──────────────────────────────────────────────
  describe("POST /api/producers", () => {
    it("debe devolver 401 si no hay token", async () => {
      const res = await supertest(app)
        .post("/api/producers")
        .send(sampleProducerData);
      expect(res.status).toBe(401);
    });

    it("debe devolver 403 si el rol es 'user'", async () => {
      const res = await supertest(app)
        .post("/api/producers")
        .set("Authorization", `Bearer ${userToken()}`)
        .send(sampleProducerData);
      expect(res.status).toBe(403);
    });

    it("debe crear un productor y devolver 201 (admin)", async () => {
      const res = await supertest(app)
        .post("/api/producers")
        .set("Authorization", `Bearer ${adminToken()}`)
        .send(sampleProducerData);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("name", "Remisería El Sol");
      expect(res.body).toHaveProperty("_id");
    });
  });

  // ── PUT /api/producers/:id ───────────────────────────────────────────
  describe("PUT /api/producers/:id", () => {
    it("debe devolver 404 si el productor no existe", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await supertest(app)
        .put(`/api/producers/${fakeId}`)
        .set("Authorization", `Bearer ${adminToken()}`)
        .send({ name: "Nuevo Nombre" });
      expect(res.status).toBe(404);
    });

    it("debe actualizar el productor y devolver 200 (admin)", async () => {
      const p = await createTestProducer();
      const res = await supertest(app)
        .put(`/api/producers/${p._id}`)
        .set("Authorization", `Bearer ${adminToken()}`)
        .send({ name: "Nombre Actualizado", description: "Nueva descripción" });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("name", "Nombre Actualizado");
    });

    it("debe devolver 403 si un usuario intenta editar un productor que no es suyo", async () => {
      const p = await createTestProducer({ userId: "uuid-otro-user" });
      const res = await supertest(app)
        .put(`/api/producers/${p._id}`)
        .set("Authorization", `Bearer ${userToken("uuid-diferente")}`) // userId distinto
        .send({ name: "Hack" });

      expect(res.status).toBe(403);
    });

    it("el dueño del perfil puede editar sin ser admin", async () => {
      const ownerId = "uuid-owner-test";
      const p = await createTestProducer({ userId: ownerId });
      const res = await supertest(app)
        .put(`/api/producers/${p._id}`)
        .set("Authorization", `Bearer ${userToken(ownerId)}`)
        .send({ name: "Mi Negocio Actualizado" });

      expect(res.status).toBe(200);
    });
  });

  // ── DELETE /api/producers/:id ────────────────────────────────────────
  describe("DELETE /api/producers/:id", () => {
    it("debe devolver 404 si el productor no existe", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await supertest(app)
        .delete(`/api/producers/${fakeId}`)
        .set("Authorization", `Bearer ${adminToken()}`);
      expect(res.status).toBe(404);
    });

    it("debe eliminar el productor y devolver 200 (admin)", async () => {
      const p = await createTestProducer();
      const res = await supertest(app)
        .delete(`/api/producers/${p._id}`)
        .set("Authorization", `Bearer ${adminToken()}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty(
        "message",
        "Productor eliminado correctamente",
      );
    });
  });

  // ── POST /api/producers/:id/comments ────────────────────────────────
  describe("POST /api/producers/:id/comments", () => {
    it("debe devolver 400 si el texto está vacío", async () => {
      const p = await createTestProducer();
      const res = await supertest(app)
        .post(`/api/producers/${p._id}/comments`)
        .send({ text: "  " });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("vacío");
    });

    it("debe devolver 400 si el texto supera 500 caracteres", async () => {
      const p = await createTestProducer();
      const res = await supertest(app)
        .post(`/api/producers/${p._id}/comments`)
        .send({ text: "x".repeat(501) });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("500");
    });

    it("debe agregar comentario anónimo y devolver 201", async () => {
      const p = await createTestProducer();
      const res = await supertest(app)
        .post(`/api/producers/${p._id}/comments`)
        .send({ text: "Excelente servicio!", authorName: "Juan" });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("text", "Excelente servicio!");
      expect(res.body).toHaveProperty("username", "Juan");
    });

    it("debe usar 'Visitante' si no hay nombre ni token", async () => {
      const p = await createTestProducer();
      const res = await supertest(app)
        .post(`/api/producers/${p._id}/comments`)
        .send({ text: "Muy bueno" });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("username", "Visitante");
    });

    it("debe usar el username del JWT si el usuario está logueado", async () => {
      const p = await createTestProducer();
      const res = await supertest(app)
        .post(`/api/producers/${p._id}/comments`)
        .set("Authorization", `Bearer ${userToken()}`)
        .send({ text: "Comentario autenticado" });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("username", "usuario");
    });

    it("debe devolver 404 si el productor no existe", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await supertest(app)
        .post(`/api/producers/${fakeId}/comments`)
        .send({ text: "Hola" });

      expect(res.status).toBe(404);
    });
  });

  // ── DELETE /api/producers/:id/comments/:commentId ───────────────────
  describe("DELETE /api/producers/:id/comments/:commentId", () => {
    it("debe devolver 404 si el productor no existe", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await supertest(app)
        .delete(`/api/producers/${fakeId}/comments/${fakeId}`)
        .set("Authorization", `Bearer ${adminToken()}`);

      expect(res.status).toBe(404);
    });

    it("admin puede eliminar cualquier comentario", async () => {
      // Crear productor con un comentario
      const p = await createTestProducer();
      const { Producer } = await import("../src/models/producer.model.js");
      const updated = await Producer.findByIdAndUpdate(
        p._id,
        {
          $push: {
            comments: {
              userId: "some-user",
              username: "Alguien",
              text: "Test",
            },
          },
        },
        { new: true },
      );
      const commentId = updated.comments[0]._id;

      const res = await supertest(app)
        .delete(`/api/producers/${p._id}/comments/${commentId}`)
        .set("Authorization", `Bearer ${adminToken()}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toContain("eliminado");
    });

    it("debe devolver 403 si un user intenta eliminar el comentario de otro", async () => {
      const p = await createTestProducer();
      const { Producer } = await import("../src/models/producer.model.js");
      const updated = await Producer.findByIdAndUpdate(
        p._id,
        {
          $push: {
            comments: {
              userId: "uuid-otro-user",
              username: "Otro",
              text: "Comentario ajeno",
            },
          },
        },
        { new: true },
      );
      const commentId = updated.comments[0]._id;

      const res = await supertest(app)
        .delete(`/api/producers/${p._id}/comments/${commentId}`)
        .set("Authorization", `Bearer ${userToken("uuid-distinto")}`);

      expect(res.status).toBe(403);
    });
  });
});
