-- =============================================================================
-- Portal de Currículum Vitae - Script de consultas públicas de ejemplo
-- SQL Server (2016+)
-- Basado en requerimientos de APIs públicas: CVs, búsqueda, detalle, estadísticas, filtros y contacto.
-- =============================================================================

SET NOCOUNT ON;
GO

-- 1) Listado de CVs públicos paginado y filtrable
--    Endpoint: GET /api/public/cvs
--    Filtros de ejemplo: ciudad, habilidad, estado publicado
DECLARE @PageNumber INT = 1;
DECLARE @PageSize INT = 10;
DECLARE @Ciudad NVARCHAR(100) = N'Medellín';
DECLARE @Habilidad NVARCHAR(100) = N'SQL Server';

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
        Habilidades = STRING_AGG(h.Nombre, N', ')
    FROM dbo.Curriculum c
    INNER JOIN dbo.Personales p ON p.CurriculumId = c.CurriculumId
    LEFT JOIN dbo.Perfil per ON per.CurriculumId = c.CurriculumId
    LEFT JOIN dbo.Habilidad h ON h.CurriculumId = c.CurriculumId
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

-- 2) Búsqueda por palabra clave con sugerencias
--    Endpoint: GET /api/public/search?q=
DECLARE @Query NVARCHAR(200) = N'SQL';

SELECT DISTINCT
    c.CurriculumId,
    c.UrlPublica,
    c.Estado,
    p.PrimerNombre,
    p.SegundoNombre,
    p.PrimerApellido,
    p.SegundoApellido,
    p.Ciudad,
    per.NombrePerfil,
    per.DescripcionPerfil,
    h.Nombre AS Habilidad,
    f.Titulo AS Formacion,
    e.Empresa AS EmpresaExperiencia,
    r.Empresa AS ReferenciaEmpresa
FROM dbo.Curriculum c
INNER JOIN dbo.Personales p ON p.CurriculumId = c.CurriculumId
LEFT JOIN dbo.Perfil per ON per.CurriculumId = c.CurriculumId
LEFT JOIN dbo.Habilidad h ON h.CurriculumId = c.CurriculumId
LEFT JOIN dbo.Formacion f ON f.CurriculumId = c.CurriculumId
LEFT JOIN dbo.Experiencia e ON e.CurriculumId = c.CurriculumId
LEFT JOIN dbo.Referencia r ON r.CurriculumId = c.CurriculumId
WHERE c.Estado = N'Publicado'
  AND (
        p.PrimerNombre LIKE N'%' + @Query + N'%' OR
        p.SegundoNombre LIKE N'%' + @Query + N'%' OR
        p.PrimerApellido LIKE N'%' + @Query + N'%' OR
        p.SegundoApellido LIKE N'%' + @Query + N'%' OR
        p.Ciudad LIKE N'%' + @Query + N'%' OR
        p.Pais LIKE N'%' + @Query + N'%' OR
        per.NombrePerfil LIKE N'%' + @Query + N'%' OR
        per.DescripcionPerfil LIKE N'%' + @Query + N'%' OR
        h.Nombre LIKE N'%' + @Query + N'%' OR
        f.Titulo LIKE N'%' + @Query + N'%' OR
        f.Institucion LIKE N'%' + @Query + N'%' OR
        e.Empresa LIKE N'%' + @Query + N'%' OR
        e.Cargo LIKE N'%' + @Query + N'%' OR
        r.Nombre LIKE N'%' + @Query + N'%' OR
        r.Empresa LIKE N'%' + @Query + N'%' OR
        r.Cargo LIKE N'%' + @Query + N'%' OR
        c.UrlPublica LIKE N'%' + @Query + N'%'
      );
GO

-- 3) Detalle completo del CV por URL pública
--    Endpoint: GET /api/public/cvs/{urlPublica}
DECLARE @UrlPublica NVARCHAR(255) = N'juan-perez';

SELECT
    c.CurriculumId,
    c.UrlPublica,
    c.Estado,
    c.ContadorVisitas,
    c.ContadorContactos,
    c.FechaCreacion,
    c.FechaActualizacion,
    p.TipoIdentificacion,
    p.NumeroDocumento,
    p.FechaNacimiento,
    p.PrimerNombre,
    p.SegundoNombre,
    p.PrimerApellido,
    p.SegundoApellido,
    p.Ciudad,
    p.Departamento,
    p.Pais,
    p.Email AS EmailPersonal,
    p.Celular,
    per.NombrePerfil,
    per.DescripcionPerfil,
    per.AspiracionSalarialPesos,
    per.AspiracionSalarialDolares,
    ep.ExperienciaId,
    ep.Empresa,
    ep.Cargo,
    ep.Sector,
    ep.FechaInicio AS ExperienciaFechaInicio,
    ep.FechaFin AS ExperienciaFechaFin,
    ep.TipoContrato,
    ep.Funciones,
    h.HabilidadId,
    h.Nombre AS HabilidadNombre,
    h.Tipo AS HabilidadTipo,
    h.Nivel AS HabilidadNivel,
    pr.ProyectoId,
    pr.NombreProyecto,
    pr.Rol AS ProyectoRol,
    pr.StackTecnologico,
    pr.Aporte,
    pr.Logro,
    pr.Desafio,
    fo.FormacionId,
    fo.Titulo AS FormacionTitulo,
    fo.Institucion,
    fo.Area AS FormacionArea,
    fo.FechaInicio AS FormacionFechaInicio,
    fo.FechaFin AS FormacionFechaFin,
    fo.TipoFormacion,
    fo.Descripcion AS FormacionDescripcion,
    re.ReferenciaId,
    re.TipoReferencia,
    re.Nombre AS ReferenciaNombre,
    re.Apellido AS ReferenciaApellido,
    re.Email AS ReferenciaEmail,
    re.Telefono AS ReferenciaTelefono,
    re.Cargo AS ReferenciaCargo,
    re.Empresa AS ReferenciaEmpresa,
    re.Parentesco,
    rs.RedSocialId,
    rs.NombreRed,
    rs.LinkPublico,
    rs.UsuarioContacto,
    fc.FamiliarId,
    fc.Parentesco AS FamiliarParentesco,
    fc.Nombres AS FamiliarNombres,
    fc.Apellidos AS FamiliarApellidos,
    fc.Email AS FamiliarEmail,
    fc.Telefono AS FamiliarTelefono,
    fc.EsContactoPrincipal,
    vs.VisibilidadSeccionId,
    vs.NombreSeccion,
    vs.EsVisible,
    est.TotalVisitas,
    est.TotalContactos,
    est.UltimaVisita,
    est.FechaActualizacion AS StatsFechaActualizacion
FROM dbo.Curriculum c
INNER JOIN dbo.Personales p ON p.CurriculumId = c.CurriculumId
LEFT JOIN dbo.Perfil per ON per.CurriculumId = c.CurriculumId
LEFT JOIN dbo.Experiencia ep ON ep.CurriculumId = c.CurriculumId
LEFT JOIN dbo.Habilidad h ON h.CurriculumId = c.CurriculumId
LEFT JOIN dbo.Proyecto pr ON pr.CurriculumId = c.CurriculumId
LEFT JOIN dbo.Formacion fo ON fo.CurriculumId = c.CurriculumId
LEFT JOIN dbo.Referencia re ON re.CurriculumId = c.CurriculumId
LEFT JOIN dbo.RedSocial rs ON rs.CurriculumId = c.CurriculumId
LEFT JOIN dbo.FamiliarContacto fc ON fc.CurriculumId = c.CurriculumId
LEFT JOIN dbo.VisibilidadSeccion vs ON vs.CurriculumId = c.CurriculumId
LEFT JOIN dbo.EstadisticasPublicas est ON est.CurriculumId = c.CurriculumId
WHERE c.UrlPublica = @UrlPublica
  AND c.Estado = N'Publicado';
GO

-- 4) Estadísticas públicas de un CV por URL pública
--    Endpoint: GET /api/public/cvs/{urlPublica}/stats
DECLARE @UrlStats NVARCHAR(255) = N'juan-perez';

SELECT
    c.CurriculumId,
    c.UrlPublica,
    c.ContadorVisitas AS ContadorVisitasCurriculum,
    c.ContadorContactos AS ContadorContactosCurriculum,
    est.TotalVisitas,
    est.TotalContactos,
    est.UltimaVisita,
    est.FechaActualizacion AS FechaActualizacionEstadisticas
FROM dbo.Curriculum c
LEFT JOIN dbo.EstadisticasPublicas est ON est.CurriculumId = c.CurriculumId
WHERE c.UrlPublica = @UrlStats
  AND c.Estado = N'Publicado';
GO

-- 5) Inserción de contacto público + alerta de visita
--    Endpoint: POST /api/public/contact/{cvId}
DECLARE @CvId INT = 1;
DECLARE @Nombre NVARCHAR(100) = N'Nuevo Contacto';
DECLARE @Correo NVARCHAR(100) = N'contacto@example.com';
DECLARE @Empresa NVARCHAR(150) = N'Empresa XYZ';
DECLARE @Motivo NVARCHAR(255) = N'Interés en colaboración profesional';
DECLARE @ComoMeEncontraste NVARCHAR(255) = N'LinkedIn';
DECLARE @Mensaje NVARCHAR(MAX) = N'Hola, quiero hablar sobre una oportunidad de trabajo.';

INSERT INTO dbo.VisitanteContacto (
    CurriculumId,
    Nombre,
    Correo,
    Empresa,
    MotivoContacto,
    ComoMeEncontraste,
    Mensaje
)
VALUES (
    @CvId,
    @Nombre,
    @Correo,
    @Empresa,
    @Motivo,
    @ComoMeEncontraste,
    @Mensaje
);

INSERT INTO dbo.AlertaVisita (
    CurriculumId,
    FechaVisita,
    Origen,
    TipoVisita
)
VALUES (
    @CvId,
    SYSDATETIME(),
    N'Formulario público',
    N'ConContacto'
);
GO

-- 6) Filtros públicos: ciudades y habilidades populares
--    Endpoint: GET /api/public/filters

SELECT DISTINCT
    p.Ciudad
FROM dbo.Personales p
INNER JOIN dbo.Curriculum c ON c.CurriculumId = p.CurriculumId
WHERE c.Estado = N'Publicado'
  AND p.Ciudad IS NOT NULL
ORDER BY p.Ciudad;

SELECT DISTINCT
    h.Nombre AS Habilidad
FROM dbo.Habilidad h
INNER JOIN dbo.Curriculum c ON c.CurriculumId = h.CurriculumId
WHERE c.Estado = N'Publicado'
  AND h.Nombre IS NOT NULL
ORDER BY h.Nombre;
GO

-- 7) Sugerencias de búsqueda: slugs y currículos más visitados
--    Endpoint: GET /api/public/search?q= (autocompletado)
DECLARE @Query NVARCHAR(200) = N'S';

SELECT TOP (10)
    c.UrlPublica,
    p.PrimerNombre,
    p.PrimerApellido,
    per.NombrePerfil,
    c.ContadorVisitas
FROM dbo.Curriculum c
INNER JOIN dbo.Personales p ON p.CurriculumId = c.CurriculumId
LEFT JOIN dbo.Perfil per ON per.CurriculumId = c.CurriculumId
WHERE c.Estado = N'Publicado'
  AND (
        c.UrlPublica LIKE @Query + N'%' OR
        p.PrimerNombre LIKE @Query + N'%' OR
        p.PrimerApellido LIKE @Query + N'%' OR
        per.NombrePerfil LIKE @Query + N'%'
      )
ORDER BY c.ContadorVisitas DESC;
GO

PRINT N'Script 03_PublicQueries.sql generado correctamente.';
GO
