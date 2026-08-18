# Scripts SQL para Produccion

Se organizo el directorio en dos grupos:

- `production/`: scripts para despliegue real (Azure / entornos controlados).
- `manual/`: scripts de soporte, pruebas o uso local.

## Escenario: base nueva (produccion Azure)

Ejecutar solo:

- `production/05_AzureSQL_CreateSchema.sql` (esquema completo y roles base al final del script). Incluye las tablas `PublicCvSnapshotExport` / `PublicStaticSnapshotState`, pero esa funcionalidad de snapshot está **retirada del código** (ver `docs/devops/Runbook-Azure.md` §7.1); las tablas se mantienen en el esquema sin uso, por si se retoma el enfoque más adelante.

## Escenario: base Azure ya existente (creada antes del export de snapshot)

Actualmente el esquema de snapshot ya está integrado en:

- `production/05_AzureSQL_CreateSchema.sql`

Para bases existentes, usar migración controlada del mismo esquema (sin re-ejecutar `05` completo con datos productivos).

## Escenario: agregar una tabla nueva a una base Azure ya existente

`05_AzureSQL_CreateSchema.sql` es un script de recreación completa (`DROP` + `CREATE`): **nunca** re-ejecutarlo contra una base con datos productivos. Para sumar una tabla nueva, se agrega un script incremental numerado en `production/` que solo crea lo nuevo (`IF OBJECT_ID(...) IS NULL CREATE TABLE ...`, seguro de re-ejecutar), y además se refleja la tabla en `05_AzureSQL_CreateSchema.sql` y `manual/01_CreateSchema.sql` para que sigan siendo la referencia completa del esquema.

- `production/06_AddAuditoriaAuth.sql`: agrega `dbo.AuditoriaAuth` (auditoría de login/logout). Precedente a seguir para futuras migraciones incrementales.
- `production/07_AddIpOrigenAuditoriaAuth.sql`: agrega la columna `IpOrigen` a `dbo.AuditoriaAuth` (IP del cliente, para detectar fuerza bruta en login fallido).

## Scripts fuera de produccion (`manual/`)

Los exports ad-hoc de SSMS no se versionan aqui: el modelo de referencia son `manual/01_CreateSchema.sql` y `production/05_AzureSQL_CreateSchema.sql`.

- `manual/01_CreateSchema.sql`: bootstrap local con `USE [PortalCV]` (mismo esquema que producción, incluye las tablas de snapshot sin uso — ver nota arriba).
- `manual/02_InsertTestData.sql`: datos de prueba (incluye roles si aplica).
- `manual/03_PublicQueries.sql`: consultas de ejemplo.
- `manual/04_PerformanceAndIndexes.sql`: benchmark y ajuste manual de indices.

## Operacion local (SQL Server instalado)

Ejecutar desde SSMS / Azure Data Studio / `sqlcmd` segun el flujo descrito en `database/README.md`:

- `manual/01_CreateSchema.sql` (bootstrap del esquema)
- `manual/02_InsertTestData.sql` (opcional: datos de prueba)
