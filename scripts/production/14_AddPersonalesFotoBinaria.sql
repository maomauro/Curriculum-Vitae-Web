-- =============================================================================
-- Migracion incremental: foto de perfil como binario en Personales
-- =============================================================================
-- INSTRUCCIONES:
--   1. Conectarse directamente a la base de datos "PortalCV" en Azure SQL
--      (NO ejecutar desde master; Azure SQL no admite USE [database]).
--   2. Ejecutar este script completo como sqladmin o un usuario con permisos DDL.
--   3. Seguro de re-ejecutar: no agrega columnas si ya existen, no borra datos.
--
-- CONTEXTO: la foto de perfil dejo de ser una URL pegada por el usuario y paso a
-- subirse como archivo, guardado directamente en la fila de Personales (sin
-- infraestructura de almacenamiento externo). dbo.Personales.FotoUrl se conserva
-- para las fotos ya pegadas antes de este cambio (fallback de solo lectura); las
-- fotos nuevas usan FotoBytes/FotoContentType.
--
-- Para una base NUEVA, no ejecutar este script: 05_AzureSQL_CreateSchema.sql ya
-- incluye estas columnas. Este script es solo para aplicar el cambio incremental a
-- una base ya existente (creada antes de este cambio).
-- =============================================================================

SET NOCOUNT ON;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID(N'dbo.Personales') AND name = N'FotoBytes'
)
BEGIN
    ALTER TABLE dbo.Personales ADD FotoBytes VARBINARY(MAX) NULL;
    PRINT 'Columna dbo.Personales.FotoBytes agregada.';
END
ELSE
BEGIN
    PRINT 'Columna dbo.Personales.FotoBytes ya existe, no se realizaron cambios.';
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID(N'dbo.Personales') AND name = N'FotoContentType'
)
BEGIN
    ALTER TABLE dbo.Personales ADD FotoContentType VARCHAR(100) NULL;
    PRINT 'Columna dbo.Personales.FotoContentType agregada.';
END
ELSE
BEGIN
    PRINT 'Columna dbo.Personales.FotoContentType ya existe, no se realizaron cambios.';
END
GO
