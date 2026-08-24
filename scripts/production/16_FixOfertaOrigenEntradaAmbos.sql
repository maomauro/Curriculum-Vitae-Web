-- =============================================================================
-- Fix: CK_Oferta_OrigenEntrada no admitia 'ambos' (texto + imagen a la vez)
-- =============================================================================
-- INSTRUCCIONES:
--   1. Conectarse directamente a la base de datos "PortalCV" en Azure SQL
--      (NO ejecutar desde master; Azure SQL no admite USE [database]).
--   2. Ejecutar este script completo como sqladmin o un usuario con permisos DDL.
--   3. Seguro de re-ejecutar: si el constraint ya admite 'ambos', no hace nada.
--
-- Para una base NUEVA, no ejecutar este script: 05_AzureSQL_CreateSchema.sql ya
-- debe incluir el constraint corregido.
--
-- Motivo: la vista "Analizar Oferta" paso a aceptar texto e imagen a la vez como
-- entrada complementaria (no excluyente), y OrigenEntrada gano el valor 'ambos'
-- a nivel de aplicacion -- pero el CHECK constraint de la tabla se quedo con la
-- version anterior (solo 'texto'/'imagen'), asi que guardar una oferta con
-- OrigenEntrada='ambos' fallaba con un error de constraint en el INSERT/UPDATE.
-- =============================================================================

SET NOCOUNT ON;
GO

IF EXISTS (
    SELECT 1 FROM sys.check_constraints
    WHERE name = N'CK_Oferta_OrigenEntrada'
      AND definition NOT LIKE N'%ambos%'
)
BEGIN
    ALTER TABLE dbo.Oferta DROP CONSTRAINT CK_Oferta_OrigenEntrada;
    ALTER TABLE dbo.Oferta WITH CHECK ADD CONSTRAINT CK_Oferta_OrigenEntrada
        CHECK (OrigenEntrada IN (N'texto', N'imagen', N'ambos'));

    PRINT 'CK_Oferta_OrigenEntrada actualizado para admitir ''ambos''.';
END
ELSE
BEGIN
    PRINT 'CK_Oferta_OrigenEntrada ya admite ''ambos'', no se realizan cambios.';
END
GO
