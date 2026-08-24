-- =============================================================================
-- Migracion incremental: renombra la tabla ProveedorIaConfig a ProveedorIa.
-- Simplifica el nombre: el sufijo "Config" no aporta nada que el nombre de la
-- tabla no diga ya (una fila ES una conexion/config guardada con un proveedor de IA).
-- =============================================================================
-- INSTRUCCIONES:
--   1. Conectarse directamente a la base de datos "PortalCV" en Azure SQL
--      (NO ejecutar desde master; Azure SQL no admite USE [database]).
--   2. Ejecutar este script completo como sqladmin o un usuario con permisos DDL.
--   3. Seguro de re-ejecutar: verifica el estado actual antes de aplicar el cambio.
--
-- Requiere que ya se haya ejecutado 10_AddProveedorIaConfig.sql.
--
-- Cambios: renombra la tabla, su columna de PK, y todos sus constraints/indices.
-- Usa sp_rename (no DROP/CREATE) porque la tabla puede tener filas reales.
-- =============================================================================

IF OBJECT_ID(N'dbo.ProveedorIaConfig', N'U') IS NOT NULL AND OBJECT_ID(N'dbo.ProveedorIa', N'U') IS NULL
BEGIN
    EXEC sp_rename N'dbo.ProveedorIaConfig', N'ProveedorIa', N'OBJECT';
    EXEC sp_rename N'dbo.ProveedorIa.ProveedorIaConfigId', N'ProveedorIaId', N'COLUMN';

    EXEC sp_rename N'dbo.PK_ProveedorIaConfig', N'PK_ProveedorIa', N'OBJECT';
    EXEC sp_rename N'dbo.CK_ProveedorIaConfig_Proveedor', N'CK_ProveedorIa_Proveedor', N'OBJECT';
    EXEC sp_rename N'dbo.DF_ProveedorIaConfig_EsActivo', N'DF_ProveedorIa_EsActivo', N'OBJECT';
    EXEC sp_rename N'dbo.DF_ProveedorIaConfig_FechaCreacion', N'DF_ProveedorIa_FechaCreacion', N'OBJECT';
    EXEC sp_rename N'dbo.DF_ProveedorIaConfig_FechaActualizacion', N'DF_ProveedorIa_FechaActualizacion', N'OBJECT';
    EXEC sp_rename N'dbo.FK_ProveedorIaConfig_Curriculum', N'FK_ProveedorIa_Curriculum', N'OBJECT';

    EXEC sp_rename N'dbo.ProveedorIa.IX_ProveedorIaConfig_CurriculumId', N'IX_ProveedorIa_CurriculumId', N'INDEX';
    EXEC sp_rename N'dbo.ProveedorIa.UQ_ProveedorIaConfig_Curriculum_Activo', N'UQ_ProveedorIa_Curriculum_Activo', N'INDEX';

    PRINT 'Tabla ProveedorIaConfig renombrada a ProveedorIa (con constraints e indices).';
END
ELSE IF OBJECT_ID(N'dbo.ProveedorIa', N'U') IS NOT NULL
BEGIN
    PRINT 'La tabla dbo.ProveedorIa ya existe, no se realizan cambios.';
END
ELSE
BEGIN
    PRINT 'La tabla dbo.ProveedorIaConfig no existe -- nada que renombrar.';
END
GO
