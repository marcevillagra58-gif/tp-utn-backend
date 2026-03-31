/**
 * SEED_PRODUCERS.JS — Script para insertar productores de prueba en MongoDB
 *
 * Ejecutar: node src/db/seed_producers.js
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import { Producer } from "../models/producer.model.js";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

const sampleProducers = [
  {
    name: "La Huerta de Juan",
    description: "Verduras orgánicas frescas cultivadas en Hurlingham.",
    phone: "11-4567-8901",
    email: "juanhuerta@gmail.com",
    location: "Hurlingham, GBA Oeste",
    category: "verduras",
    imageUrl: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400",
    active: true,
  },
  {
    name: "Panadería Artesanal Rossi",
    description:
      "Pan casero, facturas y medialunas elaboradas de forma artesanal.",
    phone: "11-3456-7890",
    email: "panaderia.rossi@gmail.com",
    location: "William Morris, Hurlingham",
    category: "panaderia",
    imageUrl:
      "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400",
    active: true,
  },
];

const seed = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ MongoDB conectado");

    const existing = await Producer.countDocuments();
    if (existing > 0) {
      console.log(
        `⚠️  Ya existen ${existing} productores en MongoDB. ¿Querés borrarlos y recrearlos?`,
      );
      console.log(
        "   Si querés, ejecutá: node src/db/seed_producers.js --force",
      );

      if (!process.argv.includes("--force")) {
        console.log("   Abortando sin cambios.");
        process.exit(0);
      }

      await Producer.deleteMany({});
      console.log("🗑️  Colección limpiada.");
    }

    const created = await Producer.insertMany(sampleProducers);
    console.log(`✅ ${created.length} productores creados:`);
    created.forEach((p) => console.log(`   - ${p.name} (ID: ${p._id})`));
  } catch (err) {
    console.error("❌ Error:", err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

seed();
