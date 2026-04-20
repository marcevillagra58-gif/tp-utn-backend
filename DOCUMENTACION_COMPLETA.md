# 🏛️ Hurlingham PNO Hub — Documentación Técnica Completa

> ** Trabajo Práctico Final — Backend **  
> UTN — Programación en la Nube  
> Alumno: Marcelo Villagra | Año: 2026

---

## Índice

1. [Descripción del Proyecto](#1-descripción-del-proyecto)
2. [Stack Tecnológico](#2-stack-tecnológico)
3. [Arquitectura del Sistema](#3-arquitectura-del-sistema)
4. [Cómo Arrancar el Proyecto](#4-cómo-arrancar-el-proyecto)
5. [Mapa Completo de Endpoints](#5-mapa-completo-de-endpoints)
6. [Guía de Postman (paso a paso)](#6-guía-de-postman-paso-a-paso)
7. [Sistema de Autenticación JWT](#7-sistema-de-autenticación-jwt)
8. [Arquitectura de Base de Datos](#8-arquitectura-de-base-de-datos)
9. [Puntos Extra Implementados](#9-puntos-extra-implementados)
10. [Testing Automatizado](#10-testing-automatizado)

---

## 1. Descripción del Proyecto

**Hurlingham PNO Hub** es el backend de una plataforma digital para el Partido de Hurlingham (Gran Buenos Aires). Centraliza información sobre productores locales, gestión de usuarios, notificaciones en tiempo real, y datos del clima.

El sistema está diseñado como una **API REST + GraphQL** con autenticación JWT, documentación interactiva Swagger, y múltiples capas de seguridad.

---

## 2. Stack Tecnológico

| Tecnología | Versión | Rol |
|---|---|---|
| Node.js | v20 (LTS) | Runtime |
| Express | ^4.19 | Framework HTTP |
| Apollo Server | ^4 | Servidor GraphQL |
| Socket.IO | ^4 | WebSockets (Entorno Local) |
| Server-Sent Events | Nativo | Notificaciones (Entorno Serverless) |
| Mongoose | ^8 | ORM para MongoDB |
| Supabase JS | ^2 | Cliente para PostgreSQL |
| JWT (jsonwebtoken) | ^9 | Tokens de autenticación |
| bcrypt | ^5 | Hashing de contraseñas |
| Cloudinary | ^2 | CDN de imágenes |
| Resend | ^4 | Servicio de emails transaccionales |
| Swagger UI Express | ^5 | Documentación interactiva de API |
| express-rate-limit | ^7 | Protección contra DDoS y fuerza bruta |
| Helmet | ^8 | Cabeceras HTTP de seguridad |
| Jest + Supertest | ^29/^7 | Testing automatizado |
| Multer | ^2 | Procesamiento de archivos subidos |

---

## 3. Arquitectura del Sistema

```
Internet / Frontend
        │
        ▼
   ┌─────────────────────────────────────┐
   │         Express HTTP Server         │
   │  ┌──────────────────────────────┐   │
   │  │  Helmet  │  CORS  │ RateLimit│   │  ← Capas de Seguridad
   │  └──────────────────────────────┘   │
   │                                     │
   │  ┌──────────────┐  ┌─────────────┐  │
   │  │  REST /api/* │  │  GraphQL    │  │
   │  └──────┬───────┘  └──────┬──────┘  │
   │         │                 │         │
   │  ┌──────▼────────────────▼──────┐   │
   │  │     Auth Middleware (JWT)    │   │
   │  └──────┬────────────────┬──────┘   │
   │         │                │          │
   │  ┌──────▼────┐    ┌──────▼───────┐  │
   │  │Controllers│    │   Resolvers  │  │
   │  └──┬────┬───┘    └──────┬───────┘  │
   │     │    │               │          │
   └─────┼────┼───────────────┼──────────┘
         │    │               │
    ┌────▼┐ ┌─▼─────┐    ┌────▼────────┐
    │Supa-│ │MongoDB│    │  Cloudinary │
    │base │ │       │    │  (imágenes) │
    └─────┘ └───────┘    └─────────────┘
```

### Flujo típico de una petición protegida:
1. El Frontend incluye `Authorization: Bearer <token>` en el header.
2. `authMiddleware` verifica la firma del JWT con `JWT_SECRET`.
3. Si es válido, extrae `{ userId, email, role }` y lo adjunta a `req.user`.
4. El controlador usa `req.user.role` para decisiones de autorización.
5. Se consulta Supabase o MongoDB y se devuelve la respuesta JSON.

---

## 4. Cómo Arrancar el Proyecto

### Requisitos previos
- Node.js v18 o superior
- Cuentas activas en: Supabase, MongoDB Atlas, Cloudinary, Resend

### Instalación

```bash
git clone <repo-url>
cd Hurlingham_Backend
npm install
```

### Variables de entorno

Copiar el archivo de ejemplo y completar con las credenciales correspondientes:

```bash
cp .env.example .env
```

Contenido de `.env`:

```env
# SERVIDOR
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# JWT
JWT_SECRET=tu_secreto_muy_largo_y_aleatorio
JWT_REFRESH_SECRET=otro_secreto_diferente_para_refresh

# SUPABASE
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_KEY=eyJ...

# MONGODB
MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/hurlingham

# CLOUDINARY
CLOUDINARY_CLOUD_NAME=tu_cloud
CLOUDINARY_API_KEY=123456789
CLOUDINARY_API_SECRET=abc123

# RESEND (emails)
RESEND_API_KEY=re_xxxx
DEVELOPER_EMAIL=tu@email.com
```

### Correr en desarrollo

```bash
npm run dev
```

El servidor queda disponible en `http://localhost:3000`.

### Comandos disponibles

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor con nodemon (hot reload) |
| `npm start` | Servidor en producción |
| `npm run test` | Suite de tests automatizados con Jest |

---

## 5. Mapa Completo de Endpoints

### 🔐 Autenticación (`/api/auth`)

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| POST | `/api/auth/login` | ❌ Público | Iniciar sesión. Devuelve `accessToken` + `refreshToken` |
| POST | `/api/auth/refresh` | ❌ Público | Renovar access token con refresh token |
| POST | `/api/auth/logout` | ❌ Público | Invalidar refresh token |
| POST | `/api/auth/forgot-password` | ❌ Público | Enviar email de recuperación de contraseña |
| POST | `/api/auth/reset-password` | ❌ Público | Cambiar contraseña con el token del email |

### 👥 Usuarios (`/api/users`)

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/api/users` | 🔒 Admin | Listar todos los usuarios |
| GET | `/api/users/:id` | 🔒 Auth | Ver perfil (propio o cualquiera si es admin) |
| POST | `/api/users` | ❌ Público | Registrar nuevo usuario |
| PUT | `/api/users/:id` | 🔒 Auth | Actualizar nombre de usuario / avatar |
| DELETE | `/api/users/:id` | 🔒 Admin | Eliminar usuario y sus datos de Cloudinary |
| PATCH | `/api/users/:id/block` | 🔒 Admin | Bloquear / desbloquear usuario |
| PUT | `/api/users/:id/password` | 🔒 Auth | Cambiar contraseña propia |

### 🏪 Productores (`/api/producers`)

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/api/producers` | ❌ Público | Listar productores (filtros: `?category=&search=`) |
| GET | `/api/producers/:id` | ❌ Público | Ver perfil de un productor (por ID de Mongo o UUID de Supabase) |
| POST | `/api/producers` | 🔒 Admin | Crear productor |
| PUT | `/api/producers/:id` | 🔒 Auth | Actualizar productor (admin o dueño) |
| DELETE | `/api/producers/:id` | 🔒 Admin | Eliminar productor |
| GET | `/api/producers/:id/products` | ❌ Público | Obtener catálogo de productos de un productor |
| POST | `/api/producers/:id/products` | 🔒 Auth | Agregar producto al productor |
| DELETE | `/api/producers/:id/products/:productId` | 🔒 Auth | Quitar producto |
| POST | `/api/producers/:id/comments` | ⚡ Opcional | Dejar un comentario (anónimo o autenticado) |
| DELETE | `/api/producers/:id/comments/:commentId` | 🔒 Auth | Eliminar comentario (autor o admin) |

### 🏷️ Categorías (`/api/categorias`)

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/api/categorias` | ❌ Público | Listar categorías activas |
| POST | `/api/categorias` | 🔒 Admin | Crear categoría |
| PUT | `/api/categorias/:id` | 🔒 Admin | Editar categoría |
| DELETE | `/api/categorias/:id` | 🔒 Admin | Eliminar (solo si no hay productores asignados) |

### 📩 Contacto (`/api/contact`)

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| POST | `/api/contact` | ❌ Público | Enviar mensaje al administrador |
| GET | `/api/contact` | 🔒 Admin | Ver todos los mensajes recibidos |
| PATCH | `/api/contact/:id/read` | 🔒 Admin | Marcar mensaje como leído o no leído |

### 🌤️ API Externa (`/api/external`)

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/api/external/weather` | ❌ Público | Clima actual de Hurlingham (caché 15 min) |

### 📤 Imágenes (`/api/upload`)

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| POST | `/api/upload/image?folder=avatars` | 🔒 Auth | Subir imagen a Cloudinary. Devuelve `{ url, publicId }` |
| DELETE | `/api/upload/image` | 🔒 Auth | Eliminar imagen de Cloudinary por `publicId` |

### 🔔 Notificaciones (`/api/notifications`)

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/api/notifications/stream` | ❌ Público | Abrir conexión SSE para recibir eventos en tiempo real |

### 📊 GraphQL (`/graphql`)

Endpoint tipo POST que acepta queries y mutations GraphQL. Soporta autenticación JWT en el header `Authorization`. Consultá el playground en `http://localhost:3000/graphql`.

### ❤️ Health Check

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/health` | Devuelve estado del servidor y timestamp |

---

## 6. Guía de Postman (paso a paso)

### Paso 1 — Configurar la URL base

Creá una variable de entorno en Postman llamada `BASE_URL` con el valor:
```
http://localhost:3000
```

### Paso 2 — Login (obtener tokens)

**Request:**
```
POST {{BASE_URL}}/api/auth/login
Content-Type: application/json

{
  "email": "tu_email@test.com",
  "password": "TuContraseña123"
}
```

**Respuesta exitosa (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-aqui",
    "username": "marcelo",
    "email": "tu@email.com",
    "role": "admin"
  }
}
```

Copiar el valor de `accessToken` y almacenarlo como variable `TOKEN` en Postman.

### Paso 3 — Autorizar las peticiones protegidas

En la pestaña **Authorization** → Type: **Bearer Token** → pegá el valor del `accessToken`.

O podés agregarlo en el header manualmente:
```
Authorization: Bearer eyJhbGciOiJ...
```

> ℹ️ **Nota sobre Roles:** La creación de usuarios con rol `producer` requiere privilegios de Administrador. Para estos casos, se debe incluir el campo `"role": "producer"` en el cuerpo de la petición y enviar el `Bearer Token` de un administrador en la cabecera.

### Paso 5 — Listar productores con filtros

```
GET {{BASE_URL}}/api/producers?category=gastronomia
```
o sin filtro para traer todos:
```
GET {{BASE_URL}}/api/producers
```

### Paso 6 — Subir una imagen

```
POST {{BASE_URL}}/api/upload/image?folder=avatars
Authorization: Bearer <token>
Content-Type: multipart/form-data

[adjuntar archivo en campo "image"]
```

**Respuesta:**
```json
{
  "url": "https://res.cloudinary.com/tu-cloud/image/upload/...",
  "publicId": "hurlingham/avatars/abc123"
}
```

### Paso 7 — Renovar el access token vencido

Cuando el frontend recibe un error `401 Token expirado`:

```
POST {{BASE_URL}}/api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJ..."
}
```

**Respuesta:**
```json
{
  "accessToken": "nuevo_token_aqui..."
}
```

### Paso 8 — Probar el endpoint de clima

```
GET {{BASE_URL}}/api/external/weather
```

**Respuesta:**
```json
{
  "temperature": 23.4,
  "windspeed": 12.1,
  "weathercode": 3,
  "time": "2025-03-24T15:00",
  "location": "Hurlingham, BA"
}
```

---

## 7. Sistema de Autenticación JWT

### Roles disponibles

| Rol | Descripción |
|---|---|
| `user` | Usuario registrado. Puede ver y editar su propio perfil. |
| `producer` | Igual que `user` + accede a gestión de su perfil de productor. |
| `admin` | Acceso total. Puede gestionar usuarios, bloquear cuentas, ver mensajes, etc. |

### Flujo de tokens

```
Login → accessToken (dura 8h)  +  refreshToken (dura 7 días)
           ↓                              ↓
   [Peticiones normales]         [POST /api/auth/refresh]
                                         ↓
                                  nuevo accessToken (8h)
```

### Hashing de contraseñas (Esquema Dual)

El sistema usa un esquema de hashing personalizado de **120 caracteres** que combina dos hashes bcrypt, lo que hace que sea más resistente a ataques de diccionario comparado con un único hash:

```
hash_password   = bcrypt( password )             → 60 chars
hash_combo      = bcrypt( username + password )  → 60 chars

stored = hash_password[0..offset] + hash_combo + hash_password[offset..]
```

Donde `offset = username.length`. El resultado siempre tiene 120 caracteres y no puede deducirse el hash original sin conocer el nombre de usuario.

---

## 8. Arquitectura de Base de Datos

### ¿Por qué dos bases de datos?

El proyecto implementa una arquitectura **políglota** (múltiples motores de base de datos), eligiendo la herramienta correcta para cada tipo de dato:

| | Supabase (PostgreSQL) | MongoDB Atlas |
|---|---|---|
| **Fortaleza** | Relaciones, consistencia, Auth | Flexibilidad, documentos anidados |
| **Se usa para** | Usuarios, roles, tokens, categorías | Productores, productos, comentarios, mensajes de contacto |
| **Razón** | Los usuarios tienen relaciones rígidas (roles, refresh_tokens por FK) | Los productores tienen sub-documentos variables (N productos, N comentarios) |

### Esquema Supabase (PostgreSQL)

**Tabla `users`:**
```sql
id (UUID, PK), username, email, password (120 chars), 
role (user|producer|admin), avatar (URL), 
is_blocked (boolean), created_at, updated_at
```

**Tabla `refresh_tokens`:**
```sql
id, user_id (FK → users.id), token, expires_at
```

**Tabla `categorias`:**
```sql
id, nombre (unique, lowercase), icono (emoji)
```

### Esquemas MongoDB

**Colección `producers`:**
```javascript
{
  name, description, location, phone, email,
  category, imageUrl, imagePublicId, active,
  userId: String,  // UUID de Supabase (vínculo entre BDs)
  products: [{ name, description, imageUrl }],
  comments: [{ userId, username, text, parentId, createdAt }],
  createdAt, updatedAt
}
```

**Colección `contacts`:**
```javascript
{ name, email, phone, message, read: Boolean, createdAt }
```

**Colección `resettokens`:**
```javascript
{ email, token, expiresAt, used: Boolean }
```

---

## 9. Puntos Extra Implementados

### 9.1 Documentación Swagger / OpenAPI 3.0

**Qué es:** Interfaz gráfica interactiva que documenta automáticamente todos los endpoints de la API.

**Acceso:** `http://localhost:3000/api-docs`

**Cómo funciona:**
- La librería `swagger-jsdoc` lee los comentarios JSDoc `@swagger` en cada archivo de rutas.
- `swagger-ui-express` monta un panel visual generado a partir de esos comentarios.
- Permite probar los endpoints directamente desde el navegador, con soporte de autenticación Bearer Token.

**Archivo de configuración:** `src/config/swagger.js`

---

### 9.2 Helmet — Cabeceras HTTP de Seguridad

**Qué es:** Middleware que configura automáticamente las cabeceras HTTP de seguridad recomendadas por OWASP.

**Cabeceras que activa:**
- `X-Content-Type-Options: nosniff` — Previene ataques MIME sniffing
- `X-Frame-Options: DENY` — Previene Clickjacking
- `Content-Security-Policy` — Restringe de dónde se pueden cargar recursos
- `Strict-Transport-Security` — Fuerza HTTPS en producción
- `X-XSS-Protection` — Activa el filtro XSS del navegador

**Dónde se configura:** línea 74 de `index.js`
```javascript
app.use(helmet());
```

---

### 9.3 Rate Limiting — Protección contra DDoS y Fuerza Bruta

**Qué es:** Dos middlewares que limitan la cantidad de peticiones HTTP por IP.

**`loginRateLimiter`** — aplicado exclusivamente a `POST /api/auth/login`:
- Máximo **50 intentos** cada 15 minutos por IP.
- Si se supera, devuelve `429 Too Many Requests`.

**`apiLimiter`** — aplicado a todas las rutas `/api/*`:
- Máximo **1000 peticiones** cada 15 minutos por IP.
- Protege contra barridos masivos automatizados.

**Cabeceras de respuesta que incluye (estándar RFC 6585):**
```
RateLimit-Limit: 1000
RateLimit-Remaining: 999
RateLimit-Reset: 1711227123
```

---

### 9.4 Testing Automatizado — Jest + Supertest

**Qué es:** Suite de pruebas de integración que verifica el comportamiento del sistema de autenticación de forma automática, sin tocar la base de datos real.

**Cómo correrlos:**
```bash
npm run test
```

**Resultado esperado:**
```bash
PASS  tests/auth.test.js
  Auth Controller - Integration Tests
    POST /api/auth/login
      ✓ debe retornar error 401 si el usuario no existe (45 ms)
      ✓ debe retornar 403 si el usuario está bloqueado (12 ms)
      ✓ debe hacer login exitoso (200) y devolver accessToken y refreshToken (78 ms)
      ✓ debe retornar 401 si la contraseña es incorrecta (67 ms)

Tests: 4 passed, 4 total
```

**Estrategia de Mock:** La suite usa stubs nativos de JavaScript para reemplazar las llamadas a Supabase por objetos que devuelven las respuestas deseadas. Esto garantiza que los tests sean rápidos (< 3 segundos), deterministas, y que no generen datos falsos en la base de datos de producción.

**Archivo:** `tests/auth.test.js`

---

## 10. Testing Automatizado

### ¿Qué se prueba?

Los tests de integración verifican el controlador de autenticación (`auth.controller.js`) a través de la capa HTTP real usando `supertest`. Las 4 pruebas cubren los casos críticos:

| # | Descripción | Código esperado |
|---|---|---|
| 1 | Usuario inexistente en la base de datos | `401 Unauthorized` |
| 2 | Usuario con cuenta bloqueada por el admin | `403 Forbidden` |
| 3 | Login exitoso con contraseña correcta | `200 OK` + `accessToken` + `refreshToken` |
| 4 | Login con contraseña incorrecta | `401 Unauthorized` |

### Herramientas

- **Jest:** Framework de testing. Detecta y ejecuta los archivos `.test.js`, compara resultados con `expect()`.
- **Supertest:** Levanta el servidor Express en memoria y dispara peticiones HTTP reales sin necesitar un puerto abierto.
- **Stubs manuales:** Reemplazan la capa de Supabase para aislar el test del estado real de la base de datos.

### Configuración

El servidor de Express está configurado para **no arrancar** (no hacer `httpServer.listen`) cuando el entorno es de testing:

```javascript
// index.js
if (process.env.NODE_ENV !== 'test') {
  startServer();
}
export default app;
```

Esto permite que `supertest` importe el `app` directamente y gestione el tiempo de vida del servidor.

---

*Documentación generada para la entrega final del Trabajo Práctico — UTN Programación en la Nube 2026.*
