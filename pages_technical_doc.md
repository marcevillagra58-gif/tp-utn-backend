# Documentación Técnica de Páginas - Hurlingham PNO

## 📋 Índice Rápido

| # | Página | Ruta | Complejidad | Protección |
|---|--------|------|-------------|------------|
| 1 | [HomePage](#1-homepage) | /homepage | ⚫ Simple | Pública |
| 2 | [PrincipalPage](#2-principalpage) | /principal | ⚫ Simple | Pública |
| 3 | [EducacionPage](#3-educacionpage) | /educacion | 🟡 Media | Pública |
| 4 | [HistoriaPage](#4-historiapage) | /historia | 🟡 Media | Pública |
| 5 | [CulturaPage](#5-culturapage) | /cultura | 🟡 Media | Pública |
| 6 | [ImagenesPage](#6-imagenespage) | /imagenes | ⚫ Simple | Pública |
| 7 | [MercadolinghamPage](#7-mercadolinghampage) | /mercadolingham | 🟡 Media | Pública |
| 8 | [ProducerDetailsPage](#8-producerdetailspage) | /producer/:id | 🔴 Compleja | Pública/Condicional |
| 9 | [AdminPage](#9-adminpage) | /admin | 🔴 Compleja | Solo Admin |
| 10 | [NotFoundPage](#10-notfoundpage) | /* | ⚫ Simple | Pública |

---

## 1. HomePage

### 📍 Información Básica
- **Ruta:** `/homepage` (ruta raíz)
- **Archivo:** `src/pages/HomePage.jsx`
- **Layout:** HeaderOnlyLayout (sin Footer)
- **Complejidad:** Simple

### 🎯 Funcionalidad
Página de bienvenida con animación de texto circular infinito y escudo de Hurlingham. Primera página que ve el usuario al entrar al sitio.

### 🧩 Componentes Utilizados
| Componente | Uso |
|------------|-----|
| `useTransition` | Hook para navegación animada a /principal |
| Escudo imagen | `/assets/escudo.jpeg` |

### 📦 Props/Estado
```javascript
const letters = "BIENVENIDOS A HURLINGHAM".split("");
const { transition } = useTransition();
```

### 🎨 Características Visuales
- Doble wrapper para efecto envolvente
- Texto circular giratorio continuo
- Escudo centrado
- Botón "Ingresar" → navega a /principal

### 📊 Datos Utilizados
- Ninguno (contenido hardcodeado)

### 🔗 Navegación
- **Destino principal:** `/principal` (con transición animada)

---

## 2. PrincipalPage

### 📍 Información Básica
- **Ruta:** `/principal`
- **Archivo:** `src/pages/PrincipalPage.jsx`
- **Layout:** MainLayout (Header + Footer)
- **Complejidad:** Simple

### 🎯 Funcionalidad
Página principal con bienvenida y imagen del municipio. Primera página después del HomePage al hacer click en "Ingresar".

### 🧩 Componentes Utilizados
| Componente | Uso |
|------------|-----|
| `Escritor` | Título animado "Bienvenidos a Hurlingham" |

### 📦 Props/Estado
```javascript
// Sin estado propio
```

### 🎨 Características Visuales
- Imagen del edificio municipal
- Layout centrado y responsive
- Texto manuscrito animado

### 📊 Datos Utilizados
- Imagen: `/assets/Municipio-de-Hurlingham-HOME.jpg`

### 🔗 Navegación
- Header disponible para navegar a otras secciones

---

## 3. EducacionPage

### 📍 Información Básica
- **Ruta:** `/educacion`
- **Archivo:** `src/pages/EducacionPage.jsx`
- **Layout:** MainLayout
- **Complejidad:** Media

### 🎯 Funcionalidad
Página de educación con visualización atómica de instituciones educativas. Muestra UNaHur en el centro y 3 órbitas con instituciones alrededor.

### 🧩 Componentes Utilizados
| Componente | Uso |
|------------|-----|
| `Escritor` | Título "Educacion" |
| `AtomicVisualization` | Sistema completo de visualización atómica |
| `AtomOrbit` | (dentro de AtomicVisualization) |
| `InstitutionCard` | (dentro de AtomOrbit) |

### 📦 Props/Estado
```javascript
// Sin estado local
```

### 📊 Datos Utilizados
- **Fuente:** `src/data/educacionData.js`
- **Estructura:**
  - Centro: UNaHur
  - Órbita 1: 6 instituciones
  - Órbita 2: 6 instituciones
  - Órbita 3: 5 instituciones
  - **Total:** 17 instituciones educativas

### 🔗 Interactividad
- Links clicables a sitios de instituciones
- Órbitas giratorias animadas

---

## 4. HistoriaPage

### 📍 Información Básica
- **Ruta:** `/historia`
- **Archivo:** `src/pages/HistoriaPage.jsx`
- **Layout:** MainLayout
- **Complejidad:** Media

### 🎯 Funcionalidad
Página de historia de Hurlingham con mapa interactivo y modales informativos. Muestra 3 localidades: Hurlingham, Villa Tesei, William Morris.

### 🧩 Componentes Utilizados
| Componente | Uso |
|------------|-----|
| `Escritor` | Título "HURLINGHAM: Su Historia" |
| `HistoriaMap` | Mapa con hotspots clicables |
| `HistoriaModal` | Modal con información de localidad |

### 📦 Props/Estado
```javascript
const [activeLocality, setActiveLocality] = useState(null);

const handleHotspotClick = (locality) => setActiveLocality(locality);
const closeModal = () => setActiveLocality(null);
```

### 📊 Datos Utilizados
- **Fuente:** `src/data/historiaData.js`
- **Estructura:** 3 localidades con:
  - Título
  - Descripción
  - 2 imágenes históricas cada una
  - Coordenadas de hotspots en mapa

### 🔗 Interactividad
- Click en hotspot → abre modal
- Modal muestra: título, descripción, imágenes
- Botón cerrar (×) para cerrar modal

---

## 5. CulturaPage

### 📍 Información Básica
- **Ruta:** `/cultura`
- **Archivo:** `src/pages/CulturaPage.jsx`
- **Layout:** MainLayout
- **Complejidad:** Media

### 🎯 Funcionalidad
Página de cultura con músicos/bandas locales y murales de la ciudad. Exhibe el patrimonio cultural y artístico de Hurlingham.

### 🧩 Componentes Utilizados
| Componente | Uso |
|------------|-----|
| `Escritor` | Título "Cultura" |
| `MusicianCard` | Tarjetas de músicos (5 instancias) |
| `MuralGallery` | Galería grid de murales |

### 📦 Props/Estado
```javascript
// Sin estado local
```

### 📊 Datos Utilizados
- **Fuente:** `src/data/culturaData.js`
- **Músicos:** 5 artistas/bandas
  - Sumo, Las Pelotas, Divididos, La Ruta de Sumo, Orquesta Típica José Massa
- **Murales:** 8 murales callejeros con imágenes

### 🔗 Interactividad
- Links clicables a información de cada artista
- Grid responsive de murales

---

## 6. ImagenesPage

### 📍 Información Básica
- **Ruta:** `/imagenes`
- **Archivo:** `src/pages/ImagenesPage.jsx`
- **Layout:** MainLayout
- **Complejidad:** Simple

### 🎯 Funcionalidad
Galería de imágenes de lugares emblemáticos de Hurlingham. Carrusel con efecto 3D coverflow de 10 imágenes.

### 🧩 Componentes Utilizados
| Componente | Uso |
|------------|-----|
| `Carousel` | Carrusel completo con Swiper |

### 📦 Props/Estado
```javascript
// Estado manejado dentro de Carousel
```

### 📊 Datos Utilizados
- **Fuente:** Hardcodeado dentro de Carousel
- **Lugares:** 10 imágenes
  - Centro Cultural Leopoldo Marechal
  - Paseo Florido
  - Estación Hurlingham
  - Edificio Municipal
  - Hospital San Bernardino
  - Etc.

### 🔗 Interactividad
- Navegación con flechas
- Paginación
- Efecto coverflow 3D
- Responsive

---

## 7. MercadolinghamPage

### 📍 Información Básica
- **Ruta:** `/mercadolingham`
- **Archivo:** `src/pages/MercadolinghamPage.jsx`
- **Layout:** MainLayout
- **Complejidad:** Media

### 🎯 Funcionalidad
Página de MercadoLingham - marketplace local que conecta productores con clientes. Vidriera de contacto sin intermediación en transacciones.

### 🧩 Componentes Utilizados
| Componente | Uso |
|------------|-----|
| `Escritor` | Título "MercadoLingham" |
| `Producers` | Lista de productores con carga de API |

### 📦 Props/Estado
```javascript
// Estado manejado en Producers component
```

### 📊 Datos Utilizados
- **Fuente:** API_ML (MockAPI) - dinámico
- **Endpoint:** Configurado en .env como VITE_API_ML
- **Estructura:** Array de productores

### 🔗 Navegación
- Click en productor → `/mercadolingham/producer/:id`

### 📋 Secciones
1. **Header:** Título y tagline
2. **Misión:** Explicación del propósito
3. **Directorio:** Lista de productores
4. **Call-to-action:** Invitación a sumarse
5. **Footer:** Aclaraciones legales

---

## 8. ProducerDetailsPage

### 📍 Información Básica
- **Ruta:** `/mercadolingham/producer/:id`
- **Archivo:** `src/pages/ProducerDetailsPage.jsx`
- **Layout:** MainLayout
- **Complejidad:** 🔴 Compleja

### 🎯 Funcionalidad
Página de perfil de productor con información, productos y edición inline. Permite al dueño editar datos, cambiar contraseña y gestionar productos.

### 🧩 Componentes Utilizados
| Componente | Uso |
|------------|-----|
| `ProducerHeader` | Header con nombre, descripción y botones |
| `ProducerInfo` | Avatar y contactos |
| `ProductCarousel` | Carrusel de productos con Swiper |
| `PasswordModal` | Modal de cambio de contraseña |

### 🪝 Hooks Utilizados
| Hook | Funcionalidad |
|------|---------------|
| `useProducerData(id)` | Carga de datos del productor |
| `useProducerEdit(producer, id, setProducer)` | Edición inline de perfil |
| `usePasswordChange()` | Cambio de contraseña |
| `useProductManager()` | CRUD de productos (slots 1-20) |
| `useAuth()` | Verificación de ownership |
| `useParams()` | Obtención de ID desde URL |

### 📦 Props/Estado
```javascript
const { id } = useParams();
const { user } = useAuth();
const { producer, setProducer, loading, error } = useProducerData(id);
const { isEditing, editFormData, handleEditClick, handleInputChange } = 
  useProducerEdit(producer, id, setProducer);
// ... más hooks
```

### 🔐 Permisos
```javascript
const isOwner = user && producer && (user.idProductor === producer.idProductor);
```
- **Vista pública:** Cualquiera puede ver
- **Edición:** Solo dueño (isOwner = true)

### 📊 Datos Utilizados
- **Fuente:** API_ML (MockAPI)
- **Estructura Productor:**
  - Info: name, description, contact1, contact2, avatar
  - Productos: name1-20, description1-20, imagen1-20

### 🔗 Funcionalidades
- Edición inline de perfil
- Cambio de contraseña
- CRUD de productos:
  - Crear (máximo 20)
  - Editar
  - Eliminar
- Carrusel vertical con efecto coverflow

---

## 9. AdminPage

### 📍 Información Básica
- **Ruta:** `/admin`
- **Archivo:** `src/pages/AdminPage.jsx`
- **Layout:** MainLayout
- **Complejidad:** 🔴 Compleja
- **Protección:** ✅ Solo Admin

### 🎯 Funcionalidad
Página de administración para gestión completa de usuarios. Permite crear, bloquear/desbloquear y eliminar usuarios. Solo accesible para admin.

### 🧩 Componentes Utilizados
| Componente | Uso |
|------------|-----|
| `UserCard` | Tarjeta individual de usuario (múltiples instancias) |
| `CreateUserModal` | Modal de creación con avatar |
| `DeleteConfirmModal` | Confirmación de eliminación |

### 🪝 Hooks Utilizados
| Hook | Funcionalidad |
|------|---------------|
| `useUserManagement()` | Lista y gestión de usuarios |
| `useUserCreate()` | Creación de usuarios |
| `useUserDelete()` | Eliminación de usuarios |
| `useUserBlockToggle()` | Bloqueo/desbloqueo |
| `useImageUpload()` | Carga de avatares |

### 📦 Props/Estado
```javascript
const { users, loading, error, addUser, removeUser, updateUser } = useUserManagement();
const { isCreating, createUser } = useUserCreate();
const { isDeleting, deleteUser } = useUserDelete();
const { isTogglingBlock, toggleUserBlock } = useUserBlockToggle();
const { uploading, imageUrl, uploadImage, clearImage } = useImageUpload();
// + estado local de modales
```

### 🔐 Protección
```javascript
// En App.jsx
<Route element={<ProtectedRoute adminOnly={true} />}>
  <Route path="/admin" element={<AdminPage />} />
</Route>
```
- Requiere: `user.name === 'admin'`

### 📊 Datos Utilizados
- **Fuente:** API_USERS (MockAPI)
- **Estructura Usuario:**
  - idProductor (ID)
  - name
  - password
  - avatar (URL de ImgBB)
  - state (true/false - activo/bloqueado)

### 🔗 Funcionalidades
- Listar todos los usuarios
- Crear nuevos usuarios con avatar
- Bloquear/desbloquear usuarios
- Eliminar usuarios (cascada: borra también en API_ML)
- Vista responsive de tarjetas

---

## 10. NotFoundPage

### 📍 Información Básica
- **Ruta:** `*` (catch-all)
- **Archivo:** `src/pages/NotFoundPage.jsx`
- **Layout:** MainLayout
- **Complejidad:** Simple

### 🎯 Funcionalidad
Página de error 404 mostrada cuando una ruta no existe o no está autorizada. Diseño limpio con opciones de navegación.

### 🧩 Componentes Utilizados
| Componente | Uso |
|------------|-----|
| `DecorativeCircles` | SVG animado de fondo |
| `useNavigate` (hook) | Navegación programática |

### 📦 Props/Estado
```javascript
const navigate = useNavigate();
```

### 🔗 Navegación
- **Botón 1:** "Volver al Inicio" → `navigate('/homepage')`
- **Botón 2:** "Página Anterior" → `navigate(-1)`

### 🎨 Características Visuales
- Código de error 404 grande
- Mensaje claro de error
- Círculos decorativos animados
- Dos botones de acción

---

## 📊 Resumen por Categoría

### Por Complejidad

| Complejidad | Cantidad | Páginas |
|-------------|----------|---------|
| ⚫ Simple | 4 | HomePage, PrincipalPage, ImagenesPage, NotFoundPage |
| 🟡 Media | 4 | EducacionPage, HistoriaPage, CulturaPage, MercadolinghamPage |
| 🔴 Compleja | 2 | ProducerDetailsPage (4 hooks), AdminPage (5 hooks) |

### Por Fuente de Datos

| Fuente | Cantidad | Páginas |
|--------|----------|---------|
| **Estáticos** (src/data) | 3 | EducacionPage, HistoriaPage, CulturaPage |
| **API Dinámica** | 3 | MercadolinghamPage, ProducerDetailsPage, AdminPage |
| **Sin datos** | 4 | HomePage, PrincipalPage, ImagenesPage, NotFoundPage |

### Por Protección

| Tipo | Cantidad | Páginas |
|------|----------|---------|
| **Públicas** | 9 | Todas excepto AdminPage |
| **Solo Admin** | 1 | AdminPage |
| **Condicional** | 1 | ProducerDetailsPage (edición solo para dueño) |

---

## 📱 Diseño Responsive

### 🎯 Overview

Todo el sitio está optimizado para dispositivos móviles, tablets y desktop. Se implementaron breakpoints estratégicos y componentes adaptativos para garantizar una experiencia de usuario óptima en todas las resoluciones.

### 📏 Breakpoints Utilizados

| Breakpoint | Dispositivo | Cambios Aplicados |
|------------|-------------|-------------------|
| ≤ 480px | Móviles extra pequeños | Texto 50%, layout compacto |
| ≤ 600px | Móviles pequeños | Texto 60%, padding reducido |
| ≤ 768px | Móviles medianos | Texto 70%, footer vertical |
| ≤ 912px | Tablets / móviles grandes | Texto 85%, infinito vertical |
| ≤ 1200px | Desktop pequeño | Texto 95% |
| > 1200px | Desktop | Tamaño completo 100% |

### 🧩 Componentes Responsive

#### 1. Header (Navegación)

**Archivo:** `src/css/Header.css` + `src/components/Header.jsx`

**Características:**
- **Desktop (> 912px):** Navegación horizontal completa
- **Mobile (≤ 912px):** 
  - Menú hamburguesa (3 líneas)
  - Navegación vertical desplegable
  - Cierre automático al seleccionar opción
  - Botones Login/Logout siempre visibles

**Breakpoints específicos:**
```css
@media (max-width: 768px)  /* Tablet */
@media (max-width: 480px)  /* Mobile pequeño */
```

#### 2. Footer

**Archivo:** `src/css/Footer.css`

**Características:**
- **Desktop:** Layout horizontal con `justify-content: space-around`
- **Mobile (≤ 768px):**
  - Layout vertical (`flex-direction: column`)
  - Textos centrados
  - Iconos de redes sociales reducidos
  - Altura variable según contenido

#### 3. Diseño Infinito (HomePage)

**Archivo:** `src/css/infinito.css`

**Características:**
- **Desktop (> 912px):** Círculos horizontales lado a lado
- **Mobile/Tablet (≤ 912px):**
  - Círculos apilados verticalmente (top/bottom)
  - Wrapper 1 (izquierdo) → arriba
  - Wrapper 2 (derecho) → abajo
  - Animación de rotación mantenida
  - Escalado progresivo en 600px y 480px

**Código clave:**
```css
@media (max-width: 912px) {
  .wrapper:nth-child(1) { top: 0; }
  .wrapper:nth-child(2) { bottom: 0; }
}
```

#### 4. TextoManuscrito (Títulos Animados)

**Archivos:** 
- `src/hooks/useResponsiveFontSize.js` (NUEVO)
- `src/components/TextoManuscrito.jsx`

**Características:**
- Hook personalizado `useResponsiveFontSize`
- Escalado automático basado en `window.innerWidth`
- Se adapta en tiempo real al redimensionar ventana
- Sin necesidad de recargar página

**Escalado aplicado:**
| Ancho | Porcentaje | Ejemplo (base 50px) |
|-------|------------|---------------------|
| ≤ 480px | 50% | 25px |
| ≤ 600px | 60% | 30px |
| ≤ 768px | 70% | 35px |
| ≤ 912px | 85% | 42.5px |
| ≤ 1200px | 95% | 47.5px |
| > 1200px | 100% | 50px |

**Páginas afectadas:**
- PrincipalPage ("Bienvenidos a Hurlingham")
- EducacionPage ("Educacion")
- HistoriaPage ("HURLINGHAM: Su Historia")
- CulturaPage ("Cultura")
- MercadolinghamPage ("MercadoLingham")

### 🎨 Optimizaciones Visuales

- **Imágenes:** Se mantienen en `object-fit: contain` para evitar distorsión
- **Espaciado:** Padding y margins ajustados proporcionalmente
- **Fuentes:** Uso de unidades relativas (`em`, `%`, `vw`, `vh`)
- **Transiciones:** Suaves en redimensionamiento
- **Z-index:** Mantenido para evitar overlapping en mobile

### ✅ Testing Realizado

**Dispositivos probados:**
- iPhone SE (375px)
- iPhone 12 Pro (390px)
- iPad (768px)
- Desktop (1920px)

**Aspectos verificados:**
- ✅ Navegación funcional en todos los tamaños
- ✅ Footer legible sin superposiciones
- ✅ Diseño infinito sin elementos cortados
- ✅ Texto manuscrito escalado correctamente
- ✅ Imágenes responsivas manteniendo aspecto

### 📦 Archivos Modificados/Creados

| Archivo | Tipo | Cambio |
|---------|------|--------|
| `Header.css` | CSS | Media queries + hamburger menu |
| `Header.jsx` | Component | Estado mobile menu |
| `Footer.css` | CSS | Layout vertical mobile |
| `infinito.css` | CSS | Posicionamiento vertical circles |
| `useResponsiveFontSize.js` | Hook | **NUEVO** - Cálculo responsive |
| `TextoManuscrito.jsx` | Component | Integración hook responsive |

---

**Proyecto:** Hurlingham PNO  
**Total Páginas:** 10  
**Páginas Complejas:** 2  
**APIs Utilizadas:** MockAPI (2 endpoints) + ImgBB  
**Responsive:** ✅ Completamente responsive (480px - 1920px+)
