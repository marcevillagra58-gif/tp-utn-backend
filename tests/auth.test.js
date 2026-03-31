import supertest from "supertest";
import app from "../index.js";
import { supabase } from "../src/db/supabase.js";
import { hashPassword } from "../src/utils/passwordUtils.js";
import jwt from "jsonwebtoken";

// Creamos un builder falso con funciones nativas de JS en lugar de jest.fn()
const mockBuilder = {
  select: function() { return this; },
  or: function() { return this; },
  eq: function() { return this; },
  gt: function() { return this; },
  single: async function() { return { data: null, error: null }; },
  insert: async function() { return { data: [], error: null }; },
  delete: function() { return this; },
};

// Reemplazamos el método from de forma nativa
supabase.from = () => mockBuilder;

beforeAll(() => {
  process.env.JWT_SECRET = "test_super_secret_key_123456";
  process.env.JWT_REFRESH_SECRET = "test_refresh_super_secret_key_123456";
});

// Limpiamos los mocks reseteando las funciones
afterEach(() => {
  supabase.from = () => mockBuilder;
  mockBuilder.single = async function() { return { data: null, error: null }; };
  mockBuilder.insert = async function() { return { data: [], error: null }; };
  mockBuilder.delete = function() { return this; };
  mockBuilder.eq     = function() { return this; };  // ← reset: debe ser chainable
});

describe("Auth Controller - Integration Tests", () => {
  
  describe("POST /api/auth/login", () => {
    it("debe retornar error 401 si las credenciales en DB no existen (usuario no encontrado)", async () => {
      // Configuramos el stub manual
      mockBuilder.single = async () => ({ data: null, error: { message: "Not found" } });

      const res = await supertest(app)
        .post("/api/auth/login")
        .send({ email: "inexistente@test.com", password: "123" });

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty("error", "Credenciales inválidas");
    });

    it("debe retornar 403 si el usuario está bloqueado", async () => {
      // Simulamos un usuario bloqueado
      mockBuilder.single = async () => ({ 
        data: { 
          id: "uuid123", 
          email: "bloqueado@test.com", 
          is_blocked: true 
        }, 
        error: null 
      });

      const res = await supertest(app)
        .post("/api/auth/login")
        .send({ email: "bloqueado@test.com", password: "123" });

      expect(res.status).toBe(403);
      expect(res.body).toHaveProperty("error", "Usuario bloqueado. Contactá al administrador.");
    });

    it("debe hacer login exitoso (200) y devolver accessToken y refreshToken al usar credenciales válidas", async () => {
      // Hasheamos la contraseña de prueba virtualmente
      const passwordPlain = "Qwerty1234";
      const hashedPassword = await hashPassword(passwordPlain, "marcelo");

      // Simulamos que Supabase encontró al usuario
      mockBuilder.single = async () => ({
        data: {
          id: "uuid-admin-123",
          username: "marcelo",
          email: "admin@test.com",
          role: "admin",
          is_blocked: false,
          password: hashedPassword, // Hasheado válido
        },
        error: null,
      });

      // Simular la inserción exitosa del refresh_token
      mockBuilder.insert = async () => ({ data: [], error: null });

      const res = await supertest(app)
        .post("/api/auth/login")
        .send({ email: "admin@test.com", password: passwordPlain });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("accessToken");
      expect(res.body).toHaveProperty("refreshToken");
      // La contraseña nunca debe viajar al cliente
      expect(res.body.user).not.toHaveProperty("password");
      expect(res.body.user).toHaveProperty("username", "marcelo");
    });

    it("debe retornar 401 si la contraseña es incorrecta", async () => {
      const passwordPlain = "Qwerty1234";
      const hashedPassword = await hashPassword(passwordPlain, "marcelo");

      mockBuilder.single = async () => ({
        data: {
          id: "uuid-admin-123",
          username: "marcelo",
          email: "admin@test.com",
          role: "admin",
          is_blocked: false,
          password: hashedPassword, 
        },
        error: null,
      });

      const res = await supertest(app)
        .post("/api/auth/login")
        .send({ email: "admin@test.com", password: "WrongPassword" }); // Contraseña enviada incorrecta

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty("error", "Credenciales inválidas");
    });
  });

  // ── POST /api/auth/logout ──────────────────────────────────────────────
  describe("POST /api/auth/logout", () => {

    it("debe devolver 200 aunque no se envíe refreshToken", async () => {
      const res = await supertest(app)
        .post("/api/auth/logout")
        .send({});

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("message", "Logout exitoso");
    });

    it("debe devolver 200 y eliminar el refresh token de la BD", async () => {
      // El logout llama a supabase.from("refresh_tokens").delete().eq(...)
      let deleteCalled = false;
      mockBuilder.delete = function() {
        deleteCalled = true;
        return this;
      };
      mockBuilder.eq = async function() {
        return { error: null };
      };

      const res = await supertest(app)
        .post("/api/auth/logout")
        .send({ refreshToken: "cualquier_token_de_prueba" });

      expect(res.status).toBe(200);
      expect(deleteCalled).toBe(true);
    });

  });

  // ── POST /api/auth/refresh ─────────────────────────────────────────────
  describe("POST /api/auth/refresh", () => {

    it("debe retornar 400 si no se envía refreshToken", async () => {
      const res = await supertest(app)
        .post("/api/auth/refresh")
        .send({});

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("error", "Refresh token requerido");
    });

    it("debe retornar 401 si el refreshToken tiene firma inválida", async () => {
      const res = await supertest(app)
        .post("/api/auth/refresh")
        .send({ refreshToken: "token.invalido.firma" });

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty("error", "Refresh token inválido o expirado");
    });

    it("debe retornar 401 si el refreshToken no existe en la BD", async () => {
      // Generamos un token con firma válida
      const validRefreshToken = jwt.sign(
        { userId: "uuid-test-refresh" },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: "7d" },
      );

      // Supabase devuelve null (el token no está guardado)
      mockBuilder.single = async () => ({ data: null, error: { message: "not found" } });

      const res = await supertest(app)
        .post("/api/auth/refresh")
        .send({ refreshToken: validRefreshToken });

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty("error", "Refresh token inválido o expirado");
    });

    it("debe retornar 200 con nuevo accessToken si el refreshToken es válido", async () => {
      // Generamos un token de refresh real
      const validRefreshToken = jwt.sign(
        { userId: "uuid-test-refresh" },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: "7d" },
      );

      // Primera llamada a supabase.from → busca el token en refresh_tokens
      // Segunda llamada → busca el usuario
      let callIndex = 0;
      supabase.from = () => {
        const builder = {
          select: function() { return this; },
          eq:     function() { return this; },
          gt:     function() { return this; },
          single: async function() {
            if (callIndex === 0) {
              callIndex++;
              // Primera llamada: devuelve el token almacenado (válido)
              return {
                data: { user_id: "uuid-test-refresh", token: validRefreshToken },
                error: null,
              };
            }
            // Segunda llamada: devuelve el usuario
            return {
              data: {
                id:       "uuid-test-refresh",
                email:    "usuario@test.com",
                role:     "user",
                username: "usuario",
                avatar:   null,
              },
              error: null,
            };
          },
        };
        return builder;
      };

      const res = await supertest(app)
        .post("/api/auth/refresh")
        .send({ refreshToken: validRefreshToken });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("accessToken");
    });

  });

});
