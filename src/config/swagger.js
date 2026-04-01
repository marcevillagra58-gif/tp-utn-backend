import swaggerJsDoc from "swagger-jsdoc";

import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Rutas donde swagger va a ir a leer los comentarios @swagger
// Usamos path absoluto porque Vercel rompe las rutas relativas en la compilación
const routesPath = path.join(__dirname, "../routes/*.js");
const docsPath = path.join(__dirname, "../docs/*.js");

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Hurlingham PNO API - Trabajos Prácticos UTN",
      version: "1.0.0",
      description: "Documentación interactiva de la API Backend (OpenAPI 3.0)\n\n> **Nota:** Los campos marcados con un asterisco rojo (<font color=\"red\">*</font>) en la sección Schemas son de carácter **obligatorio**.",
      contact: {
        name: "Marcelo",
      },
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Servidor Local de Desarrollo",
      },
      {
        url: "https://tp-utn-backend.vercel.app", 
        description: "Servidor Vercel de Producción",
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },
  apis: [routesPath, docsPath],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);

export default swaggerDocs;
