# Base de datos - Portal de Currículum Vitae

Scripts y modelo de base de datos del portal. El modelo está alineado con `docs/arquitectura/Documentacion.md` y `docs/arquitectura/Modelo.md`.

## Archivos

| Archivo | Descripción |
|---|---|
| `01_CreateSchema.dbml` | Modelo de datos en [DBML](https://dbml.dbdiagram.io/) para visualizar en [dbdiagram.io](https://dbdiagram.io). Define todas las tablas, índices y relaciones. |
| `DiccionarioDeDatos.md` | Diccionario de datos con descripción y reglas de cada columna. |
| `Diagrama ER.jpeg` | Diagrama entidad-relación exportado. |

> Los scripts DDL ejecutables están en la carpeta [`scripts/`](../scripts/) del repositorio:
> esquema base (`01`, `02`, `05`, `06`, …) y **migraciones incrementales** numeradas (`16_`, `17_`, …) según el estado del servidor.

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
- **Personales** incluye `FotoUrl` para la foto de perfil y campos de privacidad de contacto: `PrivacidadEmail` (`Publico` | `SoloFormulario` | `Oculto`) y `PrivacidadTelefono` (`Publico` | `Parcial` | `Oculto`).
- **Perfil** tiene `EsActivo` para habilitar/deshabilitar cada perfil profesional de forma individual.
- **Experiencia** tiene `EsActual` (checkbox «trabajo actual», deshabilita `FechaFin`) y `AdjuntoSoporte` para adjuntar soportes laborales.
- **Formacion** tiene `FechaVigencia` (expiración de certificados, distinto de `FechaFin`) y `DuracionHoras` (para cursos con `TipoFormacion='Curso'`).
- **Habilidad** incluye cuatro columnas CEFR cuando `Tipo='Idioma'`: `NivelLectura`, `NivelEscritura`, `NivelEscucha`, `NivelHabla` (valores `A1`–`C2` o `NULL`).
- **VisitanteContacto** tiene `Asunto` para el asunto del formulario de contacto público.
- **AlertaVisita** tiene `TipoVisita` con cuatro valores (`Vista` | `Contacto` | `Descarga` | `Sistema`), campos `EsLeida`, `Titulo`, `Descripcion`, `Ciudad` y `Pais`.
- Para **Docker** (SQL Server en contenedor), usa la misma cadena de conexión que en `docs/devops/Despliegue.md`.

## Ver también

- [docs/arquitectura/Documentacion.md](../docs/arquitectura/Documentacion.md) — visión del producto y modelo de datos
- [docs/arquitectura/Modelo.md](../docs/arquitectura/Modelo.md) — detalle de tablas y relaciones
- [docs/arquitectura/Backlog.md](../docs/arquitectura/Backlog.md) — épica 0 y tarea HS-02 (crear SQL DDL)
- [docs/devops/Despliegue.md](../docs/devops/Despliegue.md) — docker-compose y conexión a SQL Server
