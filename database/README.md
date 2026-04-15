# Base de datos - Portal de Currículum Vitae

Scripts y modelo de base de datos del portal. El modelo se mantiene alineado con los scripts ejecutables de `scripts/manual/` y `scripts/production/`.

## Archivos

| Archivo | Descripción |
|---|---|
| `01_CreateSchema.dbml` | Modelo de datos en [DBML](https://dbml.dbdiagram.io/) para visualizar en [dbdiagram.io](https://dbdiagram.io). Define todas las tablas, índices y relaciones. |
| `DiccionarioDeDatos.md` | Diccionario de datos con descripción y reglas de cada columna. |
| `Diagrama ER.jpeg` | Diagrama entidad-relación exportado. |

> Los scripts DDL ejecutables están en [`scripts/manual/`](../scripts/manual/) (local) y [`scripts/production/`](../scripts/production/) (Azure). Esquema completo: `manual/01_CreateSchema.sql` y `production/05_AzureSQL_CreateSchema.sql` (este último incluye roles base al final). Datos de prueba local: `manual/02_InsertTestData.sql`.

## Cómo visualizar el modelo DBML

1. Ve a [dbdiagram.io](https://dbdiagram.io) e importa `01_CreateSchema.dbml`.
2. Usa la opción **Export → SQL Server** si necesitas regenerar el DDL desde el modelo.

> Los scripts ejecutables en [`scripts/`](../scripts/) son la fuente de verdad para la BD.

## Contenido del modelo (`01_CreateSchema.dbml`)

- **Tablas** (en orden de dependencias):
  - **Seguridad**: `Rol`, `Usuario`, `UsuarioRol`
  - **Curriculum**: `Curriculum`, `Personales`
  - **Contactos y redes**: `Referencia`, `FamiliarContacto`, `RedSocial`
  - **Profesional**: `Perfil`, `Experiencia`, `Formacion`, `Habilidad`, `Proyecto`
  - **Interacción**: `VisitanteContacto`, `AlertaVisita`, `VisibilidadSeccion`
  - **Estadísticas**: `EstadisticasPublicas`
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
- Para **Docker** (SQL Server en contenedor), usa la cadena definida en `.env` y aplicada por `docker-compose.yml`.

## Ver también

- [README.md](../README.md) — inicio rápido del proyecto
- [docs/devops/Checklist-Produccion.md](../docs/devops/Checklist-Produccion.md) — validaciones previas a producción
- [docs/produccion/Plan-Trabajo-Produccion.md](../docs/produccion/Plan-Trabajo-Produccion.md) — plan operativo de salida a producción
