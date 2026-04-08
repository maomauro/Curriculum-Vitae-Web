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

| Archivo | Qué representa |
|---------|----------------|
| `Usuario.cs` | Cuenta de usuario: email, hash de contraseña, estado (Activo/Inactivo) |
| `Rol.cs` | Roles del sistema (Visitante, Publicador, Admin) |
| `UsuarioRol.cs` | Tabla pivot que relaciona usuarios con roles (M:N) |
| `Curriculum.cs` | El CV en sí: URL pública, estado, contadores de visitas/contactos |
| `Personales.cs` | Datos personales del profesional (nombre, doc., contacto, residencia) |
| `Perfil.cs` | Descripciones del perfil profesional o aspiraciones salariales |
| `Experiencia.cs` | Experiencia laboral (empresa, cargo, fechas, contrato) |
| `Formacion.cs` | Estudios académicos y capacitaciones |
| `Habilidad.cs` | Competencias técnicas/idiomas con nivel y categoría |
| `Proyecto.cs` | Proyectos destacados con descripción y stack tecnológico |
| `Referencia.cs` | Referencias personales o laborales |
| `RedSocial.cs` | Perfiles en LinkedIn, GitHub, etc. |
| `FamiliarContacto.cs` | Contactos de emergencia o familiares |
| `VisibilidadSeccion.cs` | Controla qué secciones del CV son visibles públicamente |
| `VisitanteContacto.cs` | Registro de cada mensaje enviado por un reclutador |
| `AlertaVisita.cs` | Notificación generada al recibir una visita o contacto |
| `EstadisticasPublicas.cs` | Totales acumulados de visitas/contactos por CV |

> `Enums/` y `Exceptions/` están reservados para uso futuro.

---

## Proyecto 2: `PortalCV.Application`

Define los **contratos** (interfaces y DTOs) que el resto de las capas deben respetar. No contiene lógica de negocio ni acceso a datos.

### Interfaces (`Interfaces/`)

Organizadas por dominio en subcarpetas que espejan los servicios de Infrastructure:

| Subcarpeta | Interfaz | Responsabilidad |
|------------|----------|-----------------|
| `Auth/` | `IAuthService` | Login y registro de usuarios |
| `Public/` | `IPublicCvService` | Búsqueda pública de CVs, detalle, estadísticas, contacto |
| `Cv/` | `ICvEditorService` | Edición del CV por el publicador (todas las secciones) |
| `Cv/` | `ICurriculumRepository` | Queries especializadas: buscar por URL, por usuario, paginación con filtros |
| `Cv/` | `IRepository<T>` | Repositorio genérico: GetById, GetAll, Find, Add, Update, Remove |
| `Alertas/` | `IAlertaService` | Consultar y marcar alertas de visitas/contactos |

### DTOs (`DTOs/`)

Objetos que viajan entre capas (requests y responses de la API). Cada dominio tiene su propia carpeta con un archivo por sección:

**`Auth/AuthDtos.cs`**
- `LoginRequest`, `LoginResponse`, `RegisterRequest`, `RegisterResponse`

**`Public/PublicDtos.cs`**
- `BuscarCvsQuery`, `CvListadoItemDto`, `CvListadoResponse`, `CvDetalleDto`, `CvEstadisticasDto`, `FiltrosPublicosDto`, `ContactarCvRequest`

**`Alertas/AlertasDtos.cs`**
- `AlertaVisitaDto`

**`Curriculum/`** — un archivo por sección del CV:

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

---

## Proyecto 3: `PortalCV.Infrastructure`

Implementación concreta de todas las interfaces. Aquí viven el acceso a base de datos, los servicios de negocio y la configuración de Entity Framework Core.

### Acceso a datos (`Data/`)

| Archivo | Función |
|---------|---------|
| `PortalCvDbContext.cs` | DbContext principal de EF Core. Registra todos los `DbSet<T>` y aplica las configuraciones |
| `Configurations/*.cs` | Una clase por entidad. Define mapeo a SQL Server: tabla, columnas, PK, FK, índices y constraints |

> El proyecto **no usa migraciones** de EF Core. El esquema se gestiona con los scripts SQL en `database/`.

### Repositorios (`Repositories/`)

| Archivo | Función |
|---------|---------|
| `GenericRepository<T>.cs` | Implementación base: GetByIdAsync, GetAllAsync, FindAsync, AddAsync, Update, Remove, SaveChangesAsync |
| `CurriculumRepository.cs` | Extiende el genérico: cargar CV completo con eager loading, buscar por URL pública, paginación con filtros de ciudad/habilidad/palabra clave |

### Servicios (`Services/`)

Organizados en subcarpetas que espejan las interfaces de `Application/Interfaces/`:

| Subcarpeta | Archivo | Función |
|------------|---------|---------|
| `Auth/` | `AuthService.cs` | Login (BCrypt + JWT) y registro (crear Usuario, asignar rol Publicador, generar Curriculum vacío con URL pública) |
| `Public/` | `PublicCvService.cs` | Búsqueda paginada, detalle (+ registrar visita), estadísticas, filtros disponibles, formulario de contacto |
| `Cv/` | `CvEditorService.cs` | CRUD completo de las 10 secciones del CV: Personales, Perfil, Experiencia, Formación, Habilidades, Proyectos, Referencias, Redes Sociales, Familiares, Visibilidad |
| `Alertas/` | `AlertaService.cs` | Listar alertas (con opción de solo no leídas), marcar una leída, marcar todas leídas, contar no leídas |

### Configuración de DI (`DependencyInjection.cs`)

Punto único de registro de todos los servicios y repositorios en el contenedor de .NET. `Program.cs` solo llama a `services.AddInfrastructure(configuration)`.

---

## Proyecto 4: `PortalCV.Api`

Capa de entrada HTTP. Expone los endpoints REST y gestiona la configuración del servidor.

### Controladores (`Controllers/`)

| Controlador | Ruta base | Acceso | Qué hace |
|-------------|-----------|--------|----------|
| `AuthController` | `/api/auth` | Público | Login, registro, me, recuperar contraseña |
| `PublicController` | `/api/public` | Público | Buscar CVs, detalle, estadísticas, filtros, contactar |
| `PersonalesController` | `/api/cv/personales` | Publicador/Admin | GET y PUT de datos personales |
| `PerfilController` | `/api/cv/perfiles` | Publicador/Admin | CRUD de perfiles profesionales |
| `ExperienciaController` | `/api/cv/experiencias` | Publicador/Admin | CRUD de experiencia laboral |
| `FormacionController` | `/api/cv/formaciones` | Publicador/Admin | CRUD de formación académica |
| `HabilidadController` | `/api/cv/habilidades` | Publicador/Admin | CRUD de habilidades |
| `ProyectoController` | `/api/cv/proyectos` | Publicador/Admin | CRUD de proyectos |
| `ReferenciaController` | `/api/cv/referencias` | Publicador/Admin | CRUD de referencias |
| `RedSocialController` | `/api/cv/redes-sociales` | Publicador/Admin | CRUD de redes sociales |
| `FamiliarContactoController` | `/api/cv/familiares` | Publicador/Admin | CRUD de contactos de emergencia |
| `VisibilidadController` | `/api/cv/visibilidad` | Publicador/Admin | GET y PUT de visibilidad de secciones |
| `AlertasController` | `/api/alertas` | Publicador/Admin | Consultar y marcar alertas |
| `AdminController` | `/api/admin` | Solo Admin | Gestión de usuarios, roles y asignaciones |
| `CvControllerBase` | *(base)* | — | Clase base: extrae `UsuarioId` y `CurriculumId` del JWT |

### Contratos (`Contracts/Auth/`)

Modelos de entrada/salida propios de la capa API (distintos a los DTOs de Application):

| Archivo | Contenido |
|---------|-----------|
| `LoginRequest.cs` | Email + contraseña para el formulario de login |
| `LoginResponse.cs` | Token JWT + datos básicos del usuario |
| `RegisterRequest.cs` | Datos del formulario de registro |
| `ForgotPasswordRequest.cs` | Email para recuperación de contraseña |

### Middleware (`Middleware/`)

| Archivo | Función |
|---------|---------|
| `GlobalExceptionMiddleware.cs` | Captura todas las excepciones no controladas y devuelve JSON coherente: `404` para `KeyNotFoundException`, `403` para `UnauthorizedAccessException`, `500` para el resto |

### Configuración (`appsettings.json`)

```json
{
  "ConnectionStrings": {
    "DefaultConnection": ""       // Cadena de conexión SQL Server (completar localmente)
  },
  "Jwt": {
    "Issuer": "PortalCV.Api",
    "Audience": "PortalCV.Client",
    "Key": ""                     // Clave secreta JWT (mínimo 32 caracteres)
  }
}
```

> Los valores sensibles **nunca deben commitearse**. Usa `appsettings.Development.json` (ignorado por git) o variables de entorno.

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
