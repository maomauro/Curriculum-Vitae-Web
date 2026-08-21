-- =============================================================================
-- Migracion incremental: tabla Oferta (historial de ofertas laborales analizadas
-- por el postulante, flujo Oferta -> Perfil -> CV generado)
-- =============================================================================
-- INSTRUCCIONES:
--   1. Conectarse directamente a la base de datos "PortalCV" en Azure SQL
--      (NO ejecutar desde master; Azure SQL no admite USE [database]).
--   2. Ejecutar este script completo como sqladmin o un usuario con permisos DDL.
--   3. Seguro de re-ejecutar: no crea la tabla si ya existe, no borra datos.
--
-- Para una base NUEVA, no ejecutar este script: 05_AzureSQL_CreateSchema.sql ya
-- debe incluir esta tabla con esta misma estructura final.
--
-- Modelo de propiedad: cada oferta pertenece a un CV (CurriculumId), igual que
-- Perfil/Experiencia/PromptIa y el resto de tablas de datos privados del portal.
--
-- PerfilId es opcional (NULL hasta que la IA selecciona o el usuario asigna un
-- Perfil a la oferta, ver Estado). ON DELETE NO ACTION (no CASCADE ni SET NULL):
-- Oferta ya tiene una ruta de cascada hacia Curriculum, y SQL Server no permite
-- una segunda ruta en cascada hacia el mismo arbol de tablas (error 1785).
--
-- Estado: 'Analizada' -> 'PerfilAsignado' -> 'CvGenerado' (ver seccion 3 del
-- roadmap docs/arquitectura/Roadmap-Ofertas-IA.md).
--
-- Duplicados: el back-end valida a nivel de aplicacion que no exista otra fila
-- con el mismo (CurriculumId, Cargo, Empresa) normalizado (trim + mayusculas)
-- antes de crear o actualizar — ver ValidarOfertaAsync en CvEditorService. No es
-- un indice unico en la base de datos (evita depender de una columna calculada
-- persistida solo para la normalizacion).
-- =============================================================================

SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.Oferta', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Oferta (
        OfertaId         INT NOT NULL IDENTITY(1,1),
        CurriculumId     INT NOT NULL,
        Cargo            NVARCHAR(150) NOT NULL,
        Empresa          NVARCHAR(150) NOT NULL,
        Descripcion      NVARCHAR(MAX) NULL,
        CorreoReclutador NVARCHAR(150) NULL,
        NombreReclutador NVARCHAR(150) NULL,
        TextoOriginal    NVARCHAR(MAX) NOT NULL,
        OrigenEntrada    NVARCHAR(20)  NOT NULL,
        Estado           NVARCHAR(20)  NOT NULL,
        PerfilId         INT NULL,
        FechaAnalisis    DATETIME2(0)  NOT NULL CONSTRAINT DF_Oferta_FechaAnalisis DEFAULT (SYSUTCDATETIME()),

        CONSTRAINT PK_Oferta PRIMARY KEY CLUSTERED (OfertaId),
        CONSTRAINT FK_Oferta_Curriculum FOREIGN KEY (CurriculumId)
            REFERENCES dbo.Curriculum (CurriculumId) ON DELETE CASCADE,
        CONSTRAINT FK_Oferta_Perfil FOREIGN KEY (PerfilId)
            REFERENCES dbo.Perfil (PerfilId) ON DELETE NO ACTION,
        CONSTRAINT CK_Oferta_OrigenEntrada CHECK (OrigenEntrada IN (N'texto', N'imagen')),
        CONSTRAINT CK_Oferta_Estado CHECK (Estado IN (N'Analizada', N'PerfilAsignado', N'CvGenerado'))
    );

    CREATE NONCLUSTERED INDEX IX_Oferta_CurriculumId ON dbo.Oferta (CurriculumId);

    PRINT 'Tabla dbo.Oferta creada.';
END
ELSE
BEGIN
    PRINT 'Tabla dbo.Oferta ya existe, no se realizan cambios.';
END
GO
