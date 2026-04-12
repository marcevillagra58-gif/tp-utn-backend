# 📡 Guía de Estudio: Tipos de API en el Proyecto Hurlingham PNO Hub

> Documento de estudio para la defensa académica del TP Final  
> UTN — Programación en la Nube 2026

---

## ¿Qué es una API?

Una **API (Application Programming Interface)** es un contrato de comunicación entre dos sistemas de software. Define *qué podés pedir*, *cómo pedirlo* y *qué esperás recibir*. No importa cómo está construido el sistema detrás: si respeta el contrato, podés hablar con él.

En este proyecto usamos **5 tipos distintos de API**, cada uno elegido por sus ventajas específicas.

---

## 1. 🔵 API REST (Representational State Transfer)

### ¿Qué es?
El estándar más difundido para comunicación entre Frontend y Backend a través de HTTP. Define que cada **URL (endpoint)** representa un **recurso** y que las **operaciones se expresan mediante verbos HTTP**:

| Verbo HTTP | Operación CRUD | Ejemplo en nuestro proyecto |
|---|---|---|
| `GET` | Leer | `GET /api/producers` → obtener lista |
| `POST` | Crear | `POST /api/auth/login` → iniciar sesión |
| `PUT` | Reemplazar | `PUT /api/producers/:id` → actualizar productor |
| `PATCH` | Modificar parcialmente | `PATCH /api/contact/:id/read` → marcar como leído |
| `DELETE` | Eliminar | `DELETE /api/producers/:id` → borrar productor |

### ¿Qué aporta?
- **Estándar universal**: cualquier cliente (browser, mobile, Postman) puede consumirla
- **Sin estado (Stateless)**: cada request contiene toda la info necesaria (no hay sesión del lado del servidor)
- **Caché**: los `GET` son cacheables por la infraestructura
- **Escalable**: perfecta para entornos Serverless como Vercel

### ¿Dónde se ve en el código?
```
src/routes/
  ├── auth.routes.js       → POST /api/auth/login, refresh, logout
  ├── users.routes.js      → CRUD de usuarios
  ├── producers.routes.js  → CRUD de productores + productos + comentarios
  ├── categories.routes.js → CRUD de categorías
  ├── contact.routes.js    → mensajes de contacto
  ├── external.routes.js   → clima y transporte
  ├── upload.routes.js     → subida de imágenes
  └── notifications.routes.js → SSE
```

### ¿Cómo la consume el Frontend?
```javascript
// src/utils/API.js
const response = await fetch(`${API_BASE_URL}/producers`, {
  headers: { Authorization: `Bearer ${token}` }
})
```

### Posibles preguntas de defensa
> **¿Por qué REST y no algo más moderno?**  
> REST es el estándar de la industria para APIs públicas y consumidas por múltiples clientes. Es predecible, documentable con Swagger, y compatible con cualquier tecnología de Frontend.

---

## 2. 🟣 API GraphQL

### ¿Qué es?
Un lenguaje de consulta para APIs desarrollado por Facebook/Meta. En vez de tener muchos endpoints (uno por recurso), tenés **un único endpoint** (`/graphql`) al que le enviás consultas declarando *exactamente qué campos querés*.

### REST vs GraphQL — La diferencia clave

```
// Con REST: 3 requests para obtener productor + categoría + comentarios
GET /api/producers/123
GET /api/categories/456
GET /api/producers/123/comments

// Con GraphQL: 1 solo request pidiendo exactamente lo que necesitás
POST /graphql
{ "query": "{ producer(id: \"123\") { name category { nombre } comments { text } } }" }
```

### ¿Qué aporta?
- **Sin Over-fetching**: el cliente pide solo los campos que necesita
- **Sin Under-fetching**: evita el problema de hacer múltiples requests para armar una vista
- **Tipado fuerte**: el Schema define exactamente qué existe y qué tipo tiene
- **Introspección**: cualquier cliente puede preguntar qué puede hacer y el servidor responde con toda la documentación

### ¿Dónde se ve en el código?
```
src/graphql/
  ├── typeDefs.js    → Define el Schema (tipos, queries, mutations)
  └── resolvers.js   → Implementa la lógica de cada query/mutation
```

```javascript
// typeDefs.js — define el "contrato"
type Producer {
  id: ID!
  name: String!
  category: String
  products: [Product]
}
type Query {
  producers: [Producer]
  producer(id: ID!): Producer
}
```

```javascript
// resolvers.js — implementa la lógica
Query: {
  producers: async () => await Producer.find({ active: true }),
  producer: async (_, { id }) => await Producer.findById(id)
}
```

**Endpoint:** `https://tp-utn-backend.vercel.app/graphql`

### Posibles preguntas de defensa
> **¿Cuándo conviene GraphQL sobre REST?**  
> Cuando el Frontend tiene vistas con datos muy variados (un dashboard que muestra partes de muchos recursos), o cuando hay múltiples clientes que necesitan distintos campos del mismo recurso.

> **¿GraphQL reemplaza a REST?**  
> No, son complementarios. Usamos REST para los endpoints CRUD estándar y GraphQL para consultas flexibles de lectura.

---

## 3. 🟡 APIs de Terceros (APIs Externas REST)

### ¿Qué es?
Son APIs públicas o privadas de otros proveedores que se consumen desde nuestro Backend para enriquecer la aplicación con datos o servicios externos.

---

### 3.1 Open-Meteo — Clima (Pública y Gratuita)

| Dato | Valor |
|---|---|
| Proveedor | open-meteo.com |
| Autenticación | Ninguna (pública) |
| Endpoint externo | `https://api.open-meteo.com/v1/forecast?latitude=-34.59&longitude=-58.64&current_weather=true` |
| Nuestro endpoint | `GET /api/external/weather` |

**Patrón clave — Proxy Backend:**
> El Frontend **NO llama directamente** a Open-Meteo. Le pega a nuestro backend en `/api/external/weather`, y el backend hace la llamada a Open-Meteo y retorna los datos formateados.

**¿Por qué este patrón?**
1. **Evita CORS**: Open-Meteo puede bloquear requests desde browsers arbitrarios
2. **Caché del servidor**: el backend puede cachear la respuesta 15 minutos y no saturar la API externa
3. **Transformación**: el backend limpia y simplifica los datos antes de enviarlos al Frontend

```javascript
// src/routes/external.routes.js
router.get('/weather', async (req, res) => {
  const response = await fetch('https://api.open-meteo.com/v1/forecast?...')
  const data = await response.json()
  res.json({
    temperature: data.current_weather.temperature,
    windspeed: data.current_weather.windspeed,
    location: 'Hurlingham, BA'
  })
})
```

**¿Dónde se ve en el Frontend?**
```
src/components/WeatherWidget.jsx
src/hooks/useExternalData.js
```

---

### 3.2 Cloudinary — CDN e Imágenes

| Dato | Valor |
|---|---|
| Proveedor | cloudinary.com |
| Autenticación | API Key + Secret (env vars) |
| SDK | npm `cloudinary` |
| Nuestro endpoint | `POST /api/upload/image` |

**Flujo completo de subida de imagen:**
```
Usuario elige foto
    → Frontend envía FormData
    → POST /api/upload/image con multer (parsea el archivo en memoria)
    → cloudinary.uploader.upload_stream() sube al CDN
    → Cloudinary devuelve URL pública
    → Backend responde { url, publicId }
    → Frontend guarda la URL en la DB como string
```

**¿Por qué Cloudinary y no guardar en la DB?**
- Las imágenes son binarias y pesan mucho → nunca se guardan en bases de datos
- Cloudinary sirve las imágenes desde CDN global (performance para cualquier usuario)
- Transforma imágenes on-the-fly solo con cambiar parámetros en la URL

```javascript
// src/utils/cloudinary.js
export const uploadImage = (buffer, folder) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { folder, transformation: [{ quality: 'auto', fetch_format: 'auto' }] },
      (error, result) => resolve({ url: result.secure_url, publicId: result.public_id })
    ).end(buffer)
  })
}
```

---

### 3.3 Resend — Emails Transaccionales

| Dato | Valor |
|---|---|
| Proveedor | resend.com |
| Autenticación | API Key (env var) |
| SDK | npm `resend` |
| Uso | Emails de recuperación de contraseña |

```javascript
// src/services/mailer.js
const resend = new Resend(RESEND_API_KEY)
await resend.emails.send({
  from: 'Hurlingham PNO <onboarding@resend.dev>',
  to: [developerEmail],
  subject: '🔑 Recuperación de contraseña',
  html: `<a href="${resetLink}">Restablecer contraseña</a>`
})
```

---

## 4. 🟢 Supabase Client — API de Base de Datos PostgreSQL

### ¿Qué es?
Supabase expone un **SDK de JavaScript** que permite interactuar con PostgreSQL sin escribir SQL puro. Se comunica con el servidor de Supabase en la nube a través de su propia API REST interna.

### ¿Qué aporta?
- **Abstracción del SQL**: operamos con métodos fluidos encadenados
- **RLS (Row Level Security)**: reglas de seguridad definidas en el level de la base de datos
- **UUID nativos**: IDs únicos universales, perfectos para relacionar con MongoDB

```javascript
// src/db/supabase.js — inicialización
import { SUPABASE_URL, SUPABASE_KEY } from '../config/config.js'
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// Ejemplo en un controller — sin una sola línea de SQL
const { data: user, error } = await supabase
  .from('users')
  .select('*')
  .eq('email', email)
  .single()
```

### ¿Qué tablas maneja?
| Tabla | Datos |
|---|---|
| `users` | id, username, email, password, role, avatar, is_blocked |
| `refresh_tokens` | id, user_id (FK), token, expires_at |
| `categorias` | id, nombre, icono |

---

## 5. 🔴 SSE — Server-Sent Events (Notificaciones en Tiempo Real)

### ¿Qué es?
Una tecnología del estándar HTTP que permite al servidor **enviar datos al cliente de forma continua y unidireccional** sin que el cliente tenga que hacer múltiples requests. El cliente abre una conexión y el servidor puede empujar eventos cuando quiera.

### SSE vs WebSocket vs Polling

| | SSE | WebSocket | Polling |
|---|---|---|---|
| Dirección | Servidor → Cliente | Bidireccional | Cliente pregunta |
| Protocolo | HTTP estándar | Propio (WS://) | HTTP |
| Serverless | ✅ Compatible | ❌ Incompatible | ✅ Compatible |
| Complejidad | Baja | Alta | Muy baja |
| Caso de uso | Notificaciones, feeds | Chat en tiempo real | Estado simple |

### ¿Por qué SSE y no WebSockets?
Vercel es un entorno **Serverless**: no mantiene procesos corriendo entre requests. WebSockets necesitan una conexión persistente bidireccional que Serverless no puede mantener. SSE funciona sobre HTTP estándar y sí es compatible.

```javascript
// src/routes/notifications.routes.js — Backend
router.get('/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')

  const sendEvent = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`)
  }

  // Cuando otros endpoints emiten eventos (ej: nuevo productor)
  // el cliente los recibe automáticamente sin hacer más requests
})
```

```jsx
// src/context/NotificationContext.jsx — Frontend
const eventSource = new EventSource(`${API_BASE_URL}/notifications/stream`)
eventSource.onmessage = (event) => {
  const notification = JSON.parse(event.data)
  showNotification(notification.message)
}
```

---

## 📊 Mapa Visual Completo

```
                    FRONTEND (React — Vercel)
                           │
          ┌────────────────┼──────────────────┐
          │                │                  │
      REST API         GraphQL               SSE
   /api/producers      /graphql        /notifications
   /api/auth                               /stream
   /api/users
   /api/upload
   /api/external
          │
     BACKEND (Express — Vercel Serverless)
          │
    ┌─────┼─────────────────────┐
    │     │                     │
 Supabase  MongoDB          APIs Externas
 (usuarios)(productores)        │
                       ┌────────┼───────┐
                    Open-Meteo  Cloudinary  Resend
                     (clima)   (imágenes) (emails)
```

---

## 🎯 Tabla Resumen para la Defensa

| Tipo de API | ¿Cuándo la usamos? | Ventaja Principal |
|---|---|---|
| **REST** | Operaciones CRUD estándar | Universal, documentable, Stateless |
| **GraphQL** | Consultas flexibles de lectura | Un solo request, pido solo lo que necesito |
| **Open-Meteo (proxy)** | Clima actual de Hurlingham | Evita CORS, permite caché en servidor |
| **Cloudinary** | Gestión de imágenes | CDN global, transformación on-the-fly |
| **Resend** | Emails transaccionales | Simple, confiable, trazable |
| **Supabase Client** | Acceso a PostgreSQL | Abstrae SQL, RLS integrado, UUIDs |
| **SSE** | Notificaciones en tiempo real | HTTP estándar, compatible con Serverless |

---

## 🎓 Pregunta trampa frecuente en defensas

> **¿Qué diferencia hay entre una API y un endpoint?**

Una **API** es el conjunto completo del contrato de comunicación (como un reglamento).  
Un **endpoint** es una URL específica dentro de esa API (como un artículo dentro del reglamento).

**Ejemplo concreto:** La *API REST de Hurlingham* tiene entre sus *endpoints* a `GET /api/producers` y `POST /api/auth/login`.

---

> **¿Por qué usaste dos bases de datos distintas?**

Porque cada motor es óptimo para un tipo de dato diferente. PostgreSQL (Supabase) es ideal para datos relacionales y estructurados como usuarios, contraseñas y roles, donde la consistencia y las relaciones rígidas son críticas. MongoDB es ideal para documentos flexibles como productores con N productos y N comentarios anidados, donde el esquema puede variar.

---

> **¿Qué es un API Gateway? ¿Lo usás?**

Un API Gateway es una capa que centraliza todas las entradas a una API (autenticación, rate limiting, routing). En este proyecto, Express actúa como Gateway: todos los requests pasan por sus middlewares de Helmet, CORS y Rate Limiting antes de llegar a las rutas.

---

*Documento generado para la defensa del TP Final — UTN Programación en la Nube 2026*
