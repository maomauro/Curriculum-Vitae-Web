-- =============================================================================
-- Migracion incremental: columna MostrarEnCv en RedSocial
-- =============================================================================
-- INSTRUCCIONES:
--   1. Conectarse directamente a la base de datos "PortalCV" en Azure SQL
--      (NO ejecutar desde master; Azure SQL no admite USE [database]).
--   2. Ejecutar este script completo como sqladmin o un usuario con permisos DDL.
--   3. Seguro de re-ejecutar: no agrega la columna si ya existe, no borra datos.
--
-- Para una base NUEVA, no ejecutar este script: 05_AzureSQL_CreateSchema.sql ya
-- incluye esta columna. Este script es solo para aplicar el cambio incremental a
-- una base ya existente (creada antes de este cambio), sin re-ejecutar el
-- schema completo con datos productivos.
-- =============================================================================

SET NOCOUNT ON;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID(N'dbo.RedSocial') AND name = N'MostrarEnCv'
)
BEGIN
    ALTER TABLE dbo.RedSocial ADD MostrarEnCv BIT NOT NULL CONSTRAINT DF_RedSocial_MostrarEnCv DEFAULT 1;
    PRINT 'Columna dbo.RedSocial.MostrarEnCv agregada.';
END
ELSE
BEGIN
    PRINT 'Columna dbo.RedSocial.MostrarEnCv ya existe, no se realizaron cambios.';
END
GO
