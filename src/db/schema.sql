-- ============================================================================
-- SCHEMA.SQL — Tablas de Supabase (PostgreSQL)
-- Proyecto: Hurlingham PNO
-- ============================================================================
-- Instrucciones: ejecutar en Supabase → SQL Editor → New Query
-- ============================================================================

-- ============================================================
-- TABLA: users
-- Almacena datos de autenticación y perfil de usuario.
-- Las contraseñas se guardan hasheadas con bcrypt (NUNCA en texto plano).
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
    id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    username    VARCHAR(50)  NOT NULL UNIQUE,
    email       VARCHAR(100) NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL,         -- hash bcrypt
    role        VARCHAR(20)  NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'producer', 'admin')),
    avatar      TEXT,                          -- URL de Cloudinary
    is_blocked  BOOLEAN      NOT NULL DEFAULT false,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLA: refresh_tokens
-- Almacena los refresh tokens activos para renovar el access token.
-- Cuando el usuario hace logout, se elimina su token de acá.
-- ============================================================

CREATE TABLE IF NOT EXISTS refresh_tokens (
    id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token       TEXT NOT NULL UNIQUE,
    expires_at  TIMESTAMPTZ NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ÍNDICES — mejoran la velocidad de búsqueda
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_users_email    ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token   ON refresh_tokens(token);

-- ============================================================
-- FUNCIÓN: actualizar updated_at automáticamente
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- USUARIO ADMIN INICIAL
-- Password: Admin1234! (hasheado con bcrypt, salt rounds = 12)
-- ⚠️ Cambiar la contraseña después del primer login.
-- ============================================================

INSERT INTO users (username, email, password, role)
VALUES (
    'admin',
    'admin@hurlingham.gob.ar',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMaefFEIEGMUzpBm8Uk3mCpXBi',  -- Admin1234!
    'admin'
) ON CONFLICT DO NOTHING;
