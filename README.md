# 🚀 Hurlingham PNO — Backend

Backend robusto para la plataforma **Hurlingham PNO Hub**, desarrollado como parte del TP Final de Backend.  
Implementa una arquitectura híbrida **REST + GraphQL** con comunicación en tiempo real vía **Socket.io**.

## 🛠️ Tecnologías

- **Node.js & Express**: Servidor principal.
- **Supabase (PostgreSQL)**: Gestión de usuarios y sesiones (SQL).
- **MongoDB Atlas**: Datos de productores, productos y contactos (NoSQL).
- **Apollo Server**: API GraphQL.
- **Socket.io**: Notificaciones en tiempo real.
- **Cloudinary**: Almacenamiento de imágenes de alta fidelidad.
- **Bcrypt & JWT**: Seguridad y autenticación.

## ⚙️ Setup Local

1. **Clonar y navegar:**

   ```bash
   git clone <repo-url>
   cd Hurlingham_Backend
   ```

2. **Instalar dependencias:**

   ```bash
   npm install
   ```

3. **Configurar Entorno:**
   Copia `.env.example` a `.env` y rellena las variables:

   ```bash
   cp .env.example .env
   ```

4. **Iniciar servidor:**

   ```bash
   # Modo desarrollo (con nodemon si está instalado)
   npm run dev

   # Modo normal
   npm start
   ```

## 📡 API Endpoints (REST)

### Autenticación

- `POST /api/auth/login`: Login con email/username.
- `POST /api/auth/refresh`: Refresca el `accessToken`.
- `POST /api/auth/logout`: Cierra sesión.

### Usuarios (Admin)

- `GET /api/users`: Lista todos los usuarios.
- `POST /api/users`: Crea un nuevo usuario.
- `PATCH /api/users/:id/block`: Bloquea/Desbloquea usuario.
- `DELETE /api/users/:id`: Elimina usuario.

### Productores (Público/Admin)

- `GET /api/producers`: Lista productores (con filtros de búsqueda).
- `POST /api/producers`: Crea un productor (Admin).
- `POST /api/producers/:id/products`: Agrega producto (Admin).

### Otros

- `POST /api/upload/image`: Sube imágenes a Cloudinary.
- `GET /api/external/weather`: Clima en vivo (Open-Meteo).
- `GET /api/external/news`: Noticias de actualidad (NewsAPI).

## 🔮 GraphQL

Accede al playground en `/graphql` (en desarrollo).

- **Query `producer(id)`**: Obtiene productor + productos + usuario vinculado.
- **Query `users`**: Lista de usuarios vinculados.

## 🔔 Tiempo Real (Socket.io)

El servidor emite el evento `admin:notification` en:

- Registro de nuevos usuarios.
- Eliminación de usuarios.
- Alta de nuevos productores o productos.

---

_Desarrollado para el TP Final - UTN Backend._
