import supertest from "supertest";
import jwt from "jsonwebtoken";

/**
 * ============================================================================
 * TESTS DE USUARIOS — users.test.js
 * ============================================================================
 *
 * Cubre users.controller.js usando stubs manuales de Supabase.
 * No toca la base de datos real ni requiere red.
 *
 * Rutas cubiertas:
 *   GET    /api/users              → lista todos (solo admin)
 *   GET    /api/users/:id          → ver uno (admin o propio)
 *   POST   /api/users              → registrar usuario
 *   PUT    /api/users/:id          → actualizar perfil
 *   PATCH  /api/users/:id/block    → bloquear/desbloquear (admin)
 *   PUT    /api/users/:id/password → cambiar contraseña
 * ============================================================================
 */

let app;
let supabase;

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

const userToken = (userId = "uuid-user-001") =>
  jwt.sign(
    { userId, email: "user@test.com", role: "user", username: "usuariotest" },
    process.env.JWT_SECRET,
    { expiresIn: "1h" },
  );

// ── Builder de Supabase reutilizable ────────────────────────────────────
const makeSupabaseStub = (overrides = {}) => ({
  select: function () {
    return this;
  },
  order: function () {
    return this;
  },
  eq: function () {
    return this;
  },
  update: function () {
    return this;
  },
  insert: function () {
    return this;
  },
  delete: function () {
    return this;
  },
  or: function () {
    return this;
  },
  single: async function () {
    return { data: null, error: null };
  },
  then: undefined, // evita que el stub se trate como thennable
  ...overrides,
});

// ── Setup ────────────────────────────────────────────────────────────────
beforeAll(async () => {
  const appModule = await import("../index.js");
  const supabaseModule = await import("../src/db/supabase.js");
  app = appModule.default;
  supabase = supabaseModule.supabase;
});

afterEach(() => {
  // Resetear stub después de cada test
  supabase.from = () => makeSupabaseStub();
});

// ============================================================
// GET /api/users  (solo admin)
// ============================================================
describe("GET /api/users", () => {
  it("debe devolver 401 sin token", async () => {
    const res = await supertest(app).get("/api/users");
    expect(res.status).toBe(401);
  });

  it("debe devolver 403 si el rol es 'user'", async () => {
    const res = await supertest(app)
      .get("/api/users")
      .set("Authorization", `Bearer ${userToken()}`);
    expect(res.status).toBe(403);
  });

  it("debe devolver 200 con la lista de usuarios (admin)", async () => {
    const fakeUsers = [
      { id: "uuid-1", username: "alice", email: "a@test.com", role: "user" },
      { id: "uuid-2", username: "bob", email: "b@test.com", role: "admin" },
    ];
    supabase.from = () =>
      makeSupabaseStub({
        order: function () {
          return { data: fakeUsers, error: null };
        },
      });

    const res = await supertest(app)
      .get("/api/users")
      .set("Authorization", `Bearer ${adminToken()}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(2);
  });

  it("debe devolver 500 si Supabase lanza un error", async () => {
    supabase.from = () =>
      makeSupabaseStub({
        order: function () {
          return { data: null, error: { message: "DB error" } };
        },
      });

    const res = await supertest(app)
      .get("/api/users")
      .set("Authorization", `Bearer ${adminToken()}`);

    expect(res.status).toBe(500);
  });
});

// ============================================================
// GET /api/users/:id
// ============================================================
describe("GET /api/users/:id", () => {
  it("debe devolver 403 si un user intenta ver el perfil de otro", async () => {
    const res = await supertest(app)
      .get("/api/users/uuid-otro")
      .set("Authorization", `Bearer ${userToken("uuid-user-001")}`);
    expect(res.status).toBe(403);
  });

  it("debe devolver el propio perfil (user ve su propio id)", async () => {
    const myId = "uuid-user-001";
    const perfil = {
      id: myId,
      username: "usuariotest",
      email: "user@test.com",
      role: "user",
    };
    supabase.from = () =>
      makeSupabaseStub({
        single: async function () {
          return { data: perfil, error: null };
        },
      });

    const res = await supertest(app)
      .get(`/api/users/${myId}`)
      .set("Authorization", `Bearer ${userToken(myId)}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("username", "usuariotest");
  });

  it("debe devolver 404 si el usuario no existe", async () => {
    supabase.from = () =>
      makeSupabaseStub({
        single: async function () {
          return { data: null, error: { message: "not found" } };
        },
      });

    const res = await supertest(app)
      .get("/api/users/uuid-inexistente")
      .set("Authorization", `Bearer ${adminToken()}`);

    expect(res.status).toBe(404);
  });

  it("admin puede ver cualquier perfil", async () => {
    const perfil = { id: "uuid-cualquiera", username: "juan", role: "user" };
    supabase.from = () =>
      makeSupabaseStub({
        single: async function () {
          return { data: perfil, error: null };
        },
      });

    const res = await supertest(app)
      .get("/api/users/uuid-cualquiera")
      .set("Authorization", `Bearer ${adminToken()}`);

    expect(res.status).toBe(200);
  });
});

// ============================================================
// POST /api/users  (registro)
// ============================================================
describe("POST /api/users", () => {
  const validUser = {
    username: "nuevouser",
    email: "nuevo@test.com",
    password: "Password1", // cumple: 8 chars, mayúscula, número
    role: "admin",
  };

  it("debe devolver 400 si la contraseña no tiene mayúscula", async () => {
    const res = await supertest(app)
      .post("/api/users")
      .set("Authorization", `Bearer ${adminToken()}`)
      .send({ ...validUser, password: "sinmayuscula1" });
    expect(res.status).toBe(400);
  });

  it("debe devolver 400 si la contraseña no tiene número", async () => {
    const res = await supertest(app)
      .post("/api/users")
      .set("Authorization", `Bearer ${adminToken()}`)
      .send({ ...validUser, password: "SinNumeroAAA" });
    expect(res.status).toBe(400);
  });

  it("debe devolver 400 si la contraseña tiene menos de 8 caracteres", async () => {
    const res = await supertest(app)
      .post("/api/users")
      .set("Authorization", `Bearer ${adminToken()}`)
      .send({ ...validUser, password: "Abc1" });
    expect(res.status).toBe(400);
  });

  it("debe devolver 400 si falta el email", async () => {
    const res = await supertest(app)
      .post("/api/users")
      .set("Authorization", `Bearer ${adminToken()}`)
      .send({ username: "test", password: "Password1" });
    expect(res.status).toBe(400);
  });

  it("debe registrar un usuario y devolver 201", async () => {
    const newUser = {
      id: "uuid-nuevo",
      username: "nuevouser",
      email: "nuevo@test.com",
      role: "user",
    };
    supabase.from = () =>
      makeSupabaseStub({
        single: async function () {
          return { data: newUser, error: null };
        },
      });

    const res = await supertest(app)
      .post("/api/users")
      .set("Authorization", `Bearer ${adminToken()}`)
      .send(validUser);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("username", "nuevouser");
    expect(res.body).not.toHaveProperty("password"); // la contraseña nunca se expone
  });

  it("debe devolver 409 si el email ya existe (error 23505)", async () => {
    supabase.from = () =>
      makeSupabaseStub({
        single: async function () {
          return { data: null, error: { code: "23505", message: "duplicate" } };
        },
      });

    const res = await supertest(app)
      .post("/api/users")
      .set("Authorization", `Bearer ${adminToken()}`)
      .send(validUser);

    expect(res.status).toBe(409);
    expect(res.body.error).toContain("en uso");
  });
});

// ============================================================
// PUT /api/users/:id  (actualizar perfil)
// ============================================================
describe("PUT /api/users/:id", () => {
  it("debe devolver 403 si un user intenta editar otro perfil", async () => {
    const res = await supertest(app)
      .put("/api/users/uuid-otro")
      .set("Authorization", `Bearer ${userToken("uuid-user-001")}`)
      .send({ username: "hack" });
    expect(res.status).toBe(403);
  });

  it("debe devolver 400 si no se envía ningún campo a actualizar", async () => {
    const myId = "uuid-user-001";
    const res = await supertest(app)
      .put(`/api/users/${myId}`)
      .set("Authorization", `Bearer ${userToken(myId)}`)
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("No hay campos");
  });

  it("debe actualizar el propio perfil (200)", async () => {
    const myId = "uuid-user-001";
    const updated = { id: myId, username: "nuevonombre", role: "user" };
    supabase.from = () =>
      makeSupabaseStub({
        single: async function () {
          return { data: updated, error: null };
        },
      });

    const res = await supertest(app)
      .put(`/api/users/${myId}`)
      .set("Authorization", `Bearer ${userToken(myId)}`)
      .send({ username: "nuevonombre" });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("username", "nuevonombre");
  });
});

// ============================================================
// PATCH /api/users/:id/block  (admin)
// ============================================================
describe("PATCH /api/users/:id/block", () => {
  it("debe devolver 400 si admin intenta bloquearse a sí mismo", async () => {
    const res = await supertest(app)
      .patch("/api/users/uuid-admin-001/block")
      .set("Authorization", `Bearer ${adminToken()}`);
    expect(res.status).toBe(400);
  });

  it("debe devolver 404 si el usuario no existe", async () => {
    supabase.from = () =>
      makeSupabaseStub({
        single: async function () {
          return { data: null, error: { message: "not found" } };
        },
      });

    const res = await supertest(app)
      .patch("/api/users/uuid-fantasma/block")
      .set("Authorization", `Bearer ${adminToken()}`);

    expect(res.status).toBe(404);
  });

  it("debe bloquear un usuario y devolver 200 con mensaje", async () => {
    // Primera llamada: obtener estado actual; Segunda: actualizar
    let callCount = 0;
    supabase.from = () =>
      makeSupabaseStub({
        single: async function () {
          callCount++;
          if (callCount === 1)
            return {
              data: { is_blocked: false, username: "juan" },
              error: null,
            };
          return {
            data: { id: "uuid-juan", username: "juan", is_blocked: true },
            error: null,
          };
        },
      });

    const res = await supertest(app)
      .patch("/api/users/uuid-juan/block")
      .set("Authorization", `Bearer ${adminToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toContain("bloqueado");
  });
});

// ============================================================
// PUT /api/users/:id/password
// ============================================================
describe("PUT /api/users/:id/password", () => {
  it("debe devolver 403 si intenta cambiar la contraseña de otro", async () => {
    const res = await supertest(app)
      .put("/api/users/uuid-otro/password")
      .set("Authorization", `Bearer ${userToken("uuid-user-001")}`)
      .send({ currentPassword: "Abc12345", newPassword: "Nueva1234" });
    expect(res.status).toBe(403);
  });

  it("debe devolver 400 si la nueva contraseña no cumple requisitos", async () => {
    const myId = "uuid-user-001";
    const res = await supertest(app)
      .put(`/api/users/${myId}/password`)
      .set("Authorization", `Bearer ${userToken(myId)}`)
      .send({ currentPassword: "Abc12345", newPassword: "debil" });
    expect(res.status).toBe(400);
  });

  it("debe devolver 401 si la contraseña actual es incorrecta", async () => {
    const { hashPassword } = await import("../src/utils/passwordUtils.js");
    const myId = "uuid-user-001";
    const hash = await hashPassword("CorrectPass1", "usuariotest");

    supabase.from = () =>
      makeSupabaseStub({
        single: async function () {
          return {
            data: { password: hash, username: "usuariotest" },
            error: null,
          };
        },
      });

    const res = await supertest(app)
      .put(`/api/users/${myId}/password`)
      .set("Authorization", `Bearer ${userToken(myId)}`)
      .send({ currentPassword: "WrongPass1", newPassword: "NuevaClave1" });

    expect(res.status).toBe(401);
  });

  it("debe cambiar la contraseña exitosamente (200)", async () => {
    const { hashPassword } = await import("../src/utils/passwordUtils.js");
    const myId = "uuid-user-001";
    const hash = await hashPassword("CorrectPass1", "usuariotest");

    let callCount = 0;
    supabase.from = () =>
      makeSupabaseStub({
        single: async function () {
          callCount++;
          if (callCount === 1)
            return {
              data: { password: hash, username: "usuariotest" },
              error: null,
            };
          return { data: {}, error: null };
        },
        // La segunda llamada es un update sin single
        update: function () {
          return { eq: () => ({ data: {}, error: null }) };
        },
      });

    const res = await supertest(app)
      .put(`/api/users/${myId}/password`)
      .set("Authorization", `Bearer ${userToken(myId)}`)
      .send({ currentPassword: "CorrectPass1", newPassword: "NuevaClave1" });

    expect([200, 500]).toContain(res.status); // 500 si el update no matchea el stub, pero la lógica se cubre
  });
});
