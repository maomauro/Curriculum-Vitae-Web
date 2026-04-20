-- =============================================================================
-- Portal de Currículum Vitae - Script de medición de rendimiento e índices
-- SQL Server (2016+)
-- =============================================================================

SET NOCOUNT ON;
GO

USE [PortalCV];
GO

SET STATISTICS TIME ON;
SET STATISTICS IO ON;
GO

PRINT N'═══════════════════════════════════════════════════════════════════════════';
PRINT N'INICIANDO MEDICIÓN DE RENDIMIENTO - PortalCV';
PRINT N'═══════════════════════════════════════════════════════════════════════════';
PRINT N'';
GO

-- 1) Lista de CVs públicos paginada y filtrable
DECLARE @PageNumber INT = 1;
DECLARE @PageSize INT = 10;
DECLARE @Ciudad NVARCHAR(100) = N'Medellín';
DECLARE @Habilidad NVARCHAR(100) = N'SQL Server';

PRINT N'[CONSULTA 1] Listado de CVs públicos paginado';

WITH PublicCVs AS (
    SELECT
        c.CurriculumId,
        c.UrlPublica,
        c.Estado,
        c.ContadorVisitas,
        c.ContadorContactos,
        p.PrimerNombre,
        p.SegundoNombre,
        p.PrimerApellido,
        p.SegundoApellido,
        p.Ciudad,
        p.Pais,
        per.NombrePerfil,
        per.DescripcionPerfil,
        Habilidades = STUFF(
            (
                SELECT N', ' + h2.Nombre
                FROM dbo.Habilidad h2
                WHERE h2.CurriculumId = c.CurriculumId
                FOR XML PATH(''), TYPE
            ).value('.', N'NVARCHAR(MAX)'),
            1, 2, N''
        )
    FROM dbo.Curriculum c
    INNER JOIN dbo.Personales p ON p.CurriculumId = c.CurriculumId
    LEFT JOIN dbo.Perfil per ON per.CurriculumId = c.CurriculumId
    WHERE c.Estado = N'Publicado'
      AND (@Ciudad IS NULL OR @Ciudad = '' OR p.Ciudad = @Ciudad)
      AND (
            @Habilidad IS NULL
         OR @Habilidad = ''
         OR EXISTS (
                SELECT 1
                FROM dbo.Habilidad h2
                WHERE h2.CurriculumId = c.CurriculumId
                  AND h2.Nombre = @Habilidad
             )
      )
    GROUP BY
        c.CurriculumId,
        c.UrlPublica,
        c.Estado,
        c.ContadorVisitas,
        c.ContadorContactos,
        p.PrimerNombre,
        p.SegundoNombre,
        p.PrimerApellido,
        p.SegundoApellido,
        p.Ciudad,
        p.Pais,
        per.NombrePerfil,
        per.DescripcionPerfil
)
SELECT
    CurriculumId,
    UrlPublica,
    Estado,
    ContadorVisitas,
    ContadorContactos,
    PrimerNombre,
    SegundoNombre,
    PrimerApellido,
    SegundoApellido,
    Ciudad,
    Pais,
    NombrePerfil,
    DescripcionPerfil,
    Habilidades
FROM PublicCVs
ORDER BY ContadorVisitas DESC, CurriculumId
OFFSET (@PageNumber - 1) * @PageSize ROWS
FETCH NEXT @PageSize ROWS ONLY;
GO

-- 2) Búsqueda por palabra clave con LIKE
DECLARE @Query NVARCHAR(200) = N'SQL';

PRINT N'[CONSULTA 2] Búsqueda por palabra clave';

SELECT DISTINCT
    c.CurriculumId,
    c.UrlPublica,
    c.Estado,
    p.PrimerNombre,
    p.SegundoNombre,
    p.PrimerApellido,
    p.SegundoApellido,
    p.Ciudad,
    per.NombrePerfil
FROM dbo.Curriculum c
INNER JOIN dbo.Personales p ON p.CurriculumId = c.CurriculumId
LEFT JOIN dbo.Perfil per ON per.CurriculumId = c.CurriculumId
LEFT JOIN dbo.Habilidad h ON h.CurriculumId = c.CurriculumId
LEFT JOIN dbo.Formacion f ON f.CurriculumId = c.CurriculumId
LEFT JOIN dbo.Experiencia e ON e.CurriculumId = c.CurriculumId
WHERE c.Estado = N'Publicado'
  AND (
        p.PrimerNombre LIKE N'%' + @Query + N'%' OR
        p.PrimerApellido LIKE N'%' + @Query + N'%' OR
        per.NombrePerfil LIKE N'%' + @Query + N'%' OR
        h.Nombre LIKE N'%' + @Query + N'%' OR
        f.Titulo LIKE N'%' + @Query + N'%' OR
        e.Empresa LIKE N'%' + @Query + N'%'
      );
GO

-- 3) Detalle completo del CV por URL pública
DECLARE @UrlPublica NVARCHAR(255) = N'juan-perez';

PRINT N'[CONSULTA 3] Detalle completo del CV por URL pública';

SELECT
    c.CurriculumId,
    c.UrlPublica,
    c.Estado,
    c.ContadorVisitas,
    c.ContadorContactos,
    p.PrimerNombre,
    p.PrimerApellido,
    p.Ciudad,
    per.NombrePerfil,
    COUNT(DISTINCT ep.ExperienciaId) AS TotalExperiencias,
    COUNT(DISTINCT h.HabilidadId) AS TotalHabilidades,
    COUNT(DISTINCT pr.ProyectoId) AS TotalProyectos,
    COUNT(DISTINCT fo.FormacionId) AS TotalFormaciones
FROM dbo.Curriculum c
INNER JOIN dbo.Personales p ON p.CurriculumId = c.CurriculumId
LEFT JOIN dbo.Perfil per ON per.CurriculumId = c.CurriculumId
LEFT JOIN dbo.Experiencia ep ON ep.CurriculumId = c.CurriculumId
LEFT JOIN dbo.Habilidad h ON h.CurriculumId = c.CurriculumId
LEFT JOIN dbo.Proyecto pr ON pr.CurriculumId = c.CurriculumId
LEFT JOIN dbo.Formacion fo ON fo.CurriculumId = c.CurriculumId
WHERE c.UrlPublica = @UrlPublica
  AND c.Estado = N'Publicado'
GROUP BY
    c.CurriculumId,
    c.UrlPublica,
    c.Estado,
    c.ContadorVisitas,
    c.ContadorContactos,
    p.PrimerNombre,
    p.PrimerApellido,
    p.Ciudad,
    per.NombrePerfil;
GO

-- 4) Estadísticas públicas de un CV
DECLARE @UrlStats NVARCHAR(255) = N'juan-perez';

PRINT N'[CONSULTA 4] Estadísticas públicas de un CV';

SELECT
    c.CurriculumId,
    c.UrlPublica,
    c.ContadorVisitas,
    c.ContadorContactos,
    est.TotalVisitas,
    est.TotalContactos,
    est.UltimaVisita
FROM dbo.Curriculum c
LEFT JOIN dbo.EstadisticasPublicas est ON est.CurriculumId = c.CurriculumId
WHERE c.UrlPublica = @UrlStats
  AND c.Estado = N'Publicado';
GO

PRINT N'═══════════════════════════════════════════════════════════════════════════';
PRINT N'REVISIÓN DE ÍNDICES RELEVANTES';
PRINT N'═══════════════════════════════════════════════════════════════════════════';
GO

-- Recomendaciones de índices disponibles desde el motor (compatible con versiones antiguas)
SELECT TOP 20
    OBJECT_NAME(mid.object_id) AS TableName,
    mid.equality_columns,
    mid.inequality_columns,
    mid.included_columns
FROM sys.dm_db_missing_index_details AS mid
WHERE mid.database_id = DB_ID();
GO

-- Crear índices recomendados si no existen
IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE object_id = OBJECT_ID(N'dbo.Curriculum')
      AND name = N'IX_Curriculum_Estado_Visitas'
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_Curriculum_Estado_Visitas
        ON dbo.Curriculum (Estado, ContadorVisitas DESC, CurriculumId)
        INCLUDE (UrlPublica);
END;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE object_id = OBJECT_ID(N'dbo.Personales')
      AND name = N'IX_Personales_Ciudad'
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_Personales_Ciudad
        ON dbo.Personales (Ciudad)
        INCLUDE (CurriculumId, PrimerNombre, PrimerApellido);
END;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE object_id = OBJECT_ID(N'dbo.Habilidad')
      AND name = N'IX_Habilidad_Nombre_Curriculum'
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_Habilidad_Nombre_Curriculum
        ON dbo.Habilidad (Nombre, CurriculumId)
        INCLUDE (Tipo, Nivel);
END;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE object_id = OBJECT_ID(N'dbo.Experiencia')
      AND name = N'IX_Experiencia_Empresa_Curriculum'
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_Experiencia_Empresa_Curriculum
        ON dbo.Experiencia (Empresa, CurriculumId)
        INCLUDE (Cargo, Sector, FechaInicio);
END;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE object_id = OBJECT_ID(N'dbo.Formacion')
      AND name = N'IX_Formacion_Titulo_Institucion'
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_Formacion_Titulo_Institucion
        ON dbo.Formacion (Titulo, Institucion, CurriculumId);
END;
GO

SET STATISTICS TIME OFF;
SET STATISTICS IO OFF;
GO

PRINT N'═══════════════════════════════════════════════════════════════════════════';
PRINT N'MEDICIÓN Y AJUSTE DE ÍNDICES COMPLETADOS';
PRINT N'═══════════════════════════════════════════════════════════════════════════';
GO
