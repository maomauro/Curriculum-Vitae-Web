-- Tabla de auditoría del panel de administración (append-only).
-- Ejecutar una vez contra la base existente (no forma parte del script destructivo 01_CreateSchema).

IF OBJECT_ID(N'dbo.AuditoriaAdmin', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.AuditoriaAdmin (
        AuditoriaAdminId INT NOT NULL IDENTITY(1,1),
        FechaUtc         DATETIME2(0) NOT NULL CONSTRAINT DF_AuditoriaAdmin_FechaUtc DEFAULT (SYSUTCDATETIME()),
        ActorUsuarioId   INT NULL,
        Accion           NVARCHAR(80)  NOT NULL,
        EntidadTipo      NVARCHAR(40)  NOT NULL,
        EntidadId        INT NULL,
        DetalleJson      NVARCHAR(MAX) NULL,
        CONSTRAINT PK_AuditoriaAdmin PRIMARY KEY CLUSTERED (AuditoriaAdminId),
        CONSTRAINT FK_AuditoriaAdmin_Usuario_Actor FOREIGN KEY (ActorUsuarioId)
            REFERENCES dbo.Usuario (UsuarioId) ON DELETE SET NULL
    );
    CREATE NONCLUSTERED INDEX IX_AuditoriaAdmin_FechaUtc ON dbo.AuditoriaAdmin (FechaUtc DESC);
END
GO
