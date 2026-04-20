# Backend — PortalCV

API REST construida con **.NET 10** siguiendo **Arquitectura Limpia** (Clean Architecture). El backend está dividido en 4 proyectos dentro de la solución `PortalCV.Backend.slnx`.

---

## Estructura de proyectos

```
backend/
└── PortalCV.Backend/
    ├── PortalCV.Backend.slnx         ← Solución .NET
    ├── PortalCV.Domain/              ← Capa 1: Entidades del negocio
    ├── PortalCV.Application/         ← Capa 2: Contratos e interfaces
    ├── PortalCV.Infrastructure/      ← Capa 3: Implementación (DB, servicios)
    └── PortalCV.Api/                 ← Capa 4: Controladores HTTP (API)
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
├── Auth/       ← identidad y control de acceso
├── Privada/    ← CV y toda la información del publicador
└── Publica/    ← entidades generadas desde la zona pública
```

| Subcarpeta | Archivo | Qué representa |
|------------|---------|----------------|
| `Auth/` | `Usuario.cs` | Cuenta de usuario: email, hash de contraseña, estado (Activo/Inactivo) |
| `Auth/` | `Rol.cs` | Roles del sistema (Visitante, Publicador, Admin) |
| `Auth/` | `UsuarioRol.cs` | Tabla pivot que relaciona usuarios con roles (M:N) |
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
| `Publica/` | `VisitanteContacto.cs` | Registro de cada mensaje enviado por un reclutador (origen: zona pública) |

> `Enums/` y `Exceptions/` están reservados para uso futuro.

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
| `Publica/` | `IPublicCvService` | Búsqueda pública de CVs, detalle, estadísticas, contacto |
| `Privada/` | `ICvEditorService` | Edición del CV por el publicador (todas las secciones) |
| `Privada/` | `ICurriculumRepository` | Queries especializadas: buscar por URL, por usuario, paginación con filtros |
| `Privada/` | `IRepository<T>` | Repositorio genérico: GetById, GetAll, Find, Add, Update, Remove |
| `Privada/` | `IAlertaService` | Consultar y marcar alertas de visitas/contactos |
| `Privada/` | `IDashboardService` | Estadísticas del dashboard del publicador |

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

---

## Proyecto 3: `PortalCV.Infrastructure`

Implementación concreta de todas las interfaces. Aquí viven el acceso a base de datos, los servicios de negocio y la configuración de Entity Framework Core.

### Acceso a datos (`Data/`)

| Archivo | Función |
|---------|---------|
| `PortalCvDbContext.cs` | DbContext principal de EF Core. Registra todos los `DbSet<T>` y aplica las configuraciones |
| `Configurations/*.cs` | Una clase por entidad. Define mapeo a SQL Server: tabla, columnas, PK, FK, índices y constraints |

> El proyecto **no usa migraciones** de EF Core. El DDL ejecutable está en **`scripts/manual/`** (local) y **`scripts/production/`** (Azure); ver `scripts/README_ProductionScripts.md` y `database/README.md`.

### Repositorios (`Repositories/`)

| Archivo | Función |
|---------|---------|
| `GenericRepository<T>.cs` | Implementación base: GetByIdAsync, GetAllAsync, FindAsync, AddAsync, Update, Remove, SaveChangesAsync |
| `CurriculumRepository.cs` | Extiende el genérico: cargar CV completo con eager loading, buscar por URL pública, paginación con filtros de ciudad/habilidad/palabra clave |

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
| `Privada/` | `CvEditorService.cs` | CRUD completo de las 10 secciones del CV: Personales, Perfil, Experiencia, Formación, Habilidades, Proyectos, Referencias, Redes Sociales, Familiares, Visibilidad |
| `Privada/` | `AlertaService.cs` | Listar alertas (paginado), marcar leída, marcar todas leídas, limpiar leídas, conteo no leídas; alineado con contactos cuando aplica |
| `Privada/` | `DashboardService.cs` | Estadísticas agregadas del publicador: visitas, contactos y métricas del CV |
| `Publica/` | `PublicCvService.cs` | Búsqueda paginada, detalle (+ registrar visita), estadísticas, filtros disponibles, formulario de contacto |

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
| `Admin/AdminController` | `/api/admin` | Solo Admin | Gestión de usuarios, roles y asignaciones |
| `Auth/AuthController` | `/api/auth` | Público | Login, registro, me, recuperar contraseña |
| `Publica/PublicController` | `/api/public` | Público | Buscar CVs, detalle, estadísticas, filtros, contactar |
| `Privada/CvControllerBase` | *(base)* | — | Clase base: extrae `UsuarioId` y `CurriculumId` del JWT |
| `Privada/PersonalesController` | `/api/cv/personales` | Publicador/Admin | GET y PUT de datos personales |
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

- **`Cors:AllowedOrigins`**: en **Production** debe incluir al menos la URL del SPA (p. ej. `https://tu-app.azurestaticapps.net`). Si el array está vacío y el entorno no es Development, la API **no arranca**. En Development, si está vacío se usan orígenes locales típicos (`localhost:4200`, `localhost:3000`). Variables: `Cors__AllowedOrigins__0`, `Cors__AllowedOrigins__1`, …
- **JWT / SQL**: mismas reglas que antes; clave JWT ≥ 32 caracteres.

> Los valores sensibles **nunca deben commitearse**. Usa `appsettings.Development.json` (ignorado por git) o variables de entorno. Ver `.env.example` en la raíz del repo.

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
[PortalCvDbContext]            ← EF Core → SQL Server
    │
    ▼
HTTP Response (DTO serializado como JSON)
```

---

## Autenticación (JWT)

- El token se devuelve en el login y debe enviarse en el header: `Authorization: Bearer <token>`
- Claims incluidos: `sub` (UsuarioId), `email`, `role` (uno o varios), `curriculum_id`
- `CvControllerBase` lee `curriculum_id` del token → cada controlador sabe qué CV editar sin que el frontend lo envíe explícitamente
- Roles: `Visitante` (sin login), `Publicador` (dueño del CV), `Admin` (gestor del sistema)

---

## Comandos útiles

```bash
# Compilar la solución
cd backend/PortalCV.Backend
dotnet build

# Ejecutar la API (requiere appsettings configurado)
cd PortalCV.Api
dotnet run

# Swagger UI disponible en:
# http://localhost:{puerto}/swagger
```
