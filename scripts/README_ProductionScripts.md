# Scripts SQL para Produccion

Se organizo el directorio en dos grupos:

- `production/`: scripts para despliegue real (Azure / entornos controlados).
- `manual/`: scripts de soporte, pruebas o uso local.

## Escenario: base nueva (produccion Azure)

Ejecutar solo:

- `production/05_AzureSQL_CreateSchema.sql` (esquema completo, tablas de export del snapshot estático `PublicCvSnapshotExport` / `PublicStaticSnapshotState`, y roles base al final del script)

## Escenario: base Azure ya existente (creada antes del export de snapshot)

Actualmente el esquema de snapshot ya está integrado en:

- `production/05_AzureSQL_CreateSchema.sql`

Para bases existentes, usar migración controlada del mismo esquema (sin re-ejecutar `05` completo con datos productivos).

## Scripts fuera de produccion (`manual/`)

Los exports ad-hoc de SSMS no se versionan aqui: el modelo de referencia son `manual/01_CreateSchema.sql` y `production/05_AzureSQL_CreateSchema.sql`.

- `manual/01_CreateSchema.sql`: bootstrap local con `USE [PortalCV]` (mismo esquema que producción, incluye export de snapshot estático).
- `manual/02_InsertTestData.sql`: datos de prueba (incluye roles si aplica).
- `manual/03_PublicQueries.sql`: consultas de ejemplo.
- `manual/04_PerformanceAndIndexes.sql`: benchmark y ajuste manual de indices.

## Operacion local (SQL Server instalado)

Ejecutar desde SSMS / Azure Data Studio / `sqlcmd` segun el flujo descrito en `database/README.md`:

- `manual/01_CreateSchema.sql` (bootstrap del esquema)
- `manual/02_InsertTestData.sql` (opcional: datos de prueba)
