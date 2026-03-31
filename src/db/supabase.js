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
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(
    "❌ Error: SUPABASE_URL o SUPABASE_KEY no están definidas en .env",
  );
  process.exit(1);
}

export const supabase = createClient(supabaseUrl, supabaseKey);

console.log("✅ Cliente Supabase inicializado");
