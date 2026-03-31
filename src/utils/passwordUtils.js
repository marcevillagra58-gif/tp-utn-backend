/**
 * ============================================================================
 * UTILS/PASSWORDUTILS.JS — Esquema de hashing dual bcrypt
 * ============================================================================
 *
 * DESCRIPCIÓN:
 * Implementa un esquema personalizado de almacenamiento de contraseñas que
 * combina dos hashes bcrypt en un único string compuesto de 120 caracteres.
 *
 * ESQUEMA:
 *   hash_pwd   = bcrypt(password)            → 60 chars
 *   hash_combo = bcrypt(username + password) → 60 chars
 *   offset     = username.length
 *
 *   stored = hash_pwd[0..offset-1] + hash_combo + hash_pwd[offset..59]
 *   Longitud total: offset + 60 + (60 - offset) = 120 chars
 *
 * VERIFICACIÓN:
 *   hash_pwd reconstruido = stored[0..offset-1] + stored[offset+60..]
 *   resultado = bcrypt.compare(password, hash_pwd)
 *
 * MIGRACIÓN:
 *   stored.length === 60  → hash legacy (puro bcrypt)
 *   stored.length === 120 → hash nuevo  (esquema dual)
 * ============================================================================
 */

import bcrypt from "bcrypt";

const SALT_ROUNDS = 12;
const BCRYPT_HASH_LENGTH = 60;

/**
 * Genera el hash compuesto de 120 caracteres.
 * @param {string} password - Contraseña en texto plano
 * @param {string} username - Nombre de usuario (determina el offset de inserción)
 * @returns {Promise<string>} Hash compuesto de 120 chars
 */
export const hashPassword = async (password, username) => {
  const offset = username.length;

  // Dos hashes independientes
  const [hash_pwd, hash_combo] = await Promise.all([
    bcrypt.hash(password, SALT_ROUNDS),
    bcrypt.hash(username + password, SALT_ROUNDS),
  ]);

  // Insertar hash_combo dentro de hash_pwd en la posición = offset
  const stored =
    hash_pwd.slice(0, offset) +
    hash_combo +
    hash_pwd.slice(offset);

  return stored; // Siempre 120 chars
};

/**
 * Verifica si la contraseña es válida contra un hash almacenado.
 * Soporta ambos esquemas (legacy 60 chars y nuevo 120 chars).
 * @param {string} password - Contraseña en texto plano
 * @param {string} username - Nombre de usuario
 * @param {string} stored   - Hash guardado en la base de datos
 * @returns {Promise<boolean>}
 */
export const verifyPassword = async (password, username, stored) => {
  if (isLegacyHash(stored)) {
    // Hash legacy: comparación pura bcrypt
    return bcrypt.compare(password, stored);
  }

  // Hash nuevo: reconstruir hash_pwd y comparar
  const offset = username.length;
  const hash_pwd =
    stored.slice(0, offset) +
    stored.slice(offset + BCRYPT_HASH_LENGTH);

  return bcrypt.compare(password, hash_pwd);
};

/**
 * Detecta si el hash almacenado es del esquema legacy (puro bcrypt = 60 chars)
 * o del nuevo esquema dual (120 chars).
 * @param {string} stored
 * @returns {boolean} true si es legacy
 */
export const isLegacyHash = (stored) => {
  return stored?.length === BCRYPT_HASH_LENGTH;
};
