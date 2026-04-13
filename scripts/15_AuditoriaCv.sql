-- Tabla de auditoría de edición del CV (área privada / publicador). Append-only.
-- Ejecutar una vez contra la base existente si no usas el script completo 01 / 05.
-- FK del actor: ON DELETE NO ACTION (SQL Server no admite SET NULL + CASCADE al Curriculum en la misma fila).

IF OBJECT_ID(N'dbo.AuditoriaCv', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.AuditoriaCv (
        AuditoriaCvId    INT NOT NULL IDENTITY(1,1),
        FechaUtc         DATETIME2(0) NOT NULL CONSTRAINT DF_AuditoriaCv_FechaUtc DEFAULT (SYSUTCDATETIME()),
        ActorUsuarioId   INT NULL,
        CurriculumId     INT NOT NULL,
        Accion           NVARCHAR(80)  NOT NULL,
        EntidadTipo      NVARCHAR(40)  NOT NULL,
        EntidadId        INT NULL,
        DetalleJson      NVARCHAR(MAX) NULL,
        CONSTRAINT PK_AuditoriaCv PRIMARY KEY CLUSTERED (AuditoriaCvId),
        CONSTRAINT FK_AuditoriaCv_Usuario_Actor FOREIGN KEY (ActorUsuarioId)
            REFERENCES dbo.Usuario (UsuarioId) ON DELETE NO ACTION,
        CONSTRAINT FK_AuditoriaCv_Curriculum FOREIGN KEY (CurriculumId)
            REFERENCES dbo.Curriculum (CurriculumId) ON DELETE CASCADE
    );
    CREATE NONCLUSTERED INDEX IX_AuditoriaCv_CurriculumId ON dbo.AuditoriaCv (CurriculumId);
END
GO
