-- =============================================================================
-- Migracion incremental: tabla AuditoriaAuth (auditoria de login/logout)
-- =============================================================================
-- INSTRUCCIONES:
--   1. Conectarse directamente a la base de datos "PortalCV" en Azure SQL
--      (NO ejecutar desde master; Azure SQL no admite USE [database]).
--   2. Ejecutar este script completo como sqladmin o un usuario con permisos DDL.
--   3. Seguro de re-ejecutar: no crea la tabla si ya existe, no borra datos.
--
-- Para una base NUEVA, no ejecutar este script: 05_AzureSQL_CreateSchema.sql ya
-- incluye esta tabla. Este script es solo para aplicar el cambio incremental a
-- una base Azure ya existente (creada antes de este cambio), sin re-ejecutar el
-- schema completo con datos productivos.
-- =============================================================================

SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.AuditoriaAuth', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.AuditoriaAuth (
        AuditoriaAuthId  INT NOT NULL IDENTITY(1,1),
        FechaUtc         DATETIME2(0) NOT NULL CONSTRAINT DF_AuditoriaAuth_FechaUtc DEFAULT (SYSUTCDATETIME()),
        ActorUsuarioId   INT NULL,
        Accion           NVARCHAR(80)  NOT NULL,
        Email            NVARCHAR(256) NOT NULL,
        DetalleJson      NVARCHAR(MAX) NULL,
        CONSTRAINT PK_AuditoriaAuth PRIMARY KEY CLUSTERED (AuditoriaAuthId),
        CONSTRAINT FK_AuditoriaAuth_Usuario_Actor FOREIGN KEY (ActorUsuarioId)
            REFERENCES dbo.Usuario (UsuarioId) ON DELETE SET NULL
    );

    CREATE NONCLUSTERED INDEX IX_AuditoriaAuth_FechaUtc ON dbo.AuditoriaAuth (FechaUtc DESC);

    PRINT 'Tabla dbo.AuditoriaAuth creada.';
END
ELSE
BEGIN
    PRINT 'Tabla dbo.AuditoriaAuth ya existe, no se realizaron cambios.';
END
GO
