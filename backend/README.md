# Backend — PortalCV

API REST construida con **.NET 10** siguiendo **Arquitectura Limpia** (Clean Architecture). El backend está dividido en 4 proyectos dentro de la solución `PortalCV.Backend.sln`.

---

## Estructura de proyectos

```
backend/
└── PortalCV.Backend/
    ├── PortalCV.Backend.sln          ← Solución .NET
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

| Archivo | Qué representa |
|---------|----------------|
| `Usuario.cs` | Cuenta de usuario: email, hash de contraseña, estado (Activo/Inactivo) |
| `Rol.cs` | Roles del sistema (Visitante, Publicador, Admin) |
| `UsuarioRol.cs` | Tabla pivot que relaciona usuarios con roles (M:N) |
| `Curriculum.cs` | El CV en sí: URL pública, estado, contadores de visitas/contactos |
| `Personales.cs` | Datos personales del profesional (nombre, doc., contacto, residencia) |
| `Perfil.cs` | Descripciones del perfil profesional o aspiraciones |
| `Experiencia.cs` | Experiencia laboral (empresa, cargo, fechas) |
| `Formacion.cs` | Estudios académicos y capacitaciones |
| `Habilidad.cs` | Competencias con nivel y categoría |
| `Proyecto.cs` | Proyectos destacados con descripción y tecnologías |
| `Referencia.cs` | Referencias personales o laborales |
| `RedSocial.cs` | Perfiles en LinkedIn, GitHub, etc. |
| `FamiliarContacto.cs` | Contactos de emergencia o familiares |
| `VisibilidadSeccion.cs` | Controla qué secciones del CV son visibles públicamente |
| `VisitanteContacto.cs` | Registro de cada mensaje enviado por un reclutador |
| `AlertaVisita.cs` | Notificación generada al recibir una visita o contacto |
| `EstadisticasPublicas.cs` | Totales acumulados de visitas/contactos por CV |

---

## Proyecto 2: `PortalCV.Application`

Define los **contratos** (interfaces y DTOs) que el resto de las capas deben respetar. No tiene lógica ni acceso a base de datos.

### Interfaces (`Interfaces/`)

| Interfaz | Responsabilidad |
|----------|-----------------|
| `IAuthService` | Login y registro de usuarios |
| `IPublicCvService` | Operaciones públicas: buscar CVs, ver detalle, enviar contacto |
| `ICvEditorService` | Edición del CV por parte del publicador (todas las secciones) |
| `IAlertaService` | Consultar y marcar como leídas las alertas de visitas/contactos |
| `IRepository<T>` | Repositorio genérico: GetById, GetAll, Find, Add, Update, Remove |
| `ICurriculumRepository` | Repositorio especializado del CV: buscar por URL, por usuario, filtrar públicos |

### DTOs (`DTOs/`)

Los DTOs (Data Transfer Objects) son los **objetos que viajan entre capas** (respuestas y requests de la API).

| Carpeta | Contenido |
|---------|-----------|
| `Auth/AuthDtos.cs` | `LoginRequest`, `LoginResponse`, `RegisterRequest`, `RegisterResponse` |
| `Public/PublicDtos.cs` | Listado de CVs, detalle, estadísticas, filtros, formulario de contacto |
| `Curriculum/CurriculumDtos.cs` | DTOs para cada sección del editor: Personales, Perfil, Experiencia… |
| `Alertas/AlertasDtos.cs` | DTO de alerta de visita/contacto |

---

## Proyecto 3: `PortalCV.Infrastructure`

Implementación concreta de todas las interfaces. Aquí viven el **acceso a la base de datos**, los **servicios de negocio** y la configuración de **Entity Framework Core**.

### Acceso a datos (`Data/`)

| Archivo | Función |
|---------|---------|
| `PortalCvDbContext.cs` | DbContext principal de EF Core. Registra todos los `DbSet<T>` |
| `Configurations/*.cs` | Una clase por entidad que define el mapeo a SQL Server: nombre de tabla, columnas, PK, FK, índices, constraints |

> **Nota:** El proyecto **no usa migraciones** de EF Core. El esquema de base de datos se gestiona directamente con los scripts SQL en `scripts/`.

### Repositorios (`Repositories/`)

| Archivo | Función |
|---------|---------|
| `GenericRepository<T>.cs` | Implementación base reutilizable: GetByIdAsync, GetAllAsync, FindAsync, AddAsync, Update, Remove, SaveChangesAsync |
| `CurriculumRepository.cs` | Extiende el genérico con queries especializadas: cargar CV completo con todas sus secciones (eager loading), buscar por URL pública, paginación con filtros de ciudad/habilidad/palabra clave |

### Servicios (`Services/`)

| Archivo | Función |
|---------|---------|
| `AuthService.cs` | Login (BCrypt verify + JWT) y registro (BCrypt hash + crear Usuario, asignar rol Publicador, crear Curriculum vacío con URL pública) |
| `PublicCvService.cs` | Búsqueda paginada de CVs, obtener detalle (+ registrar visita), estadísticas, filtros disponibles, procesar formulario de contacto |
| `CvEditorService.cs` | CRUD completo de las 9 secciones del CV: Personales, Perfil, Experiencia, Formación, Habilidades, Proyectos, Referencias, Redes Sociales, Familiares/Contactos, Visibilidad |
| `AlertaService.cs` | Listar alertas (con opción de solo no leídas), marcar una leída, marcar todas leídas, contar no leídas |

### Configuración de DI (`DependencyInjection.cs`)

Punto único donde se registran **todos los servicios y repositorios** en el contenedor de inyección de dependencias de .NET. El `Program.cs` solo llama a `services.AddInfrastructure(configuration)`.

---

## Proyecto 4: `PortalCV.Api`

Capa de entrada HTTP. Expone los endpoints REST y gestiona la configuración del servidor.

### Controladores (`Controllers/`)

| Controlador | Ruta base | Acceso | Qué hace |
|-------------|-----------|--------|----------|
| `AuthController` | `/api/auth` | Público | Login, registro, me, forgot-password |
| `PublicController` | `/api/public` | Público | CVs públicos, búsqueda, detalle, estadísticas, filtros, contacto |
| `PersonalesController` | `/api/personales` | Publicador/Admin | CRUD de datos personales del CV |
| `PerfilController` | `/api/perfil` | Publicador/Admin | CRUD de perfiles profesionales |
| `ExperienciaController` | `/api/experiencia` | Publicador/Admin | CRUD de experiencia laboral |
| `FormacionController` | `/api/formacion` | Publicador/Admin | CRUD de formación académica |
| `HabilidadController` | `/api/habilidad` | Publicador/Admin | CRUD de habilidades |
| `ProyectoController` | `/api/proyecto` | Publicador/Admin | CRUD de proyectos |
| `ReferenciaController` | `/api/referencia` | Publicador/Admin | CRUD de referencias |
| `RedSocialController` | `/api/redsocial` | Publicador/Admin | CRUD de redes sociales |
| `FamiliarContactoController` | `/api/familiar` | Publicador/Admin | CRUD de contactos de emergencia |
| `VisibilidadController` | `/api/visibilidad` | Publicador/Admin | Control de visibilidad de secciones |
| `AlertasController` | `/api/alertas` | Publicador/Admin | Consultar y marcar alertas de visitas/contactos |
| `AdminController` | `/api/admin` | Solo Admin | Gestión de usuarios, roles y asignaciones |
| `CvControllerBase` | *(base)* | — | Clase base: extrae `UsuarioId` y `CurriculumId` del JWT |

### Contratos (`Contracts/Auth/`)

Modelos de entrada/salida específicos de la API (distintos a los DTOs internos):

- `LoginRequest` / `LoginResponse` — datos del formulario de login
- `RegisterRequest` — datos del formulario de registro
- `ForgotPasswordRequest` — email para recuperar contraseña

### Middleware (`Middleware/`)

| Archivo | Función |
|---------|---------|
| `GlobalExceptionMiddleware.cs` | Captura todas las excepciones no controladas y devuelve respuestas JSON coherentes: `404` para `KeyNotFoundException`, `403` para `UnauthorizedAccessException`, `500` para el resto |

### Configuración (`appsettings.json`)

```json
{
  "ConnectionStrings": {
    "DefaultConnection": ""       ← Cadena de conexión SQL Server (completar localmente)
  },
  "Jwt": {
    "Issuer": "PortalCV.Api",
    "Audience": "PortalCV.Client",
    "Key": ""                     ← Clave secreta JWT (mínimo 32 caracteres)
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
[GlobalExceptionMiddleware]   ← Captura errores antes de llegar al controlador
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
- El token incluye los claims: `sub` (UsuarioId), `email`, `role` (uno o varios), `curriculum_id`
- `CvControllerBase` lee `curriculum_id` del token para que cada controlador sepa qué CV editar sin que el frontend lo envíe
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
