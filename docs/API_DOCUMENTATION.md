# SmartInventory — Documentación de API y Seguridad

Sistema de gestión de inventario y bodega. Full Stack MEAN (MongoDB, Express, Angular, Node.js).

- Backend: `Proyecto_Backend/` — API REST con Express + Mongoose, desplegada en Render como *web service*.
- Frontend: `Proyecto_frontend/` — SPA en Angular 19, desplegada en Render como *static site*.
- Base de datos: MongoDB Atlas.

---

## 1. Arquitectura

```
Angular (SPA)  --HTTPS/JSON-->  Express API  --Mongoose-->  MongoDB Atlas
   |                                |
   guards + interceptor JWT         middleware verificarToken + verificarRol
```

**Capa de presentación (Angular):** login, shell de navegación con sidebar filtrado por rol, un módulo CRUD por colección, guards de ruta, interceptor HTTP que adjunta el JWT y maneja el refresh automático ante un `401`.

**Capa de lógica de negocio (Express):** autenticación, autorización por rol, validación de datos, y la lógica que mantiene sincronizadas las colecciones relacionadas (Producto → Inventario → Movimiento → Orden de Compra).

**Capa de datos (MongoDB/Mongoose):** 7 colecciones relacionadas mediante referencias (`ObjectId` + `ref`), con validadores de esquema (`required`, `enum`, `min`, `unique`, regex) como primera línea de defensa de integridad.

---

## 2. Autenticación

### 2.1 Flujo de login

1. `POST /api/auth/login` recibe `{ email, password }`.
2. Se busca el usuario por email; si no existe o su `estado` es `inactivo`, se rechaza.
3. Se compara el password contra el hash almacenado con `bcrypt.compareSync`.
4. Si es válido, se firman dos JWT:
   - **Access token** (`JWT_SECRET`, expira en 15 minutos): payload `{ uid, nombre, rol, proveedorId }`.
   - **Refresh token** (`REFRESH_SECRET`, expira en 7 días): payload `{ uid }`.
5. Ambos tokens se guardan también en el documento del usuario (`Token`, `refreshToken`) y se devuelven al cliente junto con el usuario (sin el hash del password).
6. El frontend guarda `accessToken`, `refreshToken` y el usuario en `localStorage` (`AuthService.saveSession`).

### 2.2 Renovación de sesión

Cuando el access token expira, cualquier request protegida responde `401`. El interceptor HTTP de Angular (`auth.interceptor.ts`) detecta ese `401`, llama a `POST /api/auth/refresh-token` con el refresh token guardado, y si es válido:
- obtiene un nuevo access token,
- reintenta automáticamente la petición original,
- si el refresh también falla, cierra la sesión y redirige a `/login`.

El backend valida el refresh token contra el que tiene almacenado el usuario (para poder invalidarlo en logout) y contra su firma/expiración.

### 2.3 Logout

`POST /api/auth/logout` (protegida) limpia el `refreshToken` almacenado en el usuario, invalidando la posibilidad de renovar la sesión.

### 2.4 Usuario administrador por defecto

Al arrancar, el backend espera a que la conexión a MongoDB esté lista y ejecuta `seedAdmin()` (`src/utils/seedAdmin.js`): si no existe ningún usuario con `rol: admin`, crea uno automáticamente:

```
email:    admin@smartinventory.com
password: Admin123*   (almacenado con bcrypt, nunca en texto plano)
rol:      admin
```

---

## 3. Roles y matriz de permisos

| Rol | Descripción |
|---|---|
| `admin` | Control total del sistema, incluida la administración de Usuarios. |
| `user` | "Encargado de Bodega". CRUD completo sobre las colecciones operativas, sin acceso al módulo de Usuarios. |
| `guest` | Solo lectura del catálogo de Productos, Categorías e Inventario. Sin escritura en ningún módulo. |
| `proveedor` | Portal propio: solo puede **consultar** (nunca escribir) las Órdenes de Compra que le fueron asignadas. Sin acceso a inventario general, otros proveedores, ni ninguna otra colección. |

La autorización se aplica en dos capas:
- **Frontend** (`RoleGuard` + ocultamiento condicional de botones): mejora la experiencia, evita que un usuario vea acciones que no puede ejecutar.
- **Backend** (`verificarToken` + `verificarRol(...roles)` en cada ruta): es la autorización real. El frontend nunca es la única barrera — cualquier endpoint puede probarse directamente y responde `401`/`403` según corresponda.

### Matriz de permisos por endpoint

| Colección | GET lista | GET por id | POST | PUT | DELETE |
|---|---|---|---|---|---|
| Usuarios | admin | admin | admin | admin | admin |
| Categorías | admin, user, guest | admin, user, guest | admin, user | admin, user | admin, user |
| Proveedores | admin, user | admin, user | admin, user | admin, user | admin, user |
| Productos | admin, user, guest | admin, user, guest | admin, user | admin, user | admin, user |
| Inventario | admin, user, guest | admin, user, guest | *(sin ruta — automático)* | admin, user (solo `ubicacion`) | *(sin ruta — cascada desde Producto)* |
| Movimientos | admin, user | admin, user | admin, user | admin, user | admin, user |
| Órdenes de Compra | admin, user (todas) · proveedor (solo las suyas) | admin, user (cualquiera) · proveedor (solo la suya, `403` si no le pertenece) | admin, user | admin, user | admin, user (bloqueado si `estado === 'recibida'`) |
| Dashboard (resumen) | admin, user | — | — | — | — |

---

## 4. Modelos de datos

Todas las colecciones usan `timestamps: true` (agregan `createdAt`/`updatedAt`).

### Usuario
| Campo | Tipo | Notas |
|---|---|---|
| nombre | String | requerido |
| email | String | requerido, único, minúsculas |
| password | String | requerido, hash bcrypt |
| rol | String enum | `admin` \| `user` \| `guest` \| `proveedor`, default `user` |
| estado | String enum | `activo` \| `inactivo`, default `activo` |
| proveedor | ObjectId → Proveedor | solo cuando `rol === 'proveedor'` |
| Token / refreshToken | String | último JWT emitido, para poder invalidarlo en logout |

### Producto
| Campo | Tipo | Notas |
|---|---|---|
| nombre | String | requerido |
| codigo | String | requerido, único, formato `AAA-1234` |
| descripcion | String | opcional |
| categoria | ObjectId → Categoria | requerido |
| proveedor | ObjectId → Proveedor | requerido |
| precio | Number | ≥ 0 |
| stock | Number | **stock mínimo / punto de reorden** — no es la cantidad real disponible (esa vive en Inventario) |

### Categoria
`nombre` (único), `descripcion`.

### Proveedor
`nombre`, `contacto`, `telefono`, `correo`, `direccion`.

### Inventario
| Campo | Tipo | Notas |
|---|---|---|
| producto | ObjectId → Producto | único — relación 1:1 |
| cantidadDisponible | Number | ≥ 0, cantidad real en bodega |
| ubicacion | String | default `"Bodega Principal"` |
| fechaActualizacion | Date | se actualiza en cada movimiento |

### Movimiento
| Campo | Tipo | Notas |
|---|---|---|
| producto | ObjectId → Producto | requerido |
| tipoMovimiento | String enum | `entrada` \| `salida` \| `ajuste` \| `devolucion` |
| cantidad | Number | para `ajuste` es el **valor absoluto nuevo**; para el resto, la cantidad a sumar/restar |
| usuario | ObjectId → Usuario | quien lo registró |
| fecha | Date | default ahora |

### OrdenCompra
| Campo | Tipo | Notas |
|---|---|---|
| proveedor | ObjectId → Proveedor | requerido |
| producto | ObjectId → Producto | requerido |
| cantidad | Number | ≥ 1 |
| fecha | Date | default ahora |
| estado | String enum | `pendiente` \| `aprobada` \| `recibida` \| `cancelada` |

---

## 5. Flujo de negocio entre colecciones

Este es el punto central del sistema: las colecciones no son CRUDs aislados, se afectan entre sí para simular un flujo real de bodega.

1. **Crear un Producto** → automáticamente se crea su registro de `Inventario` asociado (cantidad inicial opcional, default 0). Ambas escrituras ocurren en una transacción de MongoDB.
2. **Registrar un Movimiento** sobre un producto → actualiza `Inventario.cantidadDisponible`:
   - `entrada` / `devolucion`: suma la cantidad.
   - `salida`: resta la cantidad; se rechaza con `400` si dejaría el inventario en negativo.
   - `ajuste`: fija `cantidadDisponible` al valor absoluto indicado.
3. **Editar o eliminar un Movimiento** (`entrada`/`salida`/`devolucion`) revierte su efecto anterior antes de aplicar el nuevo (o simplemente lo revierte, en el caso de eliminar). Los movimientos de tipo `ajuste` no se pueden editar ni eliminar por no tener un delta reversible de forma segura — se corrige registrando un nuevo ajuste.
4. **Marcar una Orden de Compra como `recibida`** genera automáticamente un `Movimiento` tipo `entrada` por la misma cantidad, que a su vez incrementa el `Inventario`. La operación es idempotente: una orden ya `recibida` no puede volver a "recibirse".
5. **Eliminar un Producto** se bloquea (`409`) si tiene `Movimiento`s u `OrdenCompra`s asociadas; si no tiene historial, se elimina en cascada su registro de `Inventario`.
6. **Eliminar una Categoría o un Proveedor** se bloquea si algún `Producto` (o, en el caso de Proveedor, alguna `OrdenCompra`) los referencia.
7. **Eliminar una Orden de Compra** se bloquea si ya está `recibida` (su efecto sobre el inventario ya quedó registrado como un Movimiento independiente).

Toda esta lógica cruzada vive en `src/services/inventarioService.js` (helper `aplicarMovimiento`/`revertirMovimiento`, reutilizado por `movimientoController` y `ordenCompraController`) y se ejecuta dentro de transacciones de Mongoose (`session.withTransaction`) para que nunca queden las colecciones desincronizadas ante un error a mitad de camino.

---

## 6. Referencia de endpoints

Base URL local: `http://localhost:4000/api`. Todas las rutas salvo `POST /auth/login` y `POST /auth/refresh-token` requieren el header `Authorization: Bearer <accessToken>`.

### Auth
| Método | Ruta | Rol | Body |
|---|---|---|---|
| POST | `/auth/login` | público | `{ email, password }` |
| POST | `/auth/refresh-token` | público (requiere refresh token válido) | `{ refreshToken }` |
| POST | `/auth/logout` | cualquier rol autenticado | — |

### Usuarios (`/usuarios`) — admin
| Método | Ruta | Body |
|---|---|---|
| GET | `/usuarios` | — |
| GET | `/usuarios/:id` | — |
| POST | `/usuarios` | `{ nombre, email, password, rol, estado?, proveedor? }` |
| PUT | `/usuarios/:id` | igual, `password` opcional (solo si se quiere cambiar) |
| DELETE | `/usuarios/:id` | — |

### Categorías (`/categorias`) — lectura: admin/user/guest · escritura: admin/user
`GET /categorias`, `GET /categorias/:id`, `POST /categorias { nombre, descripcion? }`, `PUT /categorias/:id`, `DELETE /categorias/:id`.

### Proveedores (`/proveedores`) — admin/user
`GET /proveedores`, `GET /proveedores/:id`, `POST /proveedores { nombre, contacto?, telefono, correo, direccion? }`, `PUT /proveedores/:id`, `DELETE /proveedores/:id`.

### Productos (`/productos`) — lectura: admin/user/guest · escritura: admin/user
`GET /productos`, `GET /productos/:id`, `POST /productos { nombre, codigo, descripcion?, categoria, proveedor, precio, stock, cantidadInicial?, ubicacion? }`, `PUT /productos/:id`, `DELETE /productos/:id`.

### Inventario (`/inventario`) — lectura: admin/user/guest · edición: admin/user
`GET /inventario`, `GET /inventario/:id`, `PUT /inventario/:id { ubicacion }` (no permite editar `cantidadDisponible` directamente).

### Movimientos (`/movimientos`) — admin/user
`GET /movimientos`, `GET /movimientos/:id`, `POST /movimientos { producto, tipoMovimiento, cantidad, notas? }`, `PUT /movimientos/:id`, `DELETE /movimientos/:id`.

### Órdenes de Compra (`/ordenes-compra`) — admin/user (todo) · proveedor (solo lectura de las suyas)
`GET /ordenes-compra`, `GET /ordenes-compra/:id`, `POST /ordenes-compra { proveedor, producto, cantidad }`, `PUT /ordenes-compra/:id { estado }`, `DELETE /ordenes-compra/:id`.

### Dashboard (`/dashboard`) — admin/user
`GET /dashboard/resumen` → `{ totalProductos, totalProveedores, ordenesPendientes, alertasStockBajo[] }`.

Formato de respuesta consistente en toda la API: `{ ok: boolean, ...datos }` en éxito, `{ ok: false, mensaje, error? }` en error.

---

## 7. Seguridad implementada

### Backend
- **bcrypt** para el hash de contraseñas (nunca se almacenan ni se devuelven en texto plano; las respuestas de auth y de Usuarios excluyen explícitamente el campo `password`).
- **JWT firmado** con dos secretos distintos (`JWT_SECRET` para access token, `REFRESH_SECRET` para refresh token), ambos leídos desde variables de entorno.
- **Variables de entorno** (`.env`, no versionado) para `MONGO_URI`, `JWT_SECRET`, `REFRESH_SECRET`, `PORT`.
- **Conexión segura a MongoDB Atlas** vía `mongoose.connect` con el connection string de `.env`; el arranque del servidor espera (`await`) a que la conexión esté establecida antes de aceptar tráfico.
- **Middleware `verificarToken`**: exige y valida el JWT en cada ruta protegida.
- **Middleware `verificarRol(...roles)`**: autorización por rol, aplicado de forma independiente en cada ruta según la matriz de la sección 3.
- **Validación de datos** a nivel de esquema Mongoose (`required`, `enum`, `min`, `unique`, regex) y a nivel de controlador (reglas de negocio: estado de cuenta activo, integridad referencial, cantidades no negativas, idempotencia de "recibida").
- **Manejo de errores** consistente: cada controlador captura errores y responde con código HTTP apropiado (`400` validación, `401` no autenticado, `403` no autorizado, `404` no encontrado, `409` conflicto de integridad, `500` error de servidor) y un mensaje descriptivo, sin filtrar detalles internos sensibles.
- **CORS** configurable vía `CORS_ORIGIN` (abierto por defecto en desarrollo).

### Frontend
- **Route Guards**: `authGuard` bloquea todo el árbol de rutas protegidas si no hay sesión; `roleGuard` bloquea rutas específicas según el rol del usuario autenticado (leyendo `route.data['roles']`).
- **HTTP Interceptor**: adjunta automáticamente `Authorization: Bearer <token>` a cada request; ante un `401` intenta renovar la sesión con el refresh token antes de forzar el logout.
- **Token en `localStorage`**, nunca en la URL ni en query params.
- **Defensa en profundidad**: la UI oculta acciones no permitidas para el rol activo, pero esto es solo UX — la autorización real siempre se revalida en el backend.

---

## 8. Despliegue

- Backend: Render *Web Service* (Node.js), variables de entorno configuradas en el panel de Render (`MONGO_URI`, `JWT_SECRET`, `REFRESH_SECRET`, `PORT`).
- Frontend: Render *Static Site*, build de producción (`ng build`) con `environment.ts` apuntando a la URL pública del backend.
- Base de datos: MongoDB Atlas (cluster compartido entre el entorno local de desarrollo y el desplegado en Render).
