import swaggerJsDoc from "swagger-jsdoc";

import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Rutas donde swagger va a ir a leer los comentarios @swagger
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
        url: "https://tp-utn-backend.vercel.app",
        description: "Servidor Vercel de Producción",
      },
      {
        url: "http://localhost:3000",
        description: "Servidor Local de Desarrollo",
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
      schemas: {
        User: {
          type: "object",
          required: ["username", "email", "role"],
          properties: {
            id: { type: "string", format: "uuid", description: "ID único de Supabase" },
            username: { type: "string", description: "Nombre de usuario único" },
            email: { type: "string", format: "email", description: "Correo electrónico del usuario" },
            role: { type: "string", enum: ["admin", "producer"], description: "Rol del usuario en el sistema" },
            avatar: { type: "string", format: "uri", description: "URL de la foto de perfil (Cloudinary)" },
            is_blocked: { type: "boolean", description: "Indica si el usuario fue bloqueado por un admin" },
            created_at: { type: "string", format: "date-time" },
          },
        },
        Category: {
          type: "object",
          required: ["name", "slug"],
          properties: {
            id: { type: "string", format: "uuid" },
            name: { type: "string" },
            slug: { type: "string" },
            description: { type: "string" },
            type: { type: "string", enum: ["producto", "servicio"] },
            custom_fields: { type: "object", description: "JSONB con campos dinámicos específicos de la categoría" },
          },
        },
        Producer: {
          type: "object",
          required: ["name", "userId"],
          properties: {
            _id: { type: "string", description: "Object ID de MongoDB" },
            name: { type: "string" },
            userId: { type: "string", format: "uuid", description: "UUID que lo vincula con la tabla Users en Supabase" },
            imageUrl: { type: "string" },
            category: { type: "string" },
            active: { type: "boolean" },
            contact: {
              type: "object",
              properties: {
                phone: { type: "string" },
                whatsapp: { type: "string" },
                instagram: { type: "string" },
              },
            },
            local_address: {
              type: "object",
              properties: {
                street: { type: "string" },
                number: { type: "string" },
                lat: { type: "number" },
                lng: { type: "number" },
              },
            },
            products: { type: "array", items: { $ref: "#/components/schemas/Product" } },
            comments: { type: "array", items: { $ref: "#/components/schemas/Comment" } },
          },
        },
        Product: {
          type: "object",
          properties: {
            _id: { type: "string" },
            name: { type: "string" },
            description: { type: "string" },
            imageUrl: { type: "string" },
          },
        },
        Comment: {
          type: "object",
          properties: {
            userId: { type: "string", description: "Quién hizo la pregunta" },
            username: { type: "string" },
            text: { type: "string", description: "Pregunta del cliente" },
            reply: { type: "string", description: "Respuesta del productor" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Contact: {
          type: "object",
          required: ["name", "email", "message"],
          properties: {
            _id: { type: "string" },
            name: { type: "string" },
            email: { type: "string", format: "email" },
            phone: { type: "string" },
            message: { type: "string" },
            read: { type: "boolean" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        AuthResponse: {
          type: "object",
          properties: {
            user: { $ref: "#/components/schemas/User" },
            session: {
              type: "object",
              properties: {
                access_token: { type: "string", description: "JWT para enviar en headers Bearer" },
                refresh_token: { type: "string" },
              },
            },
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            error: { type: "string", example: "Mensaje descriptivo del error" },
          },
        },
      },
    },
  },
  apis: [routesPath, docsPath],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);

export default swaggerDocs;

