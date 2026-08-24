-- =============================================================================
-- Migracion incremental: tabla CvGenerado (Fase 4 del flujo de Ofertas -- CV
-- generado por IA para una oferta puntual, ver docs/arquitectura/Roadmap-Ofertas-IA.md)
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
-- Modelo de propiedad: pertenece a un CV (CurriculumId), igual que Oferta/Perfil.
-- Uno por Oferta (indice unico en OfertaId) -- regenerar reemplaza el contenido
-- de la fila existente en vez de crear una nueva.
--
-- OfertaId y PerfilId son ON DELETE NO ACTION (no CASCADE): Curriculum->CvGenerado
-- ya cascadea directo; una segunda ruta de cascada via Oferta o Perfil chocaria
-- con la primera (error 1785 de SQL Server) -- mismo patron que Oferta.PerfilId.
--
-- ContenidoJson: resumen/experiencia/educacion/habilidades generados por la IA,
-- mas los datos de contacto (tomados directo de Personales, no confiados a la
-- IA) -- ver ContenidoCvGeneradoDto en el backend.
-- =============================================================================

SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.CvGenerado', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.CvGenerado (
        CvGeneradoId    INT NOT NULL IDENTITY(1,1),
        CurriculumId    INT NOT NULL,
        OfertaId        INT NOT NULL,
        PerfilId        INT NULL,
        ContenidoJson   NVARCHAR(MAX) NOT NULL,
        PromptPorDefecto BIT NOT NULL CONSTRAINT DF_CvGenerado_PromptPorDefecto DEFAULT (0),
        FechaGeneracion DATETIME2(0)  NOT NULL CONSTRAINT DF_CvGenerado_FechaGeneracion DEFAULT (SYSUTCDATETIME()),

        CONSTRAINT PK_CvGenerado PRIMARY KEY CLUSTERED (CvGeneradoId),
        CONSTRAINT FK_CvGenerado_Curriculum FOREIGN KEY (CurriculumId)
            REFERENCES dbo.Curriculum (CurriculumId) ON DELETE CASCADE,
        CONSTRAINT FK_CvGenerado_Oferta FOREIGN KEY (OfertaId)
            REFERENCES dbo.Oferta (OfertaId) ON DELETE NO ACTION,
        CONSTRAINT FK_CvGenerado_Perfil FOREIGN KEY (PerfilId)
            REFERENCES dbo.Perfil (PerfilId) ON DELETE NO ACTION
    );

    CREATE NONCLUSTERED INDEX IX_CvGenerado_CurriculumId ON dbo.CvGenerado (CurriculumId);
    CREATE UNIQUE NONCLUSTERED INDEX UQ_CvGenerado_OfertaId ON dbo.CvGenerado (OfertaId);

    PRINT 'Tabla dbo.CvGenerado creada.';
END
ELSE
BEGIN
    PRINT 'Tabla dbo.CvGenerado ya existe, no se realizan cambios.';
END
GO
