# Scripts SQL para Produccion

Se organizo el directorio en dos grupos:

- `production/`: scripts para despliegue real (Azure / entornos controlados).
- `manual/`: scripts de soporte, pruebas o uso local.

## Escenario: base nueva (produccion Azure)

Ejecutar solo:

- `production/05_AzureSQL_CreateSchema.sql` (esquema completo y roles base al final del script).

## Escenario: base Azure ya existente con las tablas de snapshot sin uso

La Épica 6 "Resiliencia Cold Start (Snapshot JSON)" se implementó y luego se eliminó del código (2026-08-18, ver `docs/arquitectura/Backlog.md`). `05_AzureSQL_CreateSchema.sql` ya no crea `dbo.PublicCvSnapshotExport` / `dbo.PublicStaticSnapshotState`. Para eliminarlas de una base existente que las tenga, ejecutar:

- `production/13_DropSnapshotTables.sql`

## Escenario: agregar una tabla nueva a una base Azure ya existente

`05_AzureSQL_CreateSchema.sql` es un script de recreación completa (`DROP` + `CREATE`): **nunca** re-ejecutarlo contra una base con datos productivos. Para sumar una tabla nueva, se agrega un script incremental numerado en `production/` que solo crea lo nuevo (`IF OBJECT_ID(...) IS NULL CREATE TABLE ...`, seguro de re-ejecutar), y además se refleja la tabla en `05_AzureSQL_CreateSchema.sql` y `manual/01_CreateSchema.sql` para que sigan siendo la referencia completa del esquema.

- `production/06_AddAuditoriaAuth.sql`: agrega `dbo.AuditoriaAuth` (auditoría de login/logout). Precedente a seguir para futuras migraciones incrementales.
- `production/07_AddIpOrigenAuditoriaAuth.sql`: agrega la columna `IpOrigen` a `dbo.AuditoriaAuth` (IP del cliente, para detectar fuerza bruta en login fallido).
- `production/08_AddPromptIa.sql`: agrega `dbo.PromptIa` (prompts del asistente de IA, propios de cada CV y versionados; cada edición inserta una fila nueva en vez de sobrescribir).
- `production/09_AddOferta.sql`: agrega `dbo.Oferta` (historial de ofertas laborales analizadas por el postulante, flujo Oferta → Perfil → CV generado — ver `docs/arquitectura/Roadmap-Ofertas-IA.md`).
- `production/10_AddProveedorIaConfig.sql`: agrega `dbo.ProveedorIaConfig` (conexión con el proveedor de IA propia de cada CV — proveedor, modelo, clave de API cifrada). Requiere configurar `Encryption__Key` en el backend (ver el propio script).
- `production/13_DropSnapshotTables.sql`: elimina `dbo.PublicCvSnapshotExport` y `dbo.PublicStaticSnapshotState` (tablas de la Épica 6 de snapshot, retirada del código — ver `docs/arquitectura/Backlog.md`).
- `production/23_RenameProveedorIaConfigAProveedorIa.sql`: renombra `dbo.ProveedorIaConfig` a `dbo.ProveedorIa` (tabla, PK, constraints e índices) vía `sp_rename` — preserva las filas existentes.
- `production/24_AddOfertaAtributosDetallados.sql`: agrega a `dbo.Oferta` 8 columnas de texto libre (Modalidad, TipoContrato, Moneda, Duracion, Horario, ExperienciaRequerida, StackTecnologico, NivelIdioma) que `EXTRACTOR_OFERTA` extrae cuando están presentes en la oferta.
- `production/25_AddReferenciaMostrarEnCv.sql`: agrega la columna `MostrarEnCv` a `dbo.Referencia` (mismo patrón que Experiencia/Formacion/Proyecto/RedSocial) — reemplaza el interruptor global "Referencia laboral" que antes vivía en Configuración por un control por registro, editable en la vista de Experiencia.
- `production/26_AddPerfilVisibilidadPorPerfil.sql`: agrega las columnas `MostrarExperienciaPerfil` y `MostrarAspiracionSalarial` a `dbo.Perfil` — reemplaza los interruptores globales "Experiencia (perfil)"/"Salarios" que antes vivían en Configuración (afectaban a todos los perfiles por igual) por un control independiente por cada perfil, editable en la vista Perfil.

## Scripts fuera de produccion (`manual/`)

Los exports ad-hoc de SSMS no se versionan aqui: el modelo de referencia son `manual/01_CreateSchema.sql` y `production/05_AzureSQL_CreateSchema.sql`.

- `manual/01_CreateSchema.sql`: bootstrap local con `USE [PortalCV]` (mismo esquema que producción).
- `manual/02_InsertTestData.sql`: datos de prueba (incluye roles si aplica).
- `manual/03_PublicQueries.sql`: consultas de ejemplo.
- `manual/04_PerformanceAndIndexes.sql`: benchmark y ajuste manual de indices.

## Operacion local (SQL Server instalado)

Ejecutar desde SSMS / Azure Data Studio / `sqlcmd` segun el flujo descrito en `database/README.md`:

- `manual/01_CreateSchema.sql` (bootstrap del esquema)
- `manual/02_InsertTestData.sql` (opcional: datos de prueba)
