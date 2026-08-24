-- =============================================================================
-- Migracion incremental: tabla ConfiguracionCorreo (SMTP para enviar correos a
-- reclutadores desde el flujo de Analizar Oferta -> Enviar correo)
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
-- Requiere la misma variable de entorno Encryption__Key que ya usa
-- ProveedorIaConfig.ApiKeyCifrada (clave AES-256 de 32 bytes en base64) -- no se
-- agrega ninguna clave nueva, se reutiliza AesGcmApiKeyCipher tal cual.
--
-- Modelo de propiedad: una configuracion por CurriculumId (indice unico simple,
-- sin columna EsActivo -- a diferencia de ProveedorIaConfig, acá no hay varias
-- conexiones posibles). El remitente/login SMTP siempre es Personales.Email en
-- el momento de enviar, no se guarda un "usuario" separado.
--
-- La contraseña se guarda cifrada con AES-256-GCM y nunca se devuelve al
-- front-end.
-- =============================================================================

SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.ConfiguracionCorreo', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.ConfiguracionCorreo (
        ConfiguracionCorreoId INT NOT NULL IDENTITY(1,1),
        CurriculumId          INT NOT NULL,
        Host                  NVARCHAR(200) NOT NULL CONSTRAINT DF_ConfiguracionCorreo_Host DEFAULT (N'smtp.gmail.com'),
        Puerto                INT           NOT NULL CONSTRAINT DF_ConfiguracionCorreo_Puerto DEFAULT (587),
        UsarTls               BIT           NOT NULL CONSTRAINT DF_ConfiguracionCorreo_UsarTls DEFAULT (1),
        PasswordCifrada       NVARCHAR(MAX) NULL,
        FechaCreacion         DATETIME2(0)  NOT NULL CONSTRAINT DF_ConfiguracionCorreo_FechaCreacion DEFAULT (SYSUTCDATETIME()),
        FechaActualizacion    DATETIME2(0)  NOT NULL CONSTRAINT DF_ConfiguracionCorreo_FechaActualizacion DEFAULT (SYSUTCDATETIME()),

        CONSTRAINT PK_ConfiguracionCorreo PRIMARY KEY CLUSTERED (ConfiguracionCorreoId),
        CONSTRAINT FK_ConfiguracionCorreo_Curriculum FOREIGN KEY (CurriculumId)
            REFERENCES dbo.Curriculum (CurriculumId) ON DELETE CASCADE
    );

    CREATE UNIQUE NONCLUSTERED INDEX UQ_ConfiguracionCorreo_CurriculumId ON dbo.ConfiguracionCorreo (CurriculumId);

    PRINT 'Tabla dbo.ConfiguracionCorreo creada.';
END
ELSE
BEGIN
    PRINT 'Tabla dbo.ConfiguracionCorreo ya existe, no se realizan cambios.';
END
GO
