import supertest from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import jwt from "jsonwebtoken";

/**
 * ============================================================================
 * TESTS DE CONTACTO — contact.test.js
 * ============================================================================
 *
 * Cubre contact.controller.js usando MongoMemoryServer propio.
 * (Cada worker de Jest corre en proceso separado — no comparte conexiones.)
 *
 * Rutas cubiertas:
 *   POST  /api/contact          → enviar mensaje (público)
 *   GET   /api/contact          → listar mensajes (solo admin)
 *   PATCH /api/contact/:id/read → marcar leído/no leído (solo admin)
 * ============================================================================
 */

let app;
let mongoServer;

// ── Helpers de tokens ────────────────────────────────────────────────────
const adminToken = () =>
  jwt.sign(
    {
      userId: "uuid-admin-001",
      email: "admin@test.com",
      role: "admin",
      username: "admin",
    },
    process.env.JWT_SECRET,
    { expiresIn: "1h" },
  );

const userToken = () =>
  jwt.sign(
    {
      userId: "uuid-user-001",
      email: "user@test.com",
      role: "user",
      username: "usuario",
    },
    process.env.JWT_SECRET,
    { expiresIn: "1h" },
  );

// ── Setup ────────────────────────────────────────────────────────────────
beforeAll(async () => {
  // Levantar MongoDB en RAM
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  // Desconectar si hay conexión previa (a Atlas) y reconectar al memory server
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  process.env.MONGODB_URI = uri;
  await mongoose.connect(uri);

  const appModule = await import("../index.js");
  app = appModule.default;
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
});

afterEach(async () => {
  // Limpiar colección Contact entre tests
  const { Contact } = await import("../src/models/contact.model.js");
  await Contact.deleteMany({});
});

// ── Helper para insertar un mensaje directamente ──────────────────────────
const createTestMessage = async (data = {}) => {
  const { Contact } = await import("../src/models/contact.model.js");
  return Contact.create({
    name: "Juan Pérez",
    email: "juan@test.com",
    message: "Mensaje de prueba",
    ...data,
  });
};

// ============================================================
// POST /api/contact
// ============================================================
describe("POST /api/contact", () => {
  it("debe devolver 400 si falta el nombre", async () => {
    const res = await supertest(app)
      .post("/api/contact")
      .send({ email: "test@test.com", message: "Hola" });
    expect(res.status).toBe(400);
  });

  it("debe devolver 400 si el email es inválido", async () => {
    const res = await supertest(app)
      .post("/api/contact")
      .send({ name: "Ana", email: "no-es-email", message: "Hola" });
    expect(res.status).toBe(400);
  });

  it("debe devolver 400 si falta el mensaje", async () => {
    const res = await supertest(app)
      .post("/api/contact")
      .send({ name: "Ana", email: "ana@test.com" });
    expect(res.status).toBe(400);
  });

  it("debe enviar un mensaje y devolver 201", async () => {
    const res = await supertest(app).post("/api/contact").send({
      name: "María García",
      email: "maria@test.com",
      phone: "11-2222-3333",
      message: "Quería consultar por los horarios",
    });

    expect(res.status).toBe(201);
    expect(res.body.message).toContain("Mensaje enviado");
    expect(res.body.data).toHaveProperty("name", "María García");
    expect(res.body.data).toHaveProperty("read", false); // por defecto no leído
  });

  it("debe guardar el mensaje sin teléfono (campo opcional)", async () => {
    const res = await supertest(app).post("/api/contact").send({
      name: "Sin Telefono",
      email: "sin@test.com",
      message: "Mensaje sin teléfono",
    });

    expect(res.status).toBe(201);
    expect(res.body.data).toHaveProperty("name", "Sin Telefono");
  });
});

// ============================================================
// GET /api/contact  (solo admin)
// ============================================================
describe("GET /api/contact", () => {
  it("debe devolver 401 sin token", async () => {
    const res = await supertest(app).get("/api/contact");
    expect(res.status).toBe(401);
  });

  it("debe devolver 403 si el rol es 'user'", async () => {
    const res = await supertest(app)
      .get("/api/contact")
      .set("Authorization", `Bearer ${userToken()}`);
    expect(res.status).toBe(403);
  });

  it("debe devolver 200 con array vacío si no hay mensajes", async () => {
    const res = await supertest(app)
      .get("/api/contact")
      .set("Authorization", `Bearer ${adminToken()}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(0);
  });

  it("debe devolver todos los mensajes ordenados por fecha (admin)", async () => {
    await createTestMessage({ name: "Primero", email: "a@test.com" });
    await createTestMessage({ name: "Segundo", email: "b@test.com" });

    const res = await supertest(app)
      .get("/api/contact")
      .set("Authorization", `Bearer ${adminToken()}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    // Los más recientes primero (sort desc)
    expect(res.body[0]).toHaveProperty("name", "Segundo");
  });
});

// ============================================================
// PATCH /api/contact/:id/read  (solo admin)
// ============================================================
describe("PATCH /api/contact/:id/read", () => {
  it("debe devolver 401 sin token", async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await supertest(app)
      .patch(`/api/contact/${fakeId}/read`)
      .send({ read: true });
    expect(res.status).toBe(401);
  });

  it("debe devolver 400 si falta el campo 'read'", async () => {
    const msg = await createTestMessage();
    const res = await supertest(app)
      .patch(`/api/contact/${msg._id}/read`)
      .set("Authorization", `Bearer ${adminToken()}`)
      .send({}); // sin 'read'

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("requerido");
  });

  it("debe marcar un mensaje como leído", async () => {
    const msg = await createTestMessage();
    const res = await supertest(app)
      .patch(`/api/contact/${msg._id}/read`)
      .set("Authorization", `Bearer ${adminToken()}`)
      .send({ read: true });

    expect(res.status).toBe(200);
    expect(res.body.data.read).toBe(true);
  });

  it("debe marcar un mensaje como NO leído", async () => {
    const { Contact } = await import("../src/models/contact.model.js");
    const msg = await Contact.create({
      name: "Test",
      email: "t@t.com",
      message: "Hola",
      read: true,
    });

    const res = await supertest(app)
      .patch(`/api/contact/${msg._id}/read`)
      .set("Authorization", `Bearer ${adminToken()}`)
      .send({ read: false });

    expect(res.status).toBe(200);
    expect(res.body.data.read).toBe(false);
  });

  it("debe devolver 404 si el ID no existe", async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await supertest(app)
      .patch(`/api/contact/${fakeId}/read`)
      .set("Authorization", `Bearer ${adminToken()}`)
      .send({ read: true });

    expect(res.status).toBe(404);
  });

  it("debe devolver 404 si el ID es un ObjectId inválido (CastError)", async () => {
    const res = await supertest(app)
      .patch("/api/contact/id-invalido/read")
      .set("Authorization", `Bearer ${adminToken()}`)
      .send({ read: true });

    expect(res.status).toBe(404);
  });
});
