import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import { PORT, FRONTEND_URL, JWT_SECRET, NODE_ENV } from "./src/config/config.js";

dotenv.config();
import http from "http";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import bodyParser from "body-parser";
import jwt from "jsonwebtoken";
import { Server as SocketServer } from "socket.io";

import { connectMongoDB } from "./src/db/mongo.js";
import { typeDefs } from "./src/graphql/typeDefs.js";
import { resolvers } from "./src/graphql/resolvers.js";

// Rutas
import authRoutes from "./src/routes/auth.routes.js";
import userRoutes from "./src/routes/users.routes.js";
import producerRoutes from "./src/routes/producers.routes.js";
import uploadRoutes from "./src/routes/upload.routes.js";
import contactRoutes from "./src/routes/contact.routes.js";
import externalRoutes from "./src/routes/external.routes.js";
import notificationRoutes from "./src/routes/notifications.routes.js";
import categoriaRoutes from "./src/routes/categories.routes.js";
import swaggerUi from "swagger-ui-express";
import swaggerDocs from "./src/config/swagger.js";
import { apiLimiter } from "./src/middleware/rateLimit.middleware.js";

dotenv.config();

const app = express();
const httpServer = http.createServer(app);
const PORT_VAL = PORT;

// ============================================================
// SOCKET.IO SETUP
// ============================================================
// Acepta la URL canónica, localhost y cualquier preview URL de Vercel
// (Vercel genera URLs únicas por cada deploy: tp-utn-frontend-xxxx.vercel.app)
const isOriginAllowed = (origin) => {
  if (!origin) return true; // Postman / curl sin origin
  const allowed = [
    FRONTEND_URL,
    "http://localhost:5173",
    "http://localhost:4173",
    "https://tp-utn-frontend.vercel.app",
  ].filter(Boolean);
  if (allowed.includes(origin)) return true;
  // Permite cualquier preview deployment de Vercel del proyecto frontend
  if (/^https:\/\/tp-utn-frontend.*\.vercel\.app$/.test(origin)) return true;
  return false;
};

// Socket.io requiere conexiones persistentes (WebSocket).
// En entornos serverless (Vercel) esto no es compatible.
// El bloque try/catch garantiza que si falla, el resto del servidor funciona igual.
let io;
try {
  io = new SocketServer(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (isOriginAllowed(origin)) {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      },
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("📡 Nuevo cliente conectado:", socket.id);
    socket.on("disconnect", () => {
      console.log("🔌 Cliente desconectado:", socket.id);
    });
  });

  console.log("✅ Socket.io inicializado");
} catch (err) {
  console.warn("⚠️  Socket.io no disponible en este entorno (serverless):", err.message);
  // Stub vacío para que io.emit() no rompa el resto del código
  io = { emit: () => {}, on: () => {} };
}

export { io };

// ============================================================
// APOLLO SERVER SETUP
// ============================================================
const server = new ApolloServer({
  typeDefs,
  resolvers,
  plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
});

// ============================================================
// MIDDLEWARE GLOBAL Y DE SEGURIDAD
// ============================================================

// helmet() por defecto bloquea scripts externos (unpkg) y scripts inline.
// Configuramos Content-Security-Policy para permitir que Swagger UI levante desde el CDN.
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://unpkg.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://unpkg.com"],
        imgSrc: ["'self'", "data:", "https://unpkg.com", "https://res.cloudinary.com", "https://validator.swagger.io"],
        connectSrc: ["'self'", "https://unpkg.com"],
      },
    },
  })
);

app.use(
  cors({
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) callback(null, true);
      else callback(new Error(`CORS bloqueado para el origen: ${origin}`));
    },
    credentials: true,
  }),
);

app.use(express.json());

// Aplicar Rate Limiter a todas las rutas que empiecen por /api/
app.use("/api/", apiLimiter);

// ============================================================
// RUTAS REST
// ============================================================

app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Servidor Hurlingham PNO corriendo (REST + GraphQL)",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/producers", producerRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/external", externalRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/categorias", categoriaRoutes);

// ============================================================
// SWAGGER DOCS
// Usamos CDN para los assets de Swagger UI (necesario en Vercel/serverless)
// porque express.static no funciona correctamente en entornos sin sistema de archivos.
// ============================================================

// Expone la especificación OpenAPI como JSON
app.get("/api-docs.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.json(swaggerDocs);
});

// Sirve la UI de Swagger usando assets de CDN (unpkg)
app.get("/api-docs", (req, res) => {
  // URL relativa: el navegador hereda el protocolo (https) automáticamente
  const specUrl = "/api-docs.json";
  res.setHeader("Content-Type", "text/html");
  res.send(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Hurlingham PNO — API Docs</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css" />
  <style>
    body { margin: 0; padding: 0; }
    #swagger-ui .topbar { background-color: #1a1a2e; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js"></script>
  <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function () {
      SwaggerUIBundle({
        url: "${specUrl}",
        dom_id: "#swagger-ui",
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        layout: "StandaloneLayout",
        deepLinking: true,
        displayRequestDuration: true,
        defaultModelsExpandDepth: 1,
        defaultModelExpandDepth: 3,
      });
    };
  </script>
</body>
</html>`);
});

// ============================================================
// INICIO DEL SERVIDOR (REST + GRAPHQL)
// ============================================================

const startServer = async () => {
  try {
    // 1. Conectar a MongoDB
    await connectMongoDB();
    console.log("✅ MongoDB conectado");

    // 2. Iniciar Apollo Server
    await server.start();

    // 3. Montar middleware de Apollo en /graphql
    app.use(
      "/graphql",
      cors(),
      bodyParser.json(),
      expressMiddleware(server, {
        context: async ({ req }) => {
          const authHeader = req.headers.authorization || "";
          if (authHeader.startsWith("Bearer ")) {
            const token = authHeader.split(" ")[1];
            try {
              const decoded = jwt.verify(token, JWT_SECRET);
              return { user: decoded };
            } catch (err) {
              return { user: null };
            }
          }
          return { user: null };
        },
      }),
    );

    // 4. Ruta 404 (solo para lo que no atraparon REST o GraphQL)
    app.use((req, res) => {
      res.status(404).json({ error: "Ruta no encontrada" });
    });

    // 5. Iniciar servidor HTTP
    httpServer.listen(PORT_VAL, () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${PORT_VAL}`);
      console.log(`📊 GraphQL endpoint: http://localhost:${PORT_VAL}/graphql`);
      console.log(`📋 Health check: http://localhost:${PORT_VAL}/api/health`);
    });
  } catch (error) {
    console.error("❌ Error al iniciar el servidor:", error);
    process.exit(1);
  }
};

// En Vercel (serverless), la inicialización la maneja api/index.js.
// Solo arrancamos el servidor "clásico" cuando corremos localmente.
if (NODE_ENV !== "test" && !process.env.VERCEL) {
  startServer();
}

export default app;
