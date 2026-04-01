-- =============================================================================
-- Portal de Currículum Vitae - Roles base para Azure SQL Database
-- =============================================================================
-- INSTRUCCIONES:
--   Ejecutar después de 05_AzureSQL_CreateSchema.sql,
--   conectado directamente a la base de datos "PortalCV" en Azure SQL.
-- =============================================================================

SET NOCOUNT ON;
GO

IF NOT EXISTS (SELECT 1 FROM dbo.Rol WHERE RolId = 1)
BEGIN
    SET IDENTITY_INSERT dbo.Rol ON;
    INSERT INTO dbo.Rol (RolId, NombreRol, Descripcion) VALUES
        (1, N'Visitante',   N'Usuario no autenticado que consulta información pública'),
        (2, N'Publicador',  N'Profesional dueño de un CV'),
        (3, N'Admin',       N'Administrador del sistema');
    SET IDENTITY_INSERT dbo.Rol OFF;
END
GO

PRINT N'Script 06_AzureSQL_SeedRoles.sql ejecutado correctamente.';
GO
