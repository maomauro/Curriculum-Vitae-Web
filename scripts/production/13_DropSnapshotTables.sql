-- =============================================================================
-- Migracion incremental: eliminar tablas de snapshot estatico sin uso
-- =============================================================================
-- INSTRUCCIONES:
--   1. Conectarse directamente a la base de datos "PortalCV" en Azure SQL
--      (NO ejecutar desde master; Azure SQL no admite USE [database]).
--   2. Ejecutar este script completo como sqladmin o un usuario con permisos DDL.
--   3. Seguro de re-ejecutar: no falla si las tablas ya no existen.
--
-- CONTEXTO: dbo.PublicStaticSnapshotState y dbo.PublicCvSnapshotExport pertenecian
-- a la Epica 6 "Resiliencia Cold Start (Snapshot JSON)". Esa funcionalidad se
-- implemento y luego se elimino del codigo (2026-08-18): se opto por mantener la
-- base de produccion activa en vez de un fallback client-side. Las tablas quedaron
-- en el esquema sin ninguna referencia en el codigo C# (sin entidad, sin DbSet,
-- sin repositorio). Ver docs/arquitectura/Backlog.md (Epica 6).
--
-- Para una base NUEVA, no ejecutar este script: 05_AzureSQL_CreateSchema.sql ya
-- no crea estas tablas. Este script es solo para aplicar el cambio incremental a
-- una base ya existente (creada antes de este cambio).
-- =============================================================================

SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.PublicCvSnapshotExport', N'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.PublicCvSnapshotExport;
    PRINT 'Tabla dbo.PublicCvSnapshotExport eliminada.';
END
ELSE
BEGIN
    PRINT 'Tabla dbo.PublicCvSnapshotExport no existe, no se realizaron cambios.';
END
GO

IF OBJECT_ID(N'dbo.PublicStaticSnapshotState', N'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.PublicStaticSnapshotState;
    PRINT 'Tabla dbo.PublicStaticSnapshotState eliminada.';
END
ELSE
BEGIN
    PRINT 'Tabla dbo.PublicStaticSnapshotState no existe, no se realizaron cambios.';
END
GO
