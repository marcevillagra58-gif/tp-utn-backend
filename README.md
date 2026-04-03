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

---

## 2. Puntos Distintivos: "Características Extra" de Alto Nivel

Para superar ampliamente los requerimientos básicos del Trabajo Práctico e incorporar estándares de mercado reales, el proyecto incluye los siguientes avances técnicos excepcionales:

### 🌟 A. Documentación Auto-Generada y Embebida (Swagger UI)
Se descartó la entrega de documentación estática (Postman JSON Collections) en favor de una implementación nativa de **Swagger (OpenAPI V3)**.
- **Ventaja Académica:** Expone un panel visual montado directamente sobre el Backend (`/api-docs`). 
- Todas las rutas informan estrictamente **todos los posibles códigos de respuesta HTTP** (`200, 201, 400, 401, 403, 404, 500`), asegurando un contrato de software (Contract-First) inquebrantable para los consumidores de la API.

### 🌟 B. Criptografía Híbrida y Migración Dinámica de Claves
Uno de los logros arquitectónicos de este Backend es su sistema de hashing dual y migración en caliente (Hot Migration) para contraseñas.
- **Implementación:** El servidor diferencia e identifica si un hash de usuario heredado desde Supabase posee un formato antiguo (Hash Legacy de 60 caracteres) o si fue mejorado (Hash Estricto de 120 caracteres).
- **Mecanismo:** Si un usuario accede con una clave antigua, el sistema valida la identidad y, tras bambalinas de manera completamente transparente (sin exigir intervención manual), re-hashea la contraseña fortalecida y actualiza la bóveda. Esto consolida una política de seguridad *Zero-Trust* y demuestra un manejo criptográfico a nivel empresarial.

### 🌟 C. Integración de Servicios Externos y APIs Complementarias
Se extendió el modelo cerrado puramente CRUD consumiendo pasarelas de terceros para nutrir de datos externos la aplicación:
1. **Cloudinary API:** Sistema robusto alojado en la nube dedicado puramente a la recepción, procesado asíncrono y almacenamiento duradero de recursos binarios mediante flujos (Streams) FormData/Multipart, reemplazando el guardado inseguro de base64 en la base de datos.
2. **Integraciones REST Exteriores:** El backend actúa como *Proxy Transparente* e interceptor ante APIs externas como Meteorología (Open-Meteo), Noticias y sistemas gubernamentales (si aplica), resolviendo cuellos de botella de CORS.

### 🌟 D. Bases de Datos Diferenciadas (Persistencia Cursada)
Uso de un entorno Polyglot Persistence:
- **Relacional (Supabase/PostgreSQL):** Almacenamiento restringido para la autenticación en formato de tabla plana, soportando UUIDs relacionales como principal Foreign Key hacia otra infraestructura de datos.
- **NoSQL (MongoDB Atlas):** Gestión de catálogos comerciales (Productores, Productos Embebidos y Comentarios anidados) que exigen flexibilidad mutacional de documentos complejos en tiempos récord.

---

## 3. Modelo de Autorización (RBAC y JWT Local)

El modelo asume estricta **Seguridad de Nivel de Fila Lógico (Logical Row Level Security)** evaluando Identificadores Únicos Universales (UUID).
Se erradicó el rol básico de "User", enfocando el modelo a dos roles clave: **Admin** y **Producer**.
1. **Producer:** Sólo tiene derechos sobre entidades (productos y perfil) donde la condición sea `auth.userId === entity.ownerId`.
2. **Admin:** Bypass universal habilitado mediante *middlewares* especializados (`adminMiddleware`).

Por encima, la gestión de Tokens no descansa únicamente en la solución preempaquetada de Supabase, sino que construye y asienta `Access Tokens` (Caducidad 8 horas) y `Refresh Tokens` manuales alojados asincrónicamente por el Backend.

---

## 4. Instrucciones Técnicas de Levantamiento

Para montar esta estructura localmente o auditar la aplicación:

1. **Instalación de Dependencias**
   ```bash
   npm install
   ```

2. **Entorno `.env`**
   Se debe garantizar que las cadenas de conexión (URI) hacia *MongoDB* y *Supabase* están activas, junto a sus secretos criptográficos estáticos (`JWT_SECRET`).

3. **Ejecución y Modos de Testeo (TDD)**
   Para auditar el código se incluye la suite de testing automatizada desarrollada con **Jest** y **Supertest**:
   ```bash
   # Ejecutar los tests unitarios y de integración
   npm test

   # Levantar el servidor en entorno local para uso manual
   npm run dev
   ```

4. **Acceder a Swagger UI (Despliegue Local o Remoto)**
   Una vez levantado el servidor, la documentación interactiva Swagger reemplaza la necesidad de usar Postman. 
   Para hacer pruebas manuales directas, simplemente abrí un navegador y entrá a la ruta `/api-docs`:
   - URL Local: `http://localhost:3000/api-docs`
   - URL Remota (Vercel): `https://<tu-url-de-vercel>.vercel.app/api-docs`

---
*Fin Documento Versión V1.0*
