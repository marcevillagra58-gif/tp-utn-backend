import swaggerJsDoc from "swagger-jsdoc";

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
        url: "https://tp-utn-backend.fly.dev", // Ejemplo si se sube a fly.io
        description: "Servidor de Producción",
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
  // Rutas donde swagger va a ir a leer los comentarios @swagger
  apis: ["./src/routes/*.js", "./src/docs/*.js"],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);

export default swaggerDocs;
