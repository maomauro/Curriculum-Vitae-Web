# Backend — PortalCV

API REST construida con **.NET 10** siguiendo **Arquitectura Limpia** (Clean Architecture). El backend está dividido en 4 proyectos de producción + 1 proyecto de tests dentro de la solución `PortalCV.Backend.slnx`.

---

## Estructura de proyectos

```
backend/
└── PortalCV.Backend/
    ├── PortalCV.Backend.slnx         ← Solución .NET
    ├── PortalCV.Domain/              ← Capa 1: Entidades del negocio
    ├── PortalCV.Application/         ← Capa 2: Contratos e interfaces
    ├── PortalCV.Infrastructure/      ← Capa 3: Implementación (DB, servicios)
    ├── PortalCV.Api/                 ← Capa 4: Controladores HTTP (API)
    └── PortalCV.Api.Tests/           ← Tests de integración (xUnit + WebApplicationFactory + EF InMemory)
```

Las capas **solo pueden depender hacia adentro**:

```
Api  →  Infrastructure  →  Application  →  Domain
```

---

## Proyecto 1: `PortalCV.Domain`

Contiene las **entidades puras del negocio**, sin dependencias externas.

### Entidades (`Entities/`)

Organizadas siguiendo la misma distribución de zonas funcionales que los prototipos (`docs/diseño/prototipos/`). Todas las entidades comparten el namespace plano `PortalCV.Domain.Entities`.

```
Entities/
├── Auth/       ← identidad, control de acceso y auditoría de autenticación/administración
├── Privada/    ← CV y toda la información del publicador (incluida su auditoría de cambios)
└── Publica/    ← entidades generadas desde la zona pública
```

| Subcarpeta | Archivo | Qué representa |
|------------|---------|----------------|
| `Auth/` | `Usuario.cs` | Cuenta de usuario: email, hash de contraseña, estado (Activo/Inactivo) |
| `Auth/` | `Rol.cs` | Roles del sistema (Visitante, Publicador, Admin) |
| `Auth/` | `UsuarioRol.cs` | Tabla pivot que relaciona usuarios con roles (M:N) |
| `Auth/` | `AuditoriaAuth.cs` | Registro append-only de login exitoso/fallido y logout (incluye `IpOrigen`) |
| `Auth/` | `AuditoriaAdmin.cs` | Registro append-only de acciones del panel de administración |
| `Privada/` | `Curriculum.cs` | El CV en sí: URL pública, estado, contadores de visitas/contactos |
| `Privada/` | `Personales.cs` | Datos personales del profesional (nombre, doc., contacto, residencia) |
| `Privada/` | `Perfil.cs` | Descripciones del perfil profesional o aspiraciones salariales |
| `Privada/` | `Experiencia.cs` | Experiencia laboral (empresa, cargo, fechas, contrato) |
| `Privada/` | `Formacion.cs` | Estudios académicos y capacitaciones |
| `Privada/` | `Habilidad.cs` | Competencias técnicas/idiomas con nivel y categoría |
| `Privada/` | `Proyecto.cs` | Proyectos destacados con descripción y stack tecnológico |
| `Privada/` | `Referencia.cs` | Referencias personales o laborales |
| `Privada/` | `RedSocial.cs` | Perfiles en LinkedIn, GitHub, etc. |
| `Privada/` | `FamiliarContacto.cs` | Contactos de emergencia o familiares |
| `Privada/` | `VisibilidadSeccion.cs` | Controla qué secciones del CV son visibles públicamente |
| `Privada/` | `AlertaVisita.cs` | Notificación generada al recibir una visita o contacto |
| `Privada/` | `EstadisticasPublicas.cs` | Totales acumulados de visitas/contactos por CV |
| `Privada/` | `AuditoriaCv.cs` | Registro append-only de cambios sobre el CV desde el área privada |
| `Privada/` | `PromptIa.cs` | Prompt del asistente de IA, propio de un CV y versionado: cada edición inserta una fila nueva y desactiva la anterior |
| `Publica/` | `VisitanteContacto.cs` | Registro de cada mensaje enviado por un reclutador (origen: zona pública) |

> `Enums/` está reservado para uso futuro. `Exceptions/` ya tiene contenido real: `ForbiddenOperationException.cs`.

---

## Proyecto 2: `PortalCV.Application`

Define los **contratos** (interfaces y DTOs) que el resto de las capas deben respetar. No contiene lógica de negocio ni acceso a datos.

### Interfaces (`Interfaces/`)

Organizadas siguiendo la misma distribución de zonas funcionales que los prototipos (`docs/diseño/prototipos/`). Todos los archivos comparten el namespace plano `PortalCV.Application.Interfaces` independientemente de la subcarpeta física.

```
Interfaces/
├── Auth/       ← contratos de autenticación
├── Privada/    ← contratos del área privada (editor CV, repositorios, alertas, dashboard)
└── Publica/    ← contratos del área pública
```

| Subcarpeta | Interfaz | Responsabilidad |
|------------|----------|-----------------|
| `Auth/` | `IAuthService` | Login y registro de usuarios |
| `Auth/` | `IAuthAuditoriaService` | Registrar y listar eventos de auditoría de autenticación |
| `Publica/` | `IPublicCvService` | Búsqueda pública de CVs, detalle, estadísticas, contacto |
| `Publica/` | `IPublicCvVisitaRegistroService` | Registrar la visita a un CV público en un scope de DI independiente |
| `Privada/` | `ICvEditorService` | Edición del CV por el publicador (todas las secciones) |
| `Privada/` | `ICurriculumRepository` | Queries especializadas: buscar por URL, por usuario, paginación con filtros |
| `Privada/` | `IRepository<T>` | Repositorio genérico: GetById, GetAll, Find, Add, Update, Remove |
| `Privada/` | `IAlertaService` | Consultar y marcar alertas de visitas/contactos |
| `Privada/` | `IDashboardService` | Estadísticas del dashboard del publicador |
| `Privada/` | `IPromptIaRepository` | Acceso a datos de `PromptIa`, acotado al CV dueño; lee la versión activa con caché en memoria |
| `Privada/` | `IPromptIaService` | Valida, ensambla `Contenido` y versiona los prompts de IA del CV autenticado |
| *(raíz)* | `IAdminAuditoriaService` | Registrar, listar y purgar auditoría de administración |
| *(raíz)* | `ICvAuditoriaService` | Registrar, listar y purgar auditoría de cambios del CV |

### DTOs (`DTOs/`)

Objetos que viajan entre capas (requests y responses de la API). Las carpetas siguen la misma distribución de zonas funcionales que los prototipos de diseño (`docs/diseño/prototipos/`):

```
DTOs/
├── Admin/      ← panel de administración (usuarios, roles)
├── Auth/       ← autenticación (login, registro, recuperar contraseña)
├── Privada/    ← área privada del publicador (editor CV, dashboard, alertas, visibilidad)
└── Publica/    ← área pública sin login (búsqueda, detalle, estadísticas, contacto)
```

**`Admin/AdminDtos.cs`**
- `UsuarioAdminDto`, `RolDto`

**`Auth/AuthDtos.cs`**
- `LoginRequest`, `LoginResponse`, `RegisterRequest`, `RegisterResponse`

**`Publica/PublicDtos.cs`**
- `BuscarCvsQuery`, `CvListadoItemDto`, `CvListadoResponse`, `CvDetalleDto`, `CvEstadisticasDto`, `FiltrosPublicosDto`, `ContactarCvRequest`

**`Privada/`** — un archivo por sección del área privada:

| Archivo | DTOs que contiene |
|---------|-------------------|
| `PersonalesDtos.cs` | `PersonalesDto`, `UpsertPersonalesRequest` |
| `PerfilDtos.cs` | `PerfilDto`, `UpsertPerfilRequest` |
| `ExperienciaDtos.cs` | `ExperienciaDto`, `UpsertExperienciaRequest` |
| `FormacionDtos.cs` | `FormacionDto`, `UpsertFormacionRequest` |
| `HabilidadDtos.cs` | `HabilidadDto`, `UpsertHabilidadRequest` |
| `ProyectoDtos.cs` | `ProyectoDto`, `UpsertProyectoRequest` |
| `ReferenciaDtos.cs` | `ReferenciaDto`, `UpsertReferenciaRequest` |
| `RedSocialDtos.cs` | `RedSocialDto`, `UpsertRedSocialRequest` |
| `FamiliarContactoDtos.cs` | `FamiliarContactoDto`, `UpsertFamiliarContactoRequest` |
| `VisibilidadDtos.cs` | `VisibilidadSeccionDto`, `UpdateVisibilidadRequest` |
| `AlertasDtos.cs` | `AlertaVisitaDto` |
| `DashboardDtos.cs` | `DashboardStatsDto`, `ContactoDto`, `NotificacionItemDto`, `NotificacionesResumenDto` |
| `PromptIaDtos.cs` | `PromptIaListItemDto` (fila de la tabla: Código + versión activa), `PromptIaVersionDto` (una versión con su estructura completa), `CrearPromptIaRequest`, `CrearVersionPromptIaRequest` |

---

## Proyecto 3: `PortalCV.Infrastructure`

Implementación concreta de todas las interfaces. Aquí viven el acceso a base de datos, los servicios de negocio y la configuración de Entity Framework Core.

### Acceso a datos (`Data/`)

| Archivo | Función |
|---------|---------|
| `PortalCvDbContext.cs` | DbContext principal de EF Core. Registra todos los `DbSet<T>` y aplica las configuraciones |
| `Configurations/*.cs` | Una clase por entidad. Define mapeo a MariaDB: tabla, columnas, PK, FK, índices y constraints |

> El proyecto **no usa migraciones** de EF Core. El DDL ejecutable está en **`database/01_CreateSchema.sql`**; ver `database/README.md`.

> **Conector EF Core usado: `MySql.EntityFrameworkCore` (Oracle), no Pomelo.EntityFrameworkCore.MySql.**
> Pomelo es el más recomendado específicamente para MariaDB, pero al momento de escribir esto no
> tiene ninguna versión compatible con EF Core 10 (la última, 9.0.0, falla en runtime con
> `MissingMethodException` al resolver el primer `DbContext` — incompatibilidad binaria real con
> `Microsoft.EntityFrameworkCore.Abstractions` 10.x). El conector de Oracle sí publica versión
> `10.0.x` en paralelo a cada versión de EF Core y fue probado contra MariaDB real (no solo MySQL).
> Si Pomelo publica soporte para EF Core 10 más adelante, migrar es un cambio chico (mismo
> `DbContext`, mismo esquema) — vale la pena revisar entonces.

### Repositorios (`Repositories/`)

| Archivo | Función |
|---------|---------|
| `GenericRepository<T>.cs` | Implementación base: GetByIdAsync, GetAllAsync, FindAsync, AddAsync, Update, Remove, SaveChangesAsync |
| `CurriculumRepository.cs` | Extiende el genérico: cargar CV completo con eager loading, buscar por URL pública, paginación con filtros de ciudad/habilidad/palabra clave |
| `PromptIaRepository.cs` | Todo acotado a `CurriculumId`. Lee la versión activa por (Curriculum, Código) desde `IMemoryCache` (30 min); guardar una nueva versión o activar una anterior invalida la caché del (Curriculum, Código) afectado |

### Servicios (`Services/`)

Organizados siguiendo la misma distribución de zonas funcionales que los prototipos (`docs/diseño/prototipos/`). Todos los archivos comparten el namespace plano `PortalCV.Infrastructure.Services`.

```
Services/
├── Auth/     ← autenticación e identidad
├── Privada/  ← CV, alertas y dashboard del publicador
└── Publica/  ← CV público y contacto de visitantes
```

| Subcarpeta | Archivo | Función |
|------------|---------|---------|
| `Auth/` | `AuthService.cs` | Login (BCrypt + JWT) y registro (crear Usuario, asignar rol Publicador, generar Curriculum vacío con URL pública) |
| `Auth/` | `AuthAuditoriaService.cs` | Registra login exitoso/fallido y logout (con IP de origen), lista y purga `AuditoriaAuth` |
| `Privada/` | `CvEditorService.cs` | CRUD completo de las 10 secciones del CV: Personales, Perfil, Experiencia, Formación, Habilidades, Proyectos, Referencias, Redes Sociales, Familiares, Visibilidad |
| `Privada/` | `AlertaService.cs` | Listar alertas (paginado), marcar leída, marcar todas leídas, limpiar leídas, conteo no leídas; alineado con contactos cuando aplica |
| `Privada/` | `DashboardService.cs` | Estadísticas agregadas del publicador: visitas, contactos y métricas del CV |
| `Privada/` | `PromptIaService.cs` | Valida, ensambla `Contenido` (RolContexto+Tarea+Reglas+FormatoSalida+Ejemplos) y versiona los prompts de IA propios del CV; audita en `AuditoriaCv` |
| `Publica/` | `PublicCvService.cs` | Búsqueda paginada, detalle (+ registrar visita), estadísticas, filtros disponibles, formulario de contacto |
| `Publica/` | `PublicCvVisitaRegistroService.cs` | Registra la visita a un CV público en un scope de DI propio (usado por `PublicCvService`) |
| *(raíz)* | `AdminAuditoriaService.cs` | Registra, lista y purga `AuditoriaAdmin` |
| *(raíz)* | `CvAuditoriaService.cs` | Registra, lista y purga `AuditoriaCv` |

### Configuración de DI (`DependencyInjection.cs`)

Punto único de registro de todos los servicios y repositorios en el contenedor de .NET. `Program.cs` solo llama a `services.AddInfrastructure(configuration)`.

---

## Proyecto 4: `PortalCV.Api`

Capa de entrada HTTP. Expone los endpoints REST y gestiona la configuración del servidor.

### Controladores (`Controllers/`)

Organizados siguiendo la misma distribución de zonas funcionales que los prototipos (`docs/diseño/prototipos/`). Todos los archivos comparten el namespace plano `PortalCV.Api.Controllers`.

```
Controllers/
├── Admin/      ← gestión del sistema (solo rol Admin)
├── Auth/       ← autenticación y registro
├── Privada/    ← área privada del publicador (CV, alertas, dashboard, contactos, notificaciones)
└── Publica/    ← endpoints sin login
```

| Controlador | Ruta base | Acceso | Qué hace |
|-------------|-----------|--------|----------|
| `Admin/AdminController` | `/api/admin` | Solo Admin | Gestión de usuarios, roles y asignaciones; auditoría de administración/CV/autenticación (`/auditoria`, `/auditoria-cv`, `/auditoria-auth`, `/auditoria/purge`) |
| `Auth/AuthController` | `/api/auth` | Público | Login, registro, me, recuperar contraseña |
| `Publica/PublicController` | `/api/public` | Público | Buscar CVs, detalle, estadísticas, filtros, contactar, foto de perfil (`GET cvs/{urlPublica}/foto`) |
| `Privada/CvControllerBase` | *(base)* | — | Clase base: extrae `UsuarioId` y `CurriculumId` del JWT |
| `Privada/PersonalesController` | `/api/cv/personales` | Publicador/Admin | GET y PUT de datos personales; foto de perfil como binario (`PUT/DELETE/GET .../foto`, máx. 1 MB) |
| `Privada/PerfilController` | `/api/cv/perfiles` | Publicador/Admin | CRUD de perfiles profesionales |
| `Privada/ExperienciaController` | `/api/cv/experiencias` | Publicador/Admin | CRUD de experiencia laboral |
| `Privada/FormacionController` | `/api/cv/formaciones` | Publicador/Admin | CRUD de formación académica |
| `Privada/HabilidadController` | `/api/cv/habilidades` | Publicador/Admin | CRUD de habilidades |
| `Privada/ProyectoController` | `/api/cv/proyectos` | Publicador/Admin | CRUD de proyectos |
| `Privada/ReferenciaController` | `/api/cv/referencias` | Publicador/Admin | CRUD de referencias |
| `Privada/RedSocialController` | `/api/cv/redes-sociales` | Publicador/Admin | CRUD de redes sociales |
| `Privada/FamiliarContactoController` | `/api/cv/familiares` | Publicador/Admin | CRUD de contactos de emergencia |
| `Privada/VisibilidadController` | `/api/cv/visibilidad` | Publicador/Admin | GET y PUT de visibilidad de secciones |
| `Privada/AlertasController` | `/api/alertas` | Publicador/Admin | Consultar y marcar alertas |
| `Privada/DashboardController` | `/api/dashboard` | Publicador/Admin | Estadísticas del dashboard |
| `Privada/ContactosController` | `/api/contactos` | Publicador/Admin | Lista de contactos recibidos y marcar leído |
| `Privada/NotificacionesController` | `/api/notificaciones` | Publicador/Admin | Notificaciones recientes |
| `Privada/PromptsIaController` | `/api/prompts-ia` | Publicador/Admin | CRUD versionado de los prompts de IA propios del CV: listar (versión activa), historial por Código, crear Código nuevo, crear versión nueva, activar una versión anterior |
| `Privada/ProveedorIaController` | `/api/cv/proveedor-ia` | Publicador/Admin | CRUD de conexiones a proveedores de IA propias del CV (varias guardadas, una activa), activar una conexión, probar conexión (nueva o ya guardada) — la clave de API nunca se devuelve, ni cifrada ni en texto plano |

### Contratos (`Contracts/Auth/`)

Modelos de entrada/salida propios de la capa API (distintos a los DTOs de Application):

| Archivo | Contenido |
|---------|-----------|
| `LoginRequest.cs` | Email + contraseña para el formulario de login |
| `LoginResponse.cs` | Token JWT + datos básicos del usuario autenticado |
| `RegisterRequest.cs` | Datos necesarios para crear una cuenta nueva |
| `ForgotPasswordRequest.cs` | Email para iniciar el flujo de recuperación de contraseña |
| `RegisterRequest.cs` | Datos del formulario de registro |
| `ForgotPasswordRequest.cs` | Email para recuperación de contraseña |

### Middleware (`Middleware/`)

| Archivo | Función |
|---------|---------|
| `GlobalExceptionMiddleware.cs` | Captura todas las excepciones no controladas y devuelve JSON coherente: `404` para `KeyNotFoundException`, `403` para `UnauthorizedAccessException`, `500` para el resto |

### Configuración (`appsettings.json`)

```json
{
  "Cors": {
    "AllowedOrigins": []
  },
  "ConnectionStrings": {
    "DefaultConnection": ""
  },
  "Jwt": {
    "Issuer": "PortalCV.Api",
    "Audience": "PortalCV.Client",
    "Key": ""
  }
}
```

> `Serilog`/`Logging`/`AllowedHosts` también están en `appsettings.json` con la configuración estándar de logging; se omiten aquí por brevedad.

- **`Cors:AllowedOrigins`**: en **Production** debe incluir al menos la URL del SPA (p. ej. `https://tu-subdominio.tu-dominio.com`). Si el array está vacío y el entorno no es Development, la API **no arranca**. En Development, si está vacío se usan orígenes locales típicos (`localhost:4200`, `localhost:3000`). Variables: `Cors__AllowedOrigins__0`, `Cors__AllowedOrigins__1`, …
- **JWT / MariaDB**: mismas reglas que antes; clave JWT ≥ 32 caracteres.

### Secretos locales

`appsettings.json` y `launchSettings.json` **no contienen secretos** (solo valores públicos o cadenas vacías como placeholder). Los secretos se inyectan en runtime según cómo ejecutes la API:

| Forma de ejecución | Dónde viven los secretos | Archivo ignorado por git |
|---|---|---|
| **Docker local** (`docker run --env-file`) | `docker/backend.local.env` | Sí |
| **Nativo** (`dotnet run` / F5 en Visual Studio o Rider) | `dotnet user-secrets` (perfil del usuario del SO) | Sí (no está en el repo) |
| **CI / VPS de producción (Contabo)** | Variables de entorno del runtime | N/A |

Variables sensibles que debes configurar localmente:

- `ConnectionStrings:DefaultConnection` (cadena a MariaDB — `launchSettings.json` ya **no** trae un valor por defecto, así que sin esto el flujo nativo no puede conectar a la base)
- `Jwt:Key` (mínimo 32 caracteres)
- `Encryption:Key` (clave AES-256 de 32 bytes en base64 — cifra la clave de API de cada conexión en `ProveedorIa`, ver `AesGcmApiKeyCipher`). Sin ella, cualquier endpoint de `api/cv/proveedor-ia` responde 500 al construir el servicio.

Para el flujo nativo, inicializa `user-secrets` una sola vez. **Importante:** `dotnet user-secrets set` guarda en un JSON plano, así que la jerarquía va con **dos puntos** (`Seccion:Clave`) — la sintaxis con doble guion bajo (`Seccion__Clave`) es solo para variables de entorno (Docker, `launchSettings.json`, CI/VPS) y `dotnet user-secrets` la guarda tal cual, literal, sin traducirla, así que no la reconoce como configuración:

```bash
cd backend/PortalCV.Backend/PortalCV.Api
dotnet user-secrets init
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "server=localhost;port=3306;database=portalcv;user=portalcv_app;password=TU_PASSWORD;"
dotnet user-secrets set "Jwt:Key" "TU_CLAVE_DE_AL_MENOS_32_CARACTERES"
dotnet user-secrets set "Encryption:Key" "TU_CLAVE_AES256_DE_32_BYTES_EN_BASE64"
```

Para generar una clave AES-256 válida (32 bytes en base64) — `openssl rand -base64 32`, o en PowerShell:

```powershell
$b = New-Object byte[] 32; [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b); [Convert]::ToBase64String($b)
```

Para el flujo Docker, copia la plantilla y completa valores reales:

```bash
Copy-Item docker/backend.local.env.mariadb.example docker/backend.local.env
```

> Los valores sensibles **nunca** deben commitearse en `launchSettings.json`, `appsettings.*.json` ni en código fuente.

---

## Flujo de una petición

```
HTTP Request
    │
    ▼
[GlobalExceptionMiddleware]   ← Captura errores no controlados
    │
    ▼
[Controller]                  ← Valida la petición, lee claims del JWT
    │
    ▼
[IServicio / IRepositorio]    ← Interfaz definida en Application
    │
    ▼
[Servicio / Repositorio]      ← Implementación en Infrastructure
    │
    ▼
[PortalCvDbContext]            ← EF Core → MariaDB
    │
    ▼
HTTP Response (DTO serializado como JSON)
```

---

## Autenticación (JWT)

- El JWT **no viaja en el body** de `/api/auth/login` ni se guarda en `localStorage`: `AuthController` lo deja en una cookie `HttpOnly` (`portalcv_auth`) para que no sea accesible desde JavaScript en el cliente (mitiga robo de sesión vía XSS).
  - Producción: `Secure=true`, `SameSite=None` (el SPA en Static Web Apps y la API en Container Apps son dominios distintos → cookie cross-site).
  - Development: `Secure=false`, `SameSite=Lax` (ng serve sirve `/api` vía proxy, mismo origen aparente).
- El pipeline de `JwtBearer` (`Program.cs`) acepta el token desde el header `Authorization: Bearer <token>` **o** desde la cookie `portalcv_auth` si no hay header; los clientes que no son el SPA (Postman, scripts) pueden seguir usando el header.
- `POST /api/auth/logout` borra la cookie (`AllowAnonymous`: debe funcionar incluso con el token ya vencido).
- `GET /api/auth/me` devuelve `UsuarioId`, `Email`, `NombreCompleto`, `Roles` y `CurriculumId` leyendo los claims del JWT; el frontend lo usa para restaurar la sesión al recargar la página, ya que no puede decodificar la cookie.
- Claims incluidos en el JWT: `sub` (UsuarioId), `email`, `nombre`, `role` (uno o varios), `curriculum_id`
- `CvControllerBase` lee `curriculum_id` del token → cada controlador sabe qué CV editar sin que el frontend lo envíe explícitamente
- Roles: `Visitante` (sin login), `Publicador` (dueño del CV), `Admin` (gestor del sistema)

---

## Tests (`PortalCV.Api.Tests`)

Proyecto **xUnit** con tests de integración que arrancan el host de la API en memoria usando `WebApplicationFactory<Program>` y sustituyen MariaDB por **EF Core InMemory** (sin dependencia de base de datos real).

Cobertura actual:

| Archivo | Qué valida |
|---|---|
| `PublicEndpointsTests.cs` | Endpoints públicos (`/api/public/cvs`, `/filters`, detalle 404) responden sin JWT |
| `AuthEndpointsTests.cs` | Login/logout, registro de auditoría de autenticación (incluye IP de origen), endpoints protegidos devuelven 401 sin token; forgot-password responde genérico |
| `CvEditorEndpointsTests.cs` | Edición del CV por el publicador y registro de auditoría de cambios |
| `AdminAuditoriaAuthEndpointsTests.cs` | Endpoints admin de auditoría de autenticación: listado, control de acceso por rol, validaciones de purga |
| `TestWebApplicationFactory.cs` | Fixture compartida: aísla el provider interno de EF para evitar choque MySQL/InMemory |

Ejecutar en local:

```bash
dotnet test backend/PortalCV.Backend/PortalCV.Api.Tests/PortalCV.Api.Tests.csproj --configuration Release
```

En CI (`ci.yml`, job `backend`) se ejecuta tras el build y publica los resultados `.trx` como artifact `backend-test-results`.

---

## Comandos útiles

```bash
# Compilar la solución
cd backend/PortalCV.Backend
dotnet build

# Ejecutar la API (requiere appsettings configurado)
cd PortalCV.Api
dotnet run

# Ejecutar tests
dotnet test backend/PortalCV.Backend/PortalCV.Api.Tests/PortalCV.Api.Tests.csproj

# Swagger UI disponible en:
# http://localhost:{puerto}/swagger
```
