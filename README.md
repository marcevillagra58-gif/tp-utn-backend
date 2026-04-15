# 🚀 Gestión Integral – Hurlingham PNO Hub Backend

**Documentación Académica Técnica y Arquitectónica**  
*Desarrollado para la Cátedra de Programación Backend - TP Final*

---

## 1. Introducción y Arquitectura del Sistema

El presente proyecto constituye el pilar de Backend para la plataforma **Hurlingham PNO Hub**. Su arquitectura ha sido diseñada priorizando la **escalabilidad, la persistencia dual y la máxima seguridad**. 

El backend ha sido desplegado exitosamente empleando un paradigma *Serverless* moderno a través de Vercel. 

### Patrón de Arquitectura
Se ha implementado una arquitectura basada en **Modelo-Vista-Controlador (MVC)** orientada a APIs RESTful estandarizadas, separando rigurosamente:
1. **Rutas (Routings):** Definen los contratos HTTP.
2. **Controladores (Controllers):** Gestionan el procesamiento de datos y casos de uso.
3. **Modelos (Models):** Representan el esquema y mapeo de datos de la base de datos.
4. **Middlewares:** Encapsulan lógicas protectoras transversales (Políticas RLS en el código, control de tokens JWT).
5. **Controladores como Capa de Servicio Integrada:** En lugar de agregar una carpeta `services/` separada, los controladores adoptan el patrón *Fat Controller Responsable*: encapsulan la lógica de negocio junto con el acceso a datos (Mongoose/Supabase). Esta decisión fue tomada conscientemente ya que el uso de dos ORMs heterogéneos (Mongoose + Supabase Client) hace que una capa de servicios genérica agregue complejidad sin valor adicional.

---

## 2. Puntos Distintivos: "Características Extra" de Alto Nivel

Para superar ampliamente los requerimientos básicos del Trabajo Práctico e incorporar estándares de mercado reales, el proyecto incluye los siguientes avances técnicos excepcionales:

### 🌟 A. Documentación Auto-Generada y Embebida (Swagger UI)
Se descartó la entrega de documentación estática (Postman JSON Collections) en favor de una implementación nativa de **Swagger (OpenAPI V3)**. Expone un panel visual montado directamente sobre el Backend (`/api-docs`).

### 🌟 B. Criptografía Híbrida y Migración Dinámica de Claves
El sistema usa un esquema de hashing dual y migración transparente. Identifica si un hash es de formato antiguo (60 chars) o fortalecido (120 chars) y actualiza la bóveda automáticamente tras un login exitoso.

### 🌟 C. Integración de Servicios Externos
1. **Cloudinary API:** Sistema de almacenamiento de recursos binarios mediante flujos (Streams), reemplazando el guardado de base64.
2. **Integraciones REST Exteriores:** El backend actúa como Proxy Transparente ante APIs de terceros (Meteorología, Noticias).

### 🌟 D. Bases de Datos Diferenciadas (Persistencia Políglota)
- **Relacional (Supabase/PostgreSQL):** Almacenamiento para la autenticación y roles.
- **NoSQL (MongoDB Atlas):** Gestión de catálogos comerciales con documentos complejos.

---

## 3. Modelo de Autorización (RBAC y JWT Local)

El modelo asume estricta **Seguridad de Nivel de Fila Lógico (Logical Row Level Security)** evaluando Identificadores Únicos Universales (UUID).
Se definen dos roles clave: **Admin** y **Producer**. La gestión de Tokens asienta `Access Tokens` (8 horas) y `Refresh Tokens` manuales alojados por el Backend.

---

## 4. Instrucciones Técnicas de Levantamiento

Para montar esta estructura localmente o auditar la aplicación:

1. **Instalación de Dependencias**
   ```bash
   npm install
   ```

2. **Entorno `.env`**
   Garantizar que las cadenas de conexión (URI) hacia *MongoDB* y *Supabase* están activas, junto a sus secretos criptográficos. Basarse en `.env.example`.

3. **Ejecución y Tests (TDD)**
   ```bash
   # Ejecutar los tests unitarios y de integración
   npm test

   # Levantar el servidor en entorno local
   npm run dev
   ```

4. **Acceder a Swagger UI**
   Para realizar pruebas manuales directas, abrir un navegador y entrar a la ruta `/api-docs`:
   - URL Local: `http://localhost:3000/api-docs`
   - URL Remota (Vercel): `https://tp-utn-backend.vercel.app/api-docs`

---

## 5. Ejemplos de Solicitudes HTTP

### POST `/api/auth/login`
```json
{
  "email": "admin@hurlingham.com",
  "password": "Admin1234"
}
```

### POST `/api/users` (Registro)
```json
{
  "username": "nuevo_productor",
  "email": "productor@ejemplo.com",
  "password": "Segura1234",
  "role": "producer"
}
```

---
*Fin Documento Versión V2.1*
