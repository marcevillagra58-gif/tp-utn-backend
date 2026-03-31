/**
 * SEED.JS — Script de inicialización
 * Crea el usuario admin inicial en Supabase con password hasheado correctamente.
 *
 * Ejecutar UNA SOLA VEZ: node src/db/seed.js
 */

import bcrypt from "bcrypt";
import { supabase } from "./supabase.js";
import dotenv from "dotenv";

dotenv.config();

const ADMIN_EMAIL = "admin@hurlingham.gob.ar";
const ADMIN_PASSWORD = "Admin1234!";
const ADMIN_USERNAME = "admin";
const SALT_ROUNDS = 12;

const seed = async () => {
  console.log("🌱 Iniciando seed del usuario admin...");

  try {
    // Verificar si el admin ya existe
    const { data: existing } = await supabase
      .from("users")
      .select("id")
      .eq("email", ADMIN_EMAIL)
      .single();

    if (existing) {
      console.log(
        "⚠️  El admin ya existe en la base de datos. Actualizando password...",
      );

      const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, SALT_ROUNDS);

      const { error } = await supabase
        .from("users")
        .update({ password: hashedPassword })
        .eq("email", ADMIN_EMAIL);

      if (error) throw error;
      console.log("✅ Password del admin actualizado correctamente");
      console.log(`   Email:    ${ADMIN_EMAIL}`);
      console.log(`   Password: ${ADMIN_PASSWORD}`);
    } else {
      // Crear admin nuevo
      const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, SALT_ROUNDS);

      const { error } = await supabase.from("users").insert({
        username: ADMIN_USERNAME,
        email: ADMIN_EMAIL,
        password: hashedPassword,
        role: "admin",
      });

      if (error) throw error;
      console.log("✅ Usuario admin creado correctamente");
      console.log(`   Email:    ${ADMIN_EMAIL}`);
      console.log(`   Password: ${ADMIN_PASSWORD}`);
    }

    console.log(
      "\n⚠️  Recordá cambiar la contraseña después del primer login.\n",
    );
  } catch (err) {
    console.error("❌ Error en seed:", err.message);
  } finally {
    process.exit(0);
  }
};

seed();
