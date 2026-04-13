-- Deduplicación de vistas públicas por visitante anónimo (UUID en query vid).
-- Ejecutar en bases ya creadas antes de este cambio.
SET NOCOUNT ON;
GO

IF COL_LENGTH(N'dbo.AlertaVisita', N'VisitanteAnonimoId') IS NULL
BEGIN
    ALTER TABLE dbo.AlertaVisita ADD VisitanteAnonimoId NVARCHAR(36) NULL;
END
GO

IF COL_LENGTH(N'dbo.AlertaVisita', N'VistasAcumuladas') IS NULL
BEGIN
    ALTER TABLE dbo.AlertaVisita ADD VistasAcumuladas INT NOT NULL
        CONSTRAINT DF_AlertaVisita_VistasAcumuladas DEFAULT 1;
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = N'UQ_AlertaVisita_Curriculum_Visitante_Vista'
      AND object_id = OBJECT_ID(N'dbo.AlertaVisita')
)
BEGIN
    CREATE UNIQUE NONCLUSTERED INDEX UQ_AlertaVisita_Curriculum_Visitante_Vista
        ON dbo.AlertaVisita (CurriculumId, VisitanteAnonimoId)
        WHERE TipoVisita = N'Vista' AND VisitanteAnonimoId IS NOT NULL;
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = N'UQ_AlertaVisita_Curriculum_Visitante_Descarga'
      AND object_id = OBJECT_ID(N'dbo.AlertaVisita')
)
BEGIN
    CREATE UNIQUE NONCLUSTERED INDEX UQ_AlertaVisita_Curriculum_Visitante_Descarga
        ON dbo.AlertaVisita (CurriculumId, VisitanteAnonimoId)
        WHERE TipoVisita = N'Descarga' AND VisitanteAnonimoId IS NOT NULL;
END
GO

IF OBJECT_ID(N'dbo.trg_AlertaVisita_SyncEstadisticas', N'TR') IS NOT NULL
    DROP TRIGGER dbo.trg_AlertaVisita_SyncEstadisticas;
GO

CREATE TRIGGER dbo.trg_AlertaVisita_SyncEstadisticas
ON dbo.AlertaVisita
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @Now DATETIME2(0) = SYSDATETIME();

    DECLARE @Curriculos TABLE (CurriculumId INT PRIMARY KEY);
    DECLARE @AlertCounts TABLE (
        CurriculumId INT PRIMARY KEY,
        VisitCount INT NOT NULL,
        LatestVisit DATETIME2(0) NULL
    );

    INSERT INTO @Curriculos (CurriculumId)
    SELECT DISTINCT CurriculumId FROM inserted
    UNION
    SELECT DISTINCT CurriculumId FROM deleted;

    INSERT INTO @AlertCounts (CurriculumId, VisitCount, LatestVisit)
    SELECT CurriculumId,
           SUM(
               CASE
                   WHEN TipoVisita IN (N'Vista', N'Descarga') THEN COALESCE(VistasAcumuladas, 1)
                   ELSE 1
               END
           ) AS VisitCount,
           MAX(FechaVisita) AS LatestVisit
    FROM dbo.AlertaVisita
    WHERE CurriculumId IN (SELECT CurriculumId FROM @Curriculos)
    GROUP BY CurriculumId;

    UPDATE c
    SET ContadorVisitas = ISNULL(ac.VisitCount, 0)
    FROM dbo.Curriculum c
    INNER JOIN @Curriculos ch ON c.CurriculumId = ch.CurriculumId
    LEFT JOIN @AlertCounts ac ON c.CurriculumId = ac.CurriculumId;

    UPDATE ep
    SET TotalVisitas = ISNULL(ac.VisitCount, 0),
        UltimaVisita = ac.LatestVisit,
        FechaActualizacion = @Now
    FROM dbo.EstadisticasPublicas ep
    INNER JOIN @Curriculos ch ON ep.CurriculumId = ch.CurriculumId
    LEFT JOIN @AlertCounts ac ON ep.CurriculumId = ac.CurriculumId;

    INSERT INTO dbo.EstadisticasPublicas (CurriculumId, TotalVisitas, TotalContactos, UltimaVisita, FechaActualizacion)
    SELECT ch.CurriculumId, ISNULL(ac.VisitCount, 0), 0, ac.LatestVisit, @Now
    FROM @Curriculos ch
    LEFT JOIN dbo.EstadisticasPublicas ep ON ep.CurriculumId = ch.CurriculumId
    LEFT JOIN @AlertCounts ac ON ac.CurriculumId = ch.CurriculumId
    WHERE ep.CurriculumId IS NULL;
END;
GO
