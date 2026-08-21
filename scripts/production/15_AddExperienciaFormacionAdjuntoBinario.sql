-- =============================================================================
-- Migracion incremental: soporte de Experiencia/Formacion como binario (PDF)
-- =============================================================================
-- INSTRUCCIONES:
--   1. Conectarse directamente a la base de datos "PortalCV" en Azure SQL
--      (NO ejecutar desde master; Azure SQL no admite USE [database]).
--   2. Ejecutar este script completo como sqladmin o un usuario con permisos DDL.
--   3. Seguro de re-ejecutar: no agrega columnas si ya existen, no borra datos.
--
-- CONTEXTO: el soporte de una experiencia laboral (carta laboral/contrato) y de una
-- formacion (diploma/certificado) dejo de ser una URL pegada por el usuario y paso a
-- subirse como archivo PDF, guardado directamente en la fila (sin infraestructura de
-- almacenamiento externo, mismo enfoque que la foto de perfil de Personales).
-- AdjuntoSoporte (varchar) se conserva en ambas tablas para los adjuntos ya pegados
-- antes de este cambio (fallback de solo lectura); los adjuntos nuevos usan las
-- columnas *Bytes/*ContentType.
--
-- Para una base NUEVA, no ejecutar este script: 05_AzureSQL_CreateSchema.sql ya
-- incluye estas columnas. Este script es solo para aplicar el cambio incremental a
-- una base ya existente (creada antes de este cambio).
-- =============================================================================

SET NOCOUNT ON;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID(N'dbo.Experiencia') AND name = N'AdjuntoSoporteBytes'
)
BEGIN
    ALTER TABLE dbo.Experiencia ADD AdjuntoSoporteBytes VARBINARY(MAX) NULL;
    PRINT 'Columna dbo.Experiencia.AdjuntoSoporteBytes agregada.';
END
ELSE
BEGIN
    PRINT 'Columna dbo.Experiencia.AdjuntoSoporteBytes ya existe, no se realizaron cambios.';
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID(N'dbo.Experiencia') AND name = N'AdjuntoSoporteContentType'
)
BEGIN
    ALTER TABLE dbo.Experiencia ADD AdjuntoSoporteContentType VARCHAR(100) NULL;
    PRINT 'Columna dbo.Experiencia.AdjuntoSoporteContentType agregada.';
END
ELSE
BEGIN
    PRINT 'Columna dbo.Experiencia.AdjuntoSoporteContentType ya existe, no se realizaron cambios.';
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID(N'dbo.Formacion') AND name = N'AdjuntoSoporteBytes'
)
BEGIN
    ALTER TABLE dbo.Formacion ADD AdjuntoSoporteBytes VARBINARY(MAX) NULL;
    PRINT 'Columna dbo.Formacion.AdjuntoSoporteBytes agregada.';
END
ELSE
BEGIN
    PRINT 'Columna dbo.Formacion.AdjuntoSoporteBytes ya existe, no se realizaron cambios.';
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID(N'dbo.Formacion') AND name = N'AdjuntoSoporteContentType'
)
BEGIN
    ALTER TABLE dbo.Formacion ADD AdjuntoSoporteContentType VARCHAR(100) NULL;
    PRINT 'Columna dbo.Formacion.AdjuntoSoporteContentType agregada.';
END
ELSE
BEGIN
    PRINT 'Columna dbo.Formacion.AdjuntoSoporteContentType ya existe, no se realizaron cambios.';
END
GO
