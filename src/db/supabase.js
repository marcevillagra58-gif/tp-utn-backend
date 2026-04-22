/**
 * ============================================================================
 * DB/SUPABASE.JS — Conexión a la base de datos SQL (Supabase / PostgreSQL)
 * ============================================================================
 *
 * Almacena: usuarios, passwords hasheados, roles, sesiones.
 * Los datos sensibles NUNCA van en MongoDB.
 *
 * USO: import { supabase } from './db/supabase.js';
 * ============================================================================
 */

import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_KEY } from "../config/config.js";

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn(
    "⚠️ Advertencia: SUPABASE_URL o SUPABASE_KEY no están definidas en .env. Supabase no funcionará.",
  );
}

export const supabase =
  SUPABASE_URL && SUPABASE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_KEY)
    : null;

if (supabase) {
  console.log("✅ Cliente Supabase inicializado");
}
