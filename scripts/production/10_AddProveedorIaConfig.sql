-- =============================================================================
-- Migracion incremental: tabla ProveedorIaConfig (conexiones con proveedores de IA
-- propias de cada CV — Claude, OpenAI, Gemini, Ollama/self-hosted, otro)
-- =============================================================================
-- INSTRUCCIONES:
--   1. Conectarse directamente a la base de datos "PortalCV" en Azure SQL
--      (NO ejecutar desde master; Azure SQL no admite USE [database]).
--   2. Ejecutar este script completo como sqladmin o un usuario con permisos DDL.
--   3. Seguro de re-ejecutar: no crea la tabla si ya existe, no borra datos. Si la
--      tabla ya existe con la version anterior de esta migracion (1 conexion por CV,
--      sin Nombre/Endpoint/EsActivo), este script la actualiza a la estructura final
--      sin tocar los datos existentes.
--
-- Para una base NUEVA, no ejecutar este script: 05_AzureSQL_CreateSchema.sql ya
-- debe incluir esta tabla con esta misma estructura final.
--
-- Requiere ademas configurar la variable de entorno Encryption__Key en el backend
-- (clave AES-256 de 32 bytes en base64, mismo patron que Jwt__Key /
-- ConnectionStrings__DefaultConnection) — sin ella, el back-end no arranca las
-- rutas que usan ApiKeyCifrada (falla recien en el primer request que la use,
-- ver AesGcmApiKeyCipher).
--
-- Modelo de propiedad: varias conexiones por CurriculumId, con exactamente una
-- marcada EsActivo=1 a la vez (indice unico filtrado) — mismo patron que
-- UQ_PromptIa_Curriculum_Codigo_Activo. La que esta activa es la que usa el flujo
-- de Ofertas para invocar a la IA.
--
-- La clave de API se guarda cifrada con AES-256-GCM (ver AesGcmApiKeyCipher en el
-- back-end) y nunca se devuelve al front-end. Es opcional (NULL) porque un servidor
-- Ollama local normalmente no requiere clave — Endpoint es obligatorio solo para
-- proveedores self-hosted (hoy, Ollama).
-- =============================================================================

SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.ProveedorIaConfig', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.ProveedorIaConfig (
        ProveedorIaConfigId INT NOT NULL IDENTITY(1,1),
        CurriculumId         INT NOT NULL,
        Proveedor            NVARCHAR(20)  NOT NULL,
        Nombre               NVARCHAR(100) NULL,
        Modelo               NVARCHAR(100) NULL,
        Endpoint             NVARCHAR(500) NULL,
        ApiKeyCifrada        NVARCHAR(MAX) NULL,
        EsActivo             BIT           NOT NULL CONSTRAINT DF_ProveedorIaConfig_EsActivo DEFAULT (0),
        FechaCreacion        DATETIME2(0)  NOT NULL CONSTRAINT DF_ProveedorIaConfig_FechaCreacion DEFAULT (SYSUTCDATETIME()),
        FechaActualizacion   DATETIME2(0)  NOT NULL CONSTRAINT DF_ProveedorIaConfig_FechaActualizacion DEFAULT (SYSUTCDATETIME()),

        CONSTRAINT PK_ProveedorIaConfig PRIMARY KEY CLUSTERED (ProveedorIaConfigId),
        CONSTRAINT FK_ProveedorIaConfig_Curriculum FOREIGN KEY (CurriculumId)
            REFERENCES dbo.Curriculum (CurriculumId) ON DELETE CASCADE,
        CONSTRAINT CK_ProveedorIaConfig_Proveedor CHECK (Proveedor IN (N'claude', N'openai', N'gemini', N'groq', N'ollama', N'otro'))
    );

    CREATE NONCLUSTERED INDEX IX_ProveedorIaConfig_CurriculumId ON dbo.ProveedorIaConfig (CurriculumId);

    CREATE UNIQUE NONCLUSTERED INDEX UQ_ProveedorIaConfig_Curriculum_Activo
        ON dbo.ProveedorIaConfig (CurriculumId)
        WHERE EsActivo = 1;

    PRINT 'Tabla dbo.ProveedorIaConfig creada con estructura completa.';
END
ELSE
BEGIN
    PRINT 'Tabla dbo.ProveedorIaConfig ya existe, verificando columnas e indices...';

    IF COL_LENGTH('dbo.ProveedorIaConfig', 'Nombre') IS NULL
        ALTER TABLE dbo.ProveedorIaConfig ADD Nombre NVARCHAR(100) NULL;

    IF COL_LENGTH('dbo.ProveedorIaConfig', 'Endpoint') IS NULL
        ALTER TABLE dbo.ProveedorIaConfig ADD Endpoint NVARCHAR(500) NULL;

    IF COL_LENGTH('dbo.ProveedorIaConfig', 'EsActivo') IS NULL
    BEGIN
        ALTER TABLE dbo.ProveedorIaConfig ADD EsActivo BIT NOT NULL CONSTRAINT DF_ProveedorIaConfig_EsActivo DEFAULT (0);
        -- Version anterior de esta migracion: 1 conexion por CV (1:1). Al agregar
        -- EsActivo, esa unica fila existente por CV pasa a ser la activa — mantiene
        -- el comportamiento previo (era la unica conexion, ya se usaba como tal).
        EXEC(N'UPDATE dbo.ProveedorIaConfig SET EsActivo = 1;');
        PRINT 'Columna EsActivo agregada; conexiones existentes marcadas como activas (eran 1 por CV).';
    END

    IF COL_LENGTH('dbo.ProveedorIaConfig', 'FechaCreacion') IS NULL
        ALTER TABLE dbo.ProveedorIaConfig ADD FechaCreacion DATETIME2(0) NOT NULL
            CONSTRAINT DF_ProveedorIaConfig_FechaCreacion DEFAULT (SYSUTCDATETIME());

    -- ApiKeyCifrada paso a ser opcional (Ollama local normalmente no requiere clave).
    IF EXISTS (
        SELECT 1 FROM sys.columns
        WHERE object_id = OBJECT_ID('dbo.ProveedorIaConfig') AND name = 'ApiKeyCifrada' AND is_nullable = 0
    )
    BEGIN
        ALTER TABLE dbo.ProveedorIaConfig ALTER COLUMN ApiKeyCifrada NVARCHAR(MAX) NULL;
        PRINT 'Columna ApiKeyCifrada promovida a NULL (opcional).';
    END

    -- El UNIQUE(CurriculumId) de la version 1:1 ya no aplica (ahora puede haber varias
    -- conexiones por CV) — se reemplaza por el indice unico filtrado sobre EsActivo=1.
    IF EXISTS (
        SELECT 1 FROM sys.key_constraints
        WHERE name = 'UQ_ProveedorIaConfig_CurriculumId' AND parent_object_id = OBJECT_ID('dbo.ProveedorIaConfig')
    )
    BEGIN
        ALTER TABLE dbo.ProveedorIaConfig DROP CONSTRAINT UQ_ProveedorIaConfig_CurriculumId;
        PRINT 'Restriccion UQ_ProveedorIaConfig_CurriculumId (1:1) eliminada.';
    END

    IF NOT EXISTS (
        SELECT 1 FROM sys.indexes
        WHERE name = 'IX_ProveedorIaConfig_CurriculumId' AND object_id = OBJECT_ID('dbo.ProveedorIaConfig')
    )
        CREATE NONCLUSTERED INDEX IX_ProveedorIaConfig_CurriculumId ON dbo.ProveedorIaConfig (CurriculumId);

    IF NOT EXISTS (
        SELECT 1 FROM sys.indexes
        WHERE name = 'UQ_ProveedorIaConfig_Curriculum_Activo' AND object_id = OBJECT_ID('dbo.ProveedorIaConfig')
    )
    BEGIN
        CREATE UNIQUE NONCLUSTERED INDEX UQ_ProveedorIaConfig_Curriculum_Activo
            ON dbo.ProveedorIaConfig (CurriculumId)
            WHERE EsActivo = 1;
        PRINT 'Indice UQ_ProveedorIaConfig_Curriculum_Activo creado.';
    END

    -- El CHECK de Proveedor de versiones anteriores no incluia 'gemini'/'ollama', y luego
    -- tampoco 'groq' -- se recrea siempre con la lista completa vigente.
    IF EXISTS (
        SELECT 1 FROM sys.check_constraints
        WHERE name = 'CK_ProveedorIaConfig_Proveedor' AND parent_object_id = OBJECT_ID('dbo.ProveedorIaConfig')
        AND definition NOT LIKE '%groq%'
    )
    BEGIN
        ALTER TABLE dbo.ProveedorIaConfig DROP CONSTRAINT CK_ProveedorIaConfig_Proveedor;
        ALTER TABLE dbo.ProveedorIaConfig ADD CONSTRAINT CK_ProveedorIaConfig_Proveedor
            CHECK (Proveedor IN (N'claude', N'openai', N'gemini', N'groq', N'ollama', N'otro'));
        PRINT 'Restriccion CK_ProveedorIaConfig_Proveedor actualizada (agrega groq).';
    END

    PRINT 'Verificacion de dbo.ProveedorIaConfig completada.';
END
GO
