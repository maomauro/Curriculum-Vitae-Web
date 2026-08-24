-- =============================================================================
-- Migracion incremental: columnas MostrarExperienciaPerfil y
-- MostrarAspiracionSalarial en Perfil
-- =============================================================================
-- INSTRUCCIONES:
--   1. Conectarse directamente a la base de datos "PortalCV" en Azure SQL
--      (NO ejecutar desde master; Azure SQL no admite USE [database]).
--   2. Ejecutar este script completo como sqladmin o un usuario con permisos DDL.
--   3. Seguro de re-ejecutar: no agrega las columnas si ya existen, no borra datos.
--
-- Reemplaza el interruptor global (Configuracion -> Informacion Profesional ->
-- Perfil -> "Experiencia (perfil)"/"Salarios") por un control independiente POR
-- CADA perfil -- antes era una unica fila en VisibilidadSeccion que afectaba a
-- todos los perfiles del curriculum por igual.
--
-- Para una base NUEVA, no ejecutar este script: 05_AzureSQL_CreateSchema.sql ya
-- incluye estas columnas. Este script es solo para aplicar el cambio incremental a
-- una base ya existente (creada antes de este cambio), sin re-ejecutar el
-- schema completo con datos productivos.
-- =============================================================================

SET NOCOUNT ON;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID(N'dbo.Perfil') AND name = N'MostrarExperienciaPerfil'
)
BEGIN
    ALTER TABLE dbo.Perfil ADD MostrarExperienciaPerfil BIT NOT NULL CONSTRAINT DF_Perfil_MostrarExperienciaPerfil DEFAULT 1;
    PRINT 'Columna dbo.Perfil.MostrarExperienciaPerfil agregada.';
END
ELSE
BEGIN
    PRINT 'Columna dbo.Perfil.MostrarExperienciaPerfil ya existe, no se realizaron cambios.';
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID(N'dbo.Perfil') AND name = N'MostrarAspiracionSalarial'
)
BEGIN
    ALTER TABLE dbo.Perfil ADD MostrarAspiracionSalarial BIT NOT NULL CONSTRAINT DF_Perfil_MostrarAspiracionSalarial DEFAULT 1;
    PRINT 'Columna dbo.Perfil.MostrarAspiracionSalarial agregada.';
END
ELSE
BEGIN
    PRINT 'Columna dbo.Perfil.MostrarAspiracionSalarial ya existe, no se realizaron cambios.';
END
GO
