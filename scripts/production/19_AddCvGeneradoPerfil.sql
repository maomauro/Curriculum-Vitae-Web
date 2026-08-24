-- =============================================================================
-- Migracion incremental: tabla CvGeneradoPerfil (CV general generado por IA a
-- partir de un Perfil y el curriculum completo -- sin oferta de por medio,
-- a diferencia de CvGenerado)
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
-- Modelo de propiedad: pertenece a un CV (CurriculumId), igual que Perfil.
-- Uno por Perfil (indice unico en PerfilId) -- regenerar reemplaza el contenido
-- de la fila existente en vez de crear una nueva.
--
-- PerfilId es ON DELETE NO ACTION (no CASCADE): Curriculum->CvGeneradoPerfil ya
-- cascadea directo; una segunda ruta de cascada via Perfil chocaria con la
-- primera (error 1785 de SQL Server) -- mismo patron que CvGenerado.OfertaId/
-- PerfilId. Borrar un Perfil con CV asociado requiere borrar antes ese
-- CvGeneradoPerfil (ver CvEditorService.DeletePerfilAsync).
--
-- ContenidoJson: experiencia/formacion/proyectos/habilidades condensados por
-- la IA (JSON de ContenidoCvGeneradoPerfilDto) para caber en maximo 3 hojas --
-- se muestra con la misma apariencia visual (colores, tipografia, foto y
-- encabezado) que "Profesional", pero como bloques de texto, no tarjetas
-- estructuradas. El resumen/descripcion del Perfil no lo toca la IA (se
-- muestra tal cual esta guardado), y los datos de contacto/foto del
-- encabezado siguen viniendo directo de Personales.
-- =============================================================================

SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.CvGeneradoPerfil', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.CvGeneradoPerfil (
        CvGeneradoPerfilId INT NOT NULL IDENTITY(1,1),
        CurriculumId       INT NOT NULL,
        PerfilId           INT NOT NULL,
        ContenidoJson      NVARCHAR(MAX) NOT NULL,
        PromptPorDefecto   BIT NOT NULL CONSTRAINT DF_CvGeneradoPerfil_PromptPorDefecto DEFAULT (0),
        FechaGeneracion    DATETIME2(0)  NOT NULL CONSTRAINT DF_CvGeneradoPerfil_FechaGeneracion DEFAULT (SYSUTCDATETIME()),

        CONSTRAINT PK_CvGeneradoPerfil PRIMARY KEY CLUSTERED (CvGeneradoPerfilId),
        CONSTRAINT FK_CvGeneradoPerfil_Curriculum FOREIGN KEY (CurriculumId)
            REFERENCES dbo.Curriculum (CurriculumId) ON DELETE CASCADE,
        CONSTRAINT FK_CvGeneradoPerfil_Perfil FOREIGN KEY (PerfilId)
            REFERENCES dbo.Perfil (PerfilId) ON DELETE NO ACTION
    );

    CREATE NONCLUSTERED INDEX IX_CvGeneradoPerfil_CurriculumId ON dbo.CvGeneradoPerfil (CurriculumId);
    CREATE UNIQUE NONCLUSTERED INDEX UQ_CvGeneradoPerfil_PerfilId ON dbo.CvGeneradoPerfil (PerfilId);

    PRINT 'Tabla dbo.CvGeneradoPerfil creada.';
END
ELSE
BEGIN
    PRINT 'Tabla dbo.CvGeneradoPerfil ya existe, no se realizan cambios.';
END
GO
