-- =============================================================================
-- Migracion incremental: reemplaza "generar un CV nuevo con IA para la oferta"
-- (tabla CvGenerado) por "usar el CV ya construido del Perfil (CvGeneradoPerfil)
-- y enviarlo por correo al reclutador, con el CV adjunto en PDF".
-- =============================================================================
-- INSTRUCCIONES:
--   1. Conectarse directamente a la base de datos "PortalCV" en Azure SQL
--      (NO ejecutar desde master; Azure SQL no admite USE [database]).
--   2. Ejecutar este script completo como sqladmin o un usuario con permisos DDL.
--   3. Seguro de re-ejecutar: cada paso verifica el estado actual antes de
--      aplicar el cambio.
--
-- Requiere que ya se haya ejecutado 20_AddConfiguracionCorreo.sql.
--
-- Cambios:
--   - Oferta.FechaEnvioCorreo (nueva columna, NULL hasta que se envie el correo).
--   - CK_Oferta_Estado: el valor 'CvGenerado' se reemplaza por 'EnviadaPorCorreo'.
--     Las filas existentes con Estado='CvGenerado' se migran a 'PerfilAsignado'
--     (el contenido que tenian generado por IA en CvGenerado ya no se muestra en
--     ningun lado del sistema; si esa fila tiene valor real para el usuario,
--     respaldarla antes de correr este script con:
--       SELECT * INTO CvGenerado_backup_20260822 FROM dbo.CvGenerado;
--     ).
--   - Se elimina la tabla dbo.CvGenerado por completo (la funcionalidad que la
--     usaba fue retirada del backend).
-- =============================================================================

SET NOCOUNT ON;
GO

IF COL_LENGTH('dbo.Oferta', 'FechaEnvioCorreo') IS NULL
BEGIN
    ALTER TABLE dbo.Oferta ADD FechaEnvioCorreo DATETIME2(0) NULL;
    PRINT 'Columna Oferta.FechaEnvioCorreo agregada.';
END
ELSE
BEGIN
    PRINT 'Columna Oferta.FechaEnvioCorreo ya existe.';
END
GO

IF EXISTS (
    SELECT 1 FROM sys.check_constraints
    WHERE name = 'CK_Oferta_Estado' AND parent_object_id = OBJECT_ID('dbo.Oferta')
    AND definition LIKE '%CvGenerado%'
)
BEGIN
    UPDATE dbo.Oferta SET Estado = 'PerfilAsignado' WHERE Estado = 'CvGenerado';

    ALTER TABLE dbo.Oferta DROP CONSTRAINT CK_Oferta_Estado;
    ALTER TABLE dbo.Oferta ADD CONSTRAINT CK_Oferta_Estado
        CHECK (Estado IN (N'Analizada', N'PerfilAsignado', N'EnviadaPorCorreo'));

    PRINT 'Restriccion CK_Oferta_Estado actualizada (CvGenerado -> EnviadaPorCorreo); filas existentes migradas a PerfilAsignado.';
END
ELSE
BEGIN
    PRINT 'Restriccion CK_Oferta_Estado ya esta actualizada.';
END
GO

IF OBJECT_ID(N'dbo.CvGenerado', N'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.CvGenerado;
    PRINT 'Tabla dbo.CvGenerado eliminada.';
END
ELSE
BEGIN
    PRINT 'Tabla dbo.CvGenerado ya no existe.';
END
GO
