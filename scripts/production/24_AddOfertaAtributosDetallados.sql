-- =============================================================================
-- Migracion incremental: agrega atributos adicionales de texto libre a dbo.Oferta
-- (modalidad, tipo de contrato, moneda, duracion, horario, experiencia requerida,
-- stack tecnologico, nivel de idioma) -- el analisis por IA (EXTRACTOR_OFERTA) los
-- extrae cuando estan presentes en la oferta; todos son opcionales.
-- =============================================================================
-- INSTRUCCIONES:
--   1. Conectarse directamente a la base de datos "PortalCV" en Azure SQL
--      (NO ejecutar desde master; Azure SQL no admite USE [database]).
--   2. Ejecutar este script completo como sqladmin o un usuario con permisos DDL.
--   3. Seguro de re-ejecutar: cada columna se agrega solo si todavia no existe.
-- =============================================================================

IF COL_LENGTH('dbo.Oferta', 'Modalidad') IS NULL
    ALTER TABLE dbo.Oferta ADD Modalidad NVARCHAR(150) NULL;

IF COL_LENGTH('dbo.Oferta', 'TipoContrato') IS NULL
    ALTER TABLE dbo.Oferta ADD TipoContrato NVARCHAR(100) NULL;

IF COL_LENGTH('dbo.Oferta', 'Moneda') IS NULL
    ALTER TABLE dbo.Oferta ADD Moneda NVARCHAR(20) NULL;

IF COL_LENGTH('dbo.Oferta', 'Duracion') IS NULL
    ALTER TABLE dbo.Oferta ADD Duracion NVARCHAR(150) NULL;

IF COL_LENGTH('dbo.Oferta', 'Horario') IS NULL
    ALTER TABLE dbo.Oferta ADD Horario NVARCHAR(100) NULL;

IF COL_LENGTH('dbo.Oferta', 'ExperienciaRequerida') IS NULL
    ALTER TABLE dbo.Oferta ADD ExperienciaRequerida NVARCHAR(100) NULL;

IF COL_LENGTH('dbo.Oferta', 'StackTecnologico') IS NULL
    ALTER TABLE dbo.Oferta ADD StackTecnologico NVARCHAR(MAX) NULL;

IF COL_LENGTH('dbo.Oferta', 'NivelIdioma') IS NULL
    ALTER TABLE dbo.Oferta ADD NivelIdioma NVARCHAR(100) NULL;

PRINT 'Atributos detallados de dbo.Oferta verificados/agregados.';
GO
