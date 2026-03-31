/**
 * api/index.js — Entry point para Vercel (modo serverless)
 *
 * Vercel no ejecuta `node index.js` directamente. Necesita que el
 * módulo exporte el app de Express. Este archivo actúa de "puente"
 * entre Vercel y nuestro servidor Express en index.js.
 *
 * La función startServer() conecta MongoDB y Apollo antes de que
 * Vercel empiece a enviar requests al handler.
 */

import app from "../index.js";
import { connectMongoDB } from "../src/db/mongo.js";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { typeDefs } from "../src/graphql/typeDefs.js";
import { resolvers } from "../src/graphql/resolvers.js";
import cors from "cors";
import bodyParser from "body-parser";
import jwt from "jsonwebtoken";

// Variable de control: solo inicializamos las conexiones una vez
// (las funciones serverless pueden "reutilizarse" entre requests)
let initialized = false;

const init = async () => {
  if (initialized) return;
  try {
    await connectMongoDB();

    const apolloServer = new ApolloServer({ typeDefs, resolvers });
    await apolloServer.start();

    app.use(
      "/graphql",
      cors(),
      bodyParser.json(),
      expressMiddleware(apolloServer, {
        context: async ({ req }) => {
          const authHeader = req.headers.authorization || "";
          if (authHeader.startsWith("Bearer ")) {
            try {
              const token = authHeader.split(" ")[1];
              const decoded = jwt.verify(token, process.env.JWT_SECRET);
              return { user: decoded };
            } catch {
              return { user: null };
            }
          }
          return { user: null };
        },
      }),
    );

    app.use((req, res) => {
      res.status(404).json({ error: "Ruta no encontrada" });
    });

    initialized = true;
    console.log("✅ Servidor inicializado en modo serverless");
  } catch (err) {
    console.error("❌ Error al inicializar servidor serverless:", err);
  }
};

// Handler que Vercel llama por cada request
export default async function handler(req, res) {
  await init();
  return app(req, res);
}
