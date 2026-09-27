# Base de datos - Portal de Currículum Vitae

Script y modelo de base de datos del portal (motor: **MariaDB**). Todo lo relacionado a la base de datos vive en esta única carpeta: el script ejecutable y su documentación/modelo.

## Archivos

| Archivo | Descripción |
|---|---|
| `01_CreateSchema.sql` | **Fuente de verdad para una base nueva.** Script DDL ejecutable: esquema completo (todas las tablas, índices, triggers y roles base al final). Lo monta `docker-compose.yml` (servicio `db`) como script de inicialización de MariaDB — corre solo la primera vez, con el volumen de datos vacío. |
| `migrations/` | Cambios incrementales de esquema para una base **ya existente** (dev con datos, o producción) — ver sección de abajo. El backend los aplica solo al arrancar. |
| `01_CreateSchema.dbml` | Modelo de datos en [DBML](https://dbml.dbdiagram.io/) para visualizar en [dbdiagram.io](https://dbdiagram.io). Define todas las tablas, índices y relaciones. |
| `DiccionarioDeDatos.md` | Diccionario de datos con descripción y reglas de cada columna. |
| `portalcv-er-diagram.html` | Diagrama entidad-relación interactivo (requiere zoom/pan para leerse cómodo — ver nota abajo). |

`01_CreateSchema.dbml` y `DiccionarioDeDatos.md` están pensados para reflejar el esquema, pero **pueden quedar desactualizados** respecto a `01_CreateSchema.sql` — tratá el script SQL como la fuente de verdad, no estos documentos, y verificá antes de confiar en cualquiera de los dos.

## Aplicar el script manualmente (fuera de docker-compose)

```bash
docker exec -i <contenedor_mariadb> mariadb -uroot -p"$PASSWORD" < database/01_CreateSchema.sql
```

## Agregar una tabla/columna nueva

No hay un sistema de migraciones de EF Core (ver `backend/README.md`) — en su lugar, este proyecto usa un runner propio y liviano:

1. Editar `01_CreateSchema.sql` (y `01_CreateSchema.dbml`/`DiccionarioDeDatos.md`) con el estado final del esquema — sigue siendo la fuente de verdad para una base creada desde cero.
2. Agregar un archivo nuevo en `migrations/`, numerado secuencialmente (`000N_descripcion_corta.sql`), con el `ALTER TABLE`/`CREATE TABLE` incremental. Escribirlo de forma **idempotente** (`ADD COLUMN IF NOT EXISTS`, `CREATE TABLE IF NOT EXISTS`, etc.) — una base nueva ya tiene el cambio vía `01_CreateSchema.sql`, así que la migración debe poder correr igual sin fallar.
3. No editar ni borrar migraciones ya commiteadas (aunque todavía no hayan llegado a producción) — si algo estaba mal, se corrige con una migración nueva.

El backend (`SchemaMigrationRunner`, `PortalCV.Infrastructure`) aplica automáticamente, al arrancar, cualquier migración de `migrations/` que no esté todavía registrada en la tabla `SchemaMigrations` de esa base — dev, y eventualmente producción, sin pasos manuales de por medio. Los `.sql` se compilan embebidos en el binario del backend (no se leen del disco en tiempo de ejecución), por eso `database/migrations/` es la única carpeta real: no hay una copia paralela dentro de `backend/`.

## Cómo visualizar el modelo DBML

1. Ve a [dbdiagram.io](https://dbdiagram.io) e importa `01_CreateSchema.dbml`.
2. Usa la opción **Export → MySQL** si necesitas regenerar el DDL desde el modelo (MariaDB es compatible con la sintaxis MySQL de dbdiagram.io).

## Contenido del modelo (`01_CreateSchema.dbml`)

- **Tablas** (en orden de dependencias):
  - **Seguridad**: `Rol`, `Usuario`, `UsuarioRol`
  - **Curriculum**: `Curriculum`, `Personales`
  - **Contactos y redes**: `Referencia`, `FamiliarContacto`, `RedSocial`
  - **Profesional**: `Perfil`, `CvGenerado`, `Oferta`, `Experiencia`, `Formacion`, `Habilidad`, `Proyecto`
  - **Interacción**: `VisitanteContacto`, `AlertaVisita`, `VisibilidadSeccion`
  - **Estadísticas**: `EstadisticasPublicas`
  - **Auditoría** (append-only): `AuditoriaAdmin`, `AuditoriaAuth`, `AuditoriaCv`
  - **IA (por CV)**: `PromptIa`
  - **IA (global de la plataforma)**: `ProveedorIa`
  - **Correo (por CV)**: `ConfiguracionCorreo`
- **Índices** en columnas usadas en búsquedas y FKs.
- **Datos iniciales previstos**: roles `Visitante`, `Publicador`, `Admin` (a insertar en el SQL).

## Notas

- La tabla **Referencia** agrupa referencias laborales y personales (`TipoReferencia`: `Laboral` | `Personal`). Si es laboral, `ExperienciaId` puede apuntar a la experiencia que avala.
- **EstadisticasPublicas** es una tabla de resumen; puede mantenerse sincronizada con `Curriculum` (ContadorVisitas, ContadorContactos) mediante trigger o job.
- **Personales** incluye `FotoUrl` para la foto de perfil. La visibilidad de correo y teléfono en el CV público se controla con **VisibilidadSeccion** (no columnas `Privacidad*` en el DDL actual).
- **Perfil** tiene `EsActivo` para habilitar/deshabilitar cada perfil profesional de forma individual.
- **Experiencia** tiene `EsActual` (checkbox «trabajo actual», deshabilita `FechaFin`) y `AdjuntoSoporte` para adjuntar soportes laborales.
- **Formacion** tiene `FechaVigencia` (expiración de certificados, distinto de `FechaFin`) y `DuracionHoras` (para cursos con `TipoFormacion='Curso'`).
- **Habilidad** incluye cuatro columnas CEFR cuando `Tipo='Idioma'`: `NivelLectura`, `NivelEscritura`, `NivelEscucha`, `NivelHabla` (valores `A1`–`C2` o `NULL`).
- **VisitanteContacto** tiene `Asunto` para el asunto del formulario de contacto público.
- **AlertaVisita** tiene `TipoVisita` con cuatro valores (`Vista` | `Contacto` | `Descarga` | `Sistema`), campos `EsLeida`, `Titulo`, `Descripcion`, `Ciudad` y `Pais`.
- **AuditoriaAdmin** / **AuditoriaAuth** / **AuditoriaCv** son tablas append-only (solo INSERT + purga manual desde el panel admin, nunca UPDATE). **AuditoriaAuth** incluye `IpOrigen` para detectar intentos de fuerza bruta en `login_fallido`.
- **PromptIa** es propia de cada CV (`CurriculumId`, `ON DELETE CASCADE`), igual que `Perfil`/`Experiencia`/`AuditoriaCv`, y también append-only en la práctica: editar un prompt inserta una fila nueva (mismo `CurriculumId`+`Codigo`, `Version+1`) y desactiva la anterior (`EsActivo=0`) en vez de sobrescribir columnas. `Contenido` se ensambla automáticamente desde `RolContexto`/`Tarea`/`Reglas`/`FormatoSalida`/`Ejemplos` y nunca se edita a mano. El backend cachea en memoria la versión activa por (`CurriculumId`, `Codigo`) y la invalida al crear o activar una versión (ver `backend/README.md`).
- **ProveedorIa** es **global de toda la plataforma** (sin `CurriculumId`), administrada solo por Admin — a lo sumo una fila con `EsActivo=1` en toda la base, no una por CV.
- **CvGenerado** es 1:1 con `Perfil` (`UNIQUE PerfilId`): contenido del CV condensado por IA para "Mi CV"; regenerar reemplaza `ContenidoJson` en vez de crear una fila nueva.
- **ConfiguracionCorreo** es 1:1 con `Curriculum` (`UNIQUE CurriculumId`): configuración SMTP para el flujo Analizar Oferta → Enviar correo.
- Para **MariaDB local**, define `ConnectionStrings:DefaultConnection` en `dotnet user-secrets` o `docker/backend.local.env` (no versionar secretos).

## Ver también

- [README.md](../README.md) — inicio rápido del proyecto
- [docs/devops/Checklist-Produccion.md](../docs/devops/Checklist-Produccion.md) — validaciones previas a producción
- [docs/produccion/Plan-Trabajo-Produccion.md](../docs/produccion/Plan-Trabajo-Produccion.md) — plan operativo de salida a producción
