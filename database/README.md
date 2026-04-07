# Base de datos - Portal de Currículum Vitae

Scripts y modelo de base de datos del portal. El modelo está alineado con `docs/Documentacion.md` y `docs/Modelo.md`.

## Archivos

| Archivo | Descripción |
|---|---|
| `01_CreateSchema.dbml` | Modelo de datos en [DBML](https://dbml.dbdiagram.io/) para visualizar en [dbdiagram.io](https://dbdiagram.io). Define todas las tablas, índices y relaciones. |
| `DiccionarioDeDatos.md` | Diccionario de datos con descripción y reglas de cada columna. |
| `Diagrama ER.jpeg` | Diagrama entidad-relación exportado. |

> ⚠️ **El script DDL ejecutable (`01_CreateSchema.sql`) está pendiente de generación** — corresponde a la historia técnica **HS-02** del Backlog.
> Hasta entonces, usa el DBML como referencia de la estructura.

## Cómo generar el SQL desde el DBML

1. Ve a [dbdiagram.io](https://dbdiagram.io) e importa `01_CreateSchema.dbml`.
2. Usa la opción **Export → SQL Server** para obtener el DDL ejecutable.
3. Guarda el resultado como `01_CreateSchema.sql` en esta carpeta.

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
- Para **Docker** (SQL Server en contenedor), usa la misma cadena de conexión que en `docs/Despliegue.md`.

## Ver también

- [docs/arquitectura/Documentacion.md](../docs/arquitectura/Documentacion.md) — visión del producto y modelo de datos
- [docs/arquitectura/Modelo.md](../docs/arquitectura/Modelo.md) — detalle de tablas y relaciones
- [docs/arquitectura/Backlog.md](../docs/arquitectura/Backlog.md) — épica 0 y tarea HS-02 (crear SQL DDL)
- [docs/arquitectura/Despliegue.md](../docs/arquitectura/Despliegue.md) — docker-compose y conexión a SQL Server
