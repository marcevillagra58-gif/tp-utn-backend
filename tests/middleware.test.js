import supertest from "supertest";
import app from "../index.js";
import { supabase } from "../src/db/supabase.js";
import jwt from "jsonwebtoken";

/**
 * ============================================================================
 * TESTS DE MIDDLEWARE — middleware.test.js
 * ============================================================================
 *
 * Cubre auth.middleware.js al ~80%:
 *   - authMiddleware:         sin token, token inválido, token expirado, token válido
 *   - adminMiddleware:        rol insuficiente (user → 403), rol correcto (admin → pasa)
 *   - optionalAuthMiddleware: implícitamente cubierto por GET /api/categorias (ruta pública)
 *
 * Técnica: se generan JWT reales con jwt.sign() usando el mismo secreto del beforeAll.
 * Ninguno de estos tests necesita mockear Supabase porque el middleware rechaza
 * antes de llegar al controlador en los casos de error.
 * ============================================================================
 */

const mockCatBuilder = {
  select:  function() { return this; },
  order:   async function() { return { data: [], error: null }; },
  eq:      function() { return this; },
  single:  async function() { return { data: { id: 1, nombre: "frutas", icono: "🍎" }, error: null }; },
  insert:  function() { return this; },
  update:  function() { return this; },
  delete:  async function() { return { error: null }; },
};

beforeAll(() => {
  process.env.JWT_SECRET          = "test_super_secret_key_123456";
  process.env.JWT_REFRESH_SECRET  = "test_refresh_super_secret_key_123456";
  supabase.from = () => mockCatBuilder;
});

/** Genera un token JWT de prueba con el rol indicado */
const makeToken = (role = "user", expiry = "1h") =>
  jwt.sign(
    { userId: "uuid-test-mw", email: "test@test.com", role, username: "tester" },
    process.env.JWT_SECRET,
    { expiresIn: expiry },
  );

describe("Auth Middleware — Tests de integración", () => {

  // ── authMiddleware ─────────────────────────────────────────────────────
  describe("authMiddleware", () => {

    it("debe retornar 401 si no se envía header Authorization", async () => {
      const res = await supertest(app)
        .post("/api/categorias")
        .send({ nombre: "Test" });

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty("error", "Token de autenticación requerido");
    });

    it("debe retornar 401 si el header no empieza con 'Bearer '", async () => {
      const res = await supertest(app)
        .post("/api/categorias")
        .set("Authorization", "Basic xyz123")
        .send({ nombre: "Test" });

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty("error", "Token de autenticación requerido");
    });

    it("debe retornar 401 si el token es una cadena inválida", async () => {
      const res = await supertest(app)
        .post("/api/categorias")
        .set("Authorization", "Bearer token_invalido_con_basura")
        .send({ nombre: "Test" });

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty("error", "Token inválido");
    });

    it("debe retornar 401 si el token está expirado", async () => {
      // Generamos un token que ya nació expirado (expiresIn: -1s)
      const expiredToken = makeToken("admin", "-1s");

      const res = await supertest(app)
        .post("/api/categorias")
        .set("Authorization", `Bearer ${expiredToken}`)
        .send({ nombre: "Test" });

      expect(res.status).toBe(401);
      expect(res.body.error).toContain("expirado");
    });

  });

  // ── adminMiddleware ────────────────────────────────────────────────────
  describe("adminMiddleware", () => {

    it("debe retornar 403 si el token es válido pero el rol es 'user'", async () => {
      const userToken = makeToken("user");

      const res = await supertest(app)
        .post("/api/categorias")
        .set("Authorization", `Bearer ${userToken}`)
        .send({ nombre: "Test" });

      expect(res.status).toBe(403);
      expect(res.body).toHaveProperty("error", "Acceso denegado. Se requiere rol admin.");
    });

    it("debe dejar pasar al controlador si el token es válido con rol 'admin'", async () => {
      const adminToken = makeToken("admin");

      // Sin nombre→ el controlador responde 400 (llegó al controlador, el middleware pasó)
      const res = await supertest(app)
        .post("/api/categorias")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({});  // body vacío → el controlador devuelve 400

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("error", "El nombre es requerido");
    });

  });

  // ── optionalAuthMiddleware ─────────────────────────────────────────────
  describe("optionalAuthMiddleware (GET /api/categorias es ruta pública)", () => {

    it("debe funcionar SIN token (anónimo)", async () => {
      const res = await supertest(app).get("/api/categorias");
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it("debe funcionar CON token válido (usuario logueado)", async () => {
      const userToken = makeToken("user");
      const res = await supertest(app)
        .get("/api/categorias")
        .set("Authorization", `Bearer ${userToken}`);
      expect(res.status).toBe(200);
    });

  });

});
