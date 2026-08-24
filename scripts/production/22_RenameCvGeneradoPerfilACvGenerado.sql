-- =============================================================================
-- Migracion incremental: renombra la tabla CvGeneradoPerfil a CvGenerado.
-- El nombre "CvGenerado" quedo libre en 21_OfertaEnvioCorreo.sql (que eliminó la
-- vieja tabla CvGenerado del flujo de "generar CV nuevo por oferta", ya reemplazado
-- por "usar el CV ya construido del Perfil"). Con solo un tipo de CV generado en el
-- sistema, el sufijo "Perfil" ya no aporta nada -- se simplifica el nombre.
-- =============================================================================
-- INSTRUCCIONES:
--   1. Conectarse directamente a la base de datos "PortalCV" en Azure SQL
--      (NO ejecutar desde master; Azure SQL no admite USE [database]).
--   2. Ejecutar este script completo como sqladmin o un usuario con permisos DDL.
--   3. Seguro de re-ejecutar: verifica el estado actual antes de aplicar el cambio.
--
-- Requiere que ya se haya ejecutado 19_AddCvGeneradoPerfil.sql.
--
-- Cambios: renombra la tabla, su columna de PK, y todos sus constraints/indices.
-- Usa sp_rename (no DROP/CREATE) porque la tabla puede tener filas reales.
-- =============================================================================

IF OBJECT_ID(N'dbo.CvGeneradoPerfil', N'U') IS NOT NULL AND OBJECT_ID(N'dbo.CvGenerado', N'U') IS NULL
BEGIN
    EXEC sp_rename N'dbo.CvGeneradoPerfil', N'CvGenerado', N'OBJECT';
    EXEC sp_rename N'dbo.CvGenerado.CvGeneradoPerfilId', N'CvGeneradoId', N'COLUMN';

    EXEC sp_rename N'dbo.PK_CvGeneradoPerfil', N'PK_CvGenerado', N'OBJECT';
    EXEC sp_rename N'dbo.DF_CvGeneradoPerfil_PromptPorDefecto', N'DF_CvGenerado_PromptPorDefecto', N'OBJECT';
    EXEC sp_rename N'dbo.DF_CvGeneradoPerfil_FechaGeneracion', N'DF_CvGenerado_FechaGeneracion', N'OBJECT';
    EXEC sp_rename N'dbo.FK_CvGeneradoPerfil_Curriculum', N'FK_CvGenerado_Curriculum', N'OBJECT';
    EXEC sp_rename N'dbo.FK_CvGeneradoPerfil_Perfil', N'FK_CvGenerado_Perfil', N'OBJECT';

    EXEC sp_rename N'dbo.CvGenerado.IX_CvGeneradoPerfil_CurriculumId', N'IX_CvGenerado_CurriculumId', N'INDEX';
    EXEC sp_rename N'dbo.CvGenerado.UQ_CvGeneradoPerfil_PerfilId', N'UQ_CvGenerado_PerfilId', N'INDEX';

    PRINT 'Tabla CvGeneradoPerfil renombrada a CvGenerado (con constraints e indices).';
END
ELSE IF OBJECT_ID(N'dbo.CvGenerado', N'U') IS NOT NULL
BEGIN
    PRINT 'La tabla dbo.CvGenerado ya existe, no se realizan cambios.';
END
ELSE
BEGIN
    PRINT 'La tabla dbo.CvGeneradoPerfil no existe -- nada que renombrar.';
END
GO
