# Base de datos - Portal de Currículum Vitae

Scripts SQL Server para crear y mantener la base de datos del proyecto. El modelo está alineado con `docs/Documentacion.md` y `docs/modelo.md`.

## Requisitos

- **SQL Server 2016 o superior** (o Azure SQL Database)
- Permisos para crear tablas en la base de datos (o para crear la base de datos si usas el bloque opcional)

## Cómo ejecutar

### Opción 1: Base de datos ya existe

1. En SSMS, Azure Data Studio o `sqlcmd`, conéctate al servidor y **selecciona o crea** la base de datos donde quieres el esquema (por ejemplo `PortalCV`).
2. Ejecuta el script completo:
   - **`01_CreateSchema.sql`** — crea todas las tablas, índices, FKs e inserta los roles iniciales.

### Opción 2: Crear la base de datos desde el script

1. Abre `01_CreateSchema.sql`.
2. **Descomenta** el bloque al inicio:
   ```sql
   IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = N'PortalCV')
   BEGIN
       CREATE DATABASE [PortalCV];
   END
   GO
   USE [PortalCV];
   GO
   ```
3. Ejecuta el script con un usuario con permiso para crear bases de datos.

## Contenido de `01_CreateSchema.sql`

- **Limpieza**: elimina todas las tablas del esquema en orden seguro (permite re-ejecutar el script).
- **Tablas** (en orden de dependencias):
  - **Seguridad**: `Rol`, `Usuario`, `UsuarioRol`
  - **Curriculum**: `Curriculum`, `Personales`
  - **Contactos y redes**: `Referencia`, `FamiliarContacto`, `RedSocial`
  - **Profesional**: `Perfil`, `Experiencia`, `Formacion`, `Habilidad`, `Proyecto`
  - **Interacción**: `VisitanteContacto`, `AlertaVisita`, `VisibilidadSeccion`
  - **Estadísticas**: `EstadisticasPublicas`
- **Índices** en columnas usadas en búsquedas y FKs.
- **Datos iniciales**: roles `Visitante`, `Publicador`, `Admin`.

## Notas

- La tabla **Referencia** agrupa referencias laborales y personales (`TipoReferencia`: `Laboral` | `Personal`). Si es laboral, `ExperienciaId` puede apuntar a la experiencia que avala.
- **EstadisticasPublicas** es una tabla de resumen; puede mantenerse sincronizada con `Curriculum` (ContadorVisitas, ContadorContactos) mediante trigger o job según necesites.
- Para **Docker** (SQL Server en contenedor), usa la misma cadena de conexión que en `docs/Despliegue.md` y ejecuta este script sobre la base de datos creada o la que indiques en `ConnectionStrings`.

## Ver también

- [docs/Documentacion.md](../docs/Documentacion.md) — visión del producto y modelo de datos
- [docs/modelo.md](../docs/modelo.md) — detalle de tablas y relaciones
- [docs/Backlog.md](../docs/Backlog.md) — épica 0 y script DDL (HS-02)
- [docs/Despliegue.md](../docs/Despliegue.md) — docker-compose y conexión a SQL Server
