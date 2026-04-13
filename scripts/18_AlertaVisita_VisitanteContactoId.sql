-- Enlaza cada alerta tipo Contacto con la fila en VisitanteContacto que la originó.
-- Prerrequisito: VisitanteContacto.EsLeida (script 16_VisitanteContacto_add_EsLeida.sql) y columnas 17 si aplica.
-- Idempotente. Tras TRUNCATE de AlertaVisita, volver a ejecutar este script: el INSERT final recrea alertas por cada contacto sin fila enlazada.
IF COL_LENGTH(N'dbo.AlertaVisita', N'VisitanteContactoId') IS NULL
BEGIN
    ALTER TABLE dbo.AlertaVisita ADD VisitanteContactoId INT NULL;
END
GO

-- NO ACTION: SQL Server rechaza CASCADE aquí (ciclos / varias rutas CASCADE desde Curriculum hacia AlertaVisita).
IF NOT EXISTS (
    SELECT 1 FROM sys.foreign_keys
    WHERE name = N'FK_AlertaVisita_VisitanteContacto'
      AND parent_object_id = OBJECT_ID(N'dbo.AlertaVisita')
)
BEGIN
    ALTER TABLE dbo.AlertaVisita
        ADD CONSTRAINT FK_AlertaVisita_VisitanteContacto
            FOREIGN KEY (VisitanteContactoId) REFERENCES dbo.VisitanteContacto (VisitanteContactoId) ON DELETE NO ACTION;
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = N'UQ_AlertaVisita_VisitanteContacto_Contacto'
      AND object_id = OBJECT_ID(N'dbo.AlertaVisita')
)
BEGIN
    CREATE UNIQUE NONCLUSTERED INDEX UQ_AlertaVisita_VisitanteContacto_Contacto
        ON dbo.AlertaVisita (VisitanteContactoId)
        WHERE VisitanteContactoId IS NOT NULL AND TipoVisita = N'Contacto';
END
GO

-- Regenerar alertas de contacto para filas en VisitanteContacto sin alerta enlazada (p. ej. tras TRUNCATE AlertaVisita).
INSERT INTO dbo.AlertaVisita (
    CurriculumId, FechaVisita, Origen, TipoVisita, EsLeida, Titulo, Descripcion,
    Ciudad, Pais, VisitanteAnonimoId, VistasAcumuladas, VisitanteContactoId)
SELECT
    vc.CurriculumId,
    vc.FechaContacto,
    vc.ComoMeEncontraste,
    N'Contacto',
    CASE WHEN vc.EsLeida = 1 THEN 1 ELSE 0 END,
    N'Nuevo contacto de ' + ISNULL(NULLIF(LTRIM(RTRIM(vc.Nombre)), N''), vc.Correo),
    COALESCE(vc.Asunto, vc.MotivoContacto),
    NULL,
    NULL,
    NULL,
    1,
    vc.VisitanteContactoId
FROM dbo.VisitanteContacto vc
WHERE NOT EXISTS (
    SELECT 1 FROM dbo.AlertaVisita a
    WHERE a.VisitanteContactoId = vc.VisitanteContactoId
);
GO
