-- =============================================================================
-- Migracion incremental: tabla PromptIa (prompts del asistente de IA, propios de
-- cada CV, versionados)
-- =============================================================================
-- INSTRUCCIONES:
--   1. Conectarse directamente a la base de datos "PortalCV" en Azure SQL
--      (NO ejecutar desde master; Azure SQL no admite USE [database]).
--   2. Ejecutar este script completo como sqladmin o un usuario con permisos DDL.
--   3. Seguro de re-ejecutar: no crea la tabla si ya existe, no borra datos.
--      Si la tabla ya existe con una version anterior de esta migracion (sin las
--      columnas de estructura del prompt o sin CurriculumId), este script agrega
--      las columnas y los indices que falten, sin tocar los datos existentes.
--
-- Para una base NUEVA, no ejecutar este script: 05_AzureSQL_CreateSchema.sql ya
-- debe incluir esta tabla con esta misma estructura final.
--
-- Modelo de propiedad: cada prompt pertenece a un CV (CurriculumId), igual que
-- Perfil/Experiencia/AuditoriaCv y el resto de tablas de datos privados del
-- portal. Dos CV distintos pueden tener un prompt con el mismo Codigo (p. ej.
-- EXTRACTOR_OFERTA) sin chocar entre si — la unicidad es siempre (CurriculumId, Codigo).
--
-- Modelo de versionado: cada edicion inserta una FILA NUEVA con el mismo
-- CurriculumId+Codigo y Version+1, y marca la fila anterior EsActivo=0. Ninguna
-- columna de una fila existente se sobrescribe, asi queda historial completo y
-- se puede reactivar una version anterior (ver PromptsIaController).
--
-- Estructura del prompt (columnas RolContexto/Tarea/Reglas/FormatoSalida/Ejemplos):
-- PromptIaService ensambla estas 5 secciones, en ese orden, para generar
-- Contenido (el texto final que se usa al invocar la IA). Contenido nunca se
-- edita a mano — se recalcula automaticamente cada vez que se guarda una version.
-- =============================================================================

SET NOCOUNT ON;
GO

-- -----------------------------------------------------------------------------
-- 1) Crear la tabla si no existe (base nueva o primera vez que corre esta migracion)
-- -----------------------------------------------------------------------------
IF OBJECT_ID(N'dbo.PromptIa', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.PromptIa (
        PromptIaId               INT NOT NULL IDENTITY(1,1),
        CurriculumId              INT NOT NULL,
        Codigo                    NVARCHAR(50)   NOT NULL,
        Nombre                    NVARCHAR(150)  NOT NULL,
        Descripcion               NVARCHAR(500)  NULL,

        -- Estructura del prompt (anatomia): cada seccion es una columna propia
        RolContexto               NVARCHAR(MAX)  NOT NULL, -- quien es la IA, para que sistema trabaja
        Tarea                     NVARCHAR(MAX)  NOT NULL, -- que debe hacer exactamente, incluye donde
                                                             -- va el placeholder de entrada (ej. {{OFERTA_TEXTO}})
        Reglas                    NVARCHAR(MAX)  NULL,      -- restricciones y casos especiales (opcional)
        FormatoSalida             NVARCHAR(MAX)  NOT NULL, -- schema/ejemplo JSON exacto de la respuesta esperada
        Ejemplos                  NVARCHAR(MAX)  NULL,      -- ejemplos few-shot (opcional)

        -- Texto final ensamblado por la aplicacion a partir de las 5 columnas de arriba;
        -- es lo que realmente se usa al invocar la IA en cada llamada
        Contenido                 NVARCHAR(MAX)  NOT NULL,

        Version                   INT            NOT NULL CONSTRAINT DF_PromptIa_Version DEFAULT (1),
        EsActivo                  BIT            NOT NULL CONSTRAINT DF_PromptIa_EsActivo DEFAULT (1),
        FechaCreacion             DATETIME2(0)   NOT NULL CONSTRAINT DF_PromptIa_FechaCreacion DEFAULT (SYSUTCDATETIME()),
        ActualizadoPorUsuarioId   INT NULL,

        CONSTRAINT PK_PromptIa PRIMARY KEY CLUSTERED (PromptIaId),
        CONSTRAINT FK_PromptIa_Curriculum FOREIGN KEY (CurriculumId)
            REFERENCES dbo.Curriculum (CurriculumId) ON DELETE CASCADE,
        CONSTRAINT FK_PromptIa_Usuario_Actualizo FOREIGN KEY (ActualizadoPorUsuarioId)
            REFERENCES dbo.Usuario (UsuarioId) ON DELETE NO ACTION
    );

    -- Solo una version activa por (CurriculumId, Codigo) (a nivel de base de datos, no solo por convencion)
    CREATE UNIQUE NONCLUSTERED INDEX UQ_PromptIa_Curriculum_Codigo_Activo
        ON dbo.PromptIa (CurriculumId, Codigo)
        WHERE EsActivo = 1;

    -- Evita duplicar el numero de version dentro de un mismo (CurriculumId, Codigo)
    CREATE UNIQUE NONCLUSTERED INDEX UQ_PromptIa_Curriculum_Codigo_Version
        ON dbo.PromptIa (CurriculumId, Codigo, Version);

    -- Indice de apoyo para listar el historial completo de un (CurriculumId, Codigo)
    CREATE NONCLUSTERED INDEX IX_PromptIa_Curriculum_Codigo
        ON dbo.PromptIa (CurriculumId, Codigo);

    PRINT 'Tabla dbo.PromptIa creada con estructura completa.';
END
ELSE
BEGIN
    PRINT 'Tabla dbo.PromptIa ya existe, verificando columnas e indices...';

    -- -------------------------------------------------------------------------
    -- 2) Si la tabla ya existia (version anterior de esta migracion), agregar
    --    las columnas que falten
    -- -------------------------------------------------------------------------
    IF COL_LENGTH('dbo.PromptIa', 'CurriculumId') IS NULL
        ALTER TABLE dbo.PromptIa ADD CurriculumId INT NULL;

    IF COL_LENGTH('dbo.PromptIa', 'RolContexto') IS NULL
        ALTER TABLE dbo.PromptIa ADD RolContexto NVARCHAR(MAX) NULL;

    IF COL_LENGTH('dbo.PromptIa', 'Tarea') IS NULL
        ALTER TABLE dbo.PromptIa ADD Tarea NVARCHAR(MAX) NULL;

    IF COL_LENGTH('dbo.PromptIa', 'Reglas') IS NULL
        ALTER TABLE dbo.PromptIa ADD Reglas NVARCHAR(MAX) NULL;

    IF COL_LENGTH('dbo.PromptIa', 'FormatoSalida') IS NULL
        ALTER TABLE dbo.PromptIa ADD FormatoSalida NVARCHAR(MAX) NULL;

    IF COL_LENGTH('dbo.PromptIa', 'Ejemplos') IS NULL
        ALTER TABLE dbo.PromptIa ADD Ejemplos NVARCHAR(MAX) NULL;

    -- Si la tabla venia con la version anterior de esta migracion (dueño = UsuarioId
    -- en vez de CurriculumId), rellena CurriculumId a partir del UsuarioId dueño y
    -- elimina la columna vieja. Un Usuario tiene siempre un unico Curriculum
    -- (UQ_Curriculum_UsuarioId), asi que el mapeo es directo y sin ambiguedad.
    --
    -- Nota: el UPDATE va en SQL dinamico (EXEC) porque CurriculumId puede haber
    -- sido agregado recien arriba, en este mismo batch — SQL Server resuelve los
    -- nombres de columna de un ALTER TABLE...ADD contra el esquema de INICIO del
    -- batch, asi que referenciar la columna nueva sin GO de por medio truena con
    -- "Invalid column name" aunque el ALTER ya se haya ejecutado.
    IF COL_LENGTH('dbo.PromptIa', 'UsuarioId') IS NOT NULL
    BEGIN
        EXEC(N'
            UPDATE p
            SET p.CurriculumId = c.CurriculumId
            FROM dbo.PromptIa p
            JOIN dbo.Curriculum c ON c.UsuarioId = p.UsuarioId
            WHERE p.CurriculumId IS NULL;
        ');

        IF EXISTS (
            SELECT 1 FROM sys.foreign_keys
            WHERE name = 'FK_PromptIa_Usuario' AND parent_object_id = OBJECT_ID('dbo.PromptIa')
        )
            ALTER TABLE dbo.PromptIa DROP CONSTRAINT FK_PromptIa_Usuario;

        -- Los indices viejos basados en UsuarioId deben caer ANTES del DROP COLUMN
        -- de mas abajo: SQL Server no deja eliminar una columna de la que todavia
        -- depende un indice (Msg 5074/4922).
        IF EXISTS (
            SELECT 1 FROM sys.indexes
            WHERE name = 'UQ_PromptIa_Usuario_Codigo_Activo' AND object_id = OBJECT_ID('dbo.PromptIa')
        )
        BEGIN
            DROP INDEX UQ_PromptIa_Usuario_Codigo_Activo ON dbo.PromptIa;
            PRINT 'Indice redundante UQ_PromptIa_Usuario_Codigo_Activo eliminado.';
        END

        IF EXISTS (
            SELECT 1 FROM sys.indexes
            WHERE name = 'UQ_PromptIa_Usuario_Codigo_Version' AND object_id = OBJECT_ID('dbo.PromptIa')
        )
        BEGIN
            DROP INDEX UQ_PromptIa_Usuario_Codigo_Version ON dbo.PromptIa;
            PRINT 'Indice redundante UQ_PromptIa_Usuario_Codigo_Version eliminado.';
        END

        IF EXISTS (
            SELECT 1 FROM sys.indexes
            WHERE name = 'IX_PromptIa_Usuario_Codigo' AND object_id = OBJECT_ID('dbo.PromptIa')
        )
        BEGIN
            DROP INDEX IX_PromptIa_Usuario_Codigo ON dbo.PromptIa;
            PRINT 'Indice redundante IX_PromptIa_Usuario_Codigo eliminado.';
        END

        ALTER TABLE dbo.PromptIa DROP COLUMN UsuarioId;
        PRINT 'Columna UsuarioId migrada a CurriculumId y eliminada.';
    END

    -- -------------------------------------------------------------------------
    -- 2b) FK_PromptIa_Usuario_Actualizo debe ser ON DELETE NO ACTION. Si quedo
    --     con CASCADE o SET NULL (p. ej. por una version muy vieja de esta
    --     migracion, o un ajuste manual), corregirla antes de agregar la FK de
    --     CurriculumId de mas abajo: mezclar dos acciones en cascada que
    --     terminan en dbo.Usuario dispara el error de SQL Server 1785
    --     ("multiple cascade paths").
    -- -------------------------------------------------------------------------
    IF EXISTS (
        SELECT 1 FROM sys.foreign_keys
        WHERE name = 'FK_PromptIa_Usuario_Actualizo'
          AND parent_object_id = OBJECT_ID('dbo.PromptIa')
          AND delete_referential_action <> 0 -- 0 = NO_ACTION
    )
    BEGIN
        ALTER TABLE dbo.PromptIa DROP CONSTRAINT FK_PromptIa_Usuario_Actualizo;
        ALTER TABLE dbo.PromptIa ADD CONSTRAINT FK_PromptIa_Usuario_Actualizo
            FOREIGN KEY (ActualizadoPorUsuarioId) REFERENCES dbo.Usuario (UsuarioId) ON DELETE NO ACTION;
        PRINT 'FK_PromptIa_Usuario_Actualizo corregida a ON DELETE NO ACTION.';
    END

    -- -------------------------------------------------------------------------
    -- 2c) Si ya no quedan filas con CurriculumId/RolContexto/Tarea/FormatoSalida
    --     en NULL (backfill completo, o siempre fueron NOT NULL), promueve esas
    --     columnas a NOT NULL y agrega la FK de CurriculumId si todavia falta.
    --     Va en SQL dinamico por la misma razon de siempre: las columnas pueden
    --     haberse agregado mas arriba en este mismo batch.
    -- -------------------------------------------------------------------------
    IF NOT EXISTS (SELECT 1 FROM dbo.PromptIa WHERE CurriculumId IS NULL)
       AND NOT EXISTS (SELECT 1 FROM dbo.PromptIa WHERE RolContexto IS NULL)
       AND NOT EXISTS (SELECT 1 FROM dbo.PromptIa WHERE Tarea IS NULL)
       AND NOT EXISTS (SELECT 1 FROM dbo.PromptIa WHERE FormatoSalida IS NULL)
    BEGIN
        IF EXISTS (
            SELECT 1 FROM sys.columns
            WHERE object_id = OBJECT_ID('dbo.PromptIa') AND name = 'CurriculumId' AND is_nullable = 1
        )
        BEGIN
            EXEC(N'ALTER TABLE dbo.PromptIa ALTER COLUMN CurriculumId INT NOT NULL;');
            EXEC(N'ALTER TABLE dbo.PromptIa ALTER COLUMN RolContexto NVARCHAR(MAX) NOT NULL;');
            EXEC(N'ALTER TABLE dbo.PromptIa ALTER COLUMN Tarea NVARCHAR(MAX) NOT NULL;');
            EXEC(N'ALTER TABLE dbo.PromptIa ALTER COLUMN FormatoSalida NVARCHAR(MAX) NOT NULL;');
            PRINT 'Columnas CurriculumId/RolContexto/Tarea/FormatoSalida promovidas a NOT NULL.';
        END

        IF NOT EXISTS (
            SELECT 1 FROM sys.foreign_keys
            WHERE name = 'FK_PromptIa_Curriculum' AND parent_object_id = OBJECT_ID('dbo.PromptIa')
        )
        BEGIN
            EXEC(N'
                ALTER TABLE dbo.PromptIa ADD CONSTRAINT FK_PromptIa_Curriculum
                    FOREIGN KEY (CurriculumId) REFERENCES dbo.Curriculum (CurriculumId) ON DELETE CASCADE;
            ');
            PRINT 'FK_PromptIa_Curriculum agregada.';
        END
    END
    ELSE
    BEGIN
        PRINT 'Quedan filas con CurriculumId/RolContexto/Tarea/FormatoSalida en NULL: completalas manualmente y vuelve a correr este script para promover esas columnas a NOT NULL y agregar FK_PromptIa_Curriculum.';
    END

    -- -------------------------------------------------------------------------
    -- 3) Agregar los indices unicos si faltan
    -- -------------------------------------------------------------------------
    -- Estos CREATE INDEX tambien van en SQL dinamico por la misma razon que el
    -- UPDATE de arriba: referencian CurriculumId, que puede haberse agregado
    -- recien en este mismo batch.
    IF NOT EXISTS (
        SELECT 1 FROM sys.indexes
        WHERE name = 'UQ_PromptIa_Curriculum_Codigo_Activo' AND object_id = OBJECT_ID('dbo.PromptIa')
    )
    BEGIN
        EXEC(N'
            CREATE UNIQUE NONCLUSTERED INDEX UQ_PromptIa_Curriculum_Codigo_Activo
                ON dbo.PromptIa (CurriculumId, Codigo)
                WHERE EsActivo = 1;
        ');
        PRINT 'Indice UQ_PromptIa_Curriculum_Codigo_Activo creado.';
    END

    IF NOT EXISTS (
        SELECT 1 FROM sys.indexes
        WHERE name = 'UQ_PromptIa_Curriculum_Codigo_Version' AND object_id = OBJECT_ID('dbo.PromptIa')
    )
    BEGIN
        EXEC(N'
            CREATE UNIQUE NONCLUSTERED INDEX UQ_PromptIa_Curriculum_Codigo_Version
                ON dbo.PromptIa (CurriculumId, Codigo, Version);
        ');
        PRINT 'Indice UQ_PromptIa_Curriculum_Codigo_Version creado.';
    END

    IF NOT EXISTS (
        SELECT 1 FROM sys.indexes
        WHERE name = 'IX_PromptIa_Curriculum_Codigo' AND object_id = OBJECT_ID('dbo.PromptIa')
    )
    BEGIN
        EXEC(N'CREATE NONCLUSTERED INDEX IX_PromptIa_Curriculum_Codigo ON dbo.PromptIa (CurriculumId, Codigo);');
        PRINT 'Indice IX_PromptIa_Curriculum_Codigo creado.';
    END

    -- Estos dos quedan de versiones aun mas viejas de la tabla (sin dueño en
    -- absoluto), no dependen de UsuarioId ni de CurriculumId:
    IF EXISTS (
        SELECT 1 FROM sys.indexes
        WHERE name = 'IX_PromptIa_Codigo_EsActivo' AND object_id = OBJECT_ID('dbo.PromptIa')
    )
    BEGIN
        DROP INDEX IX_PromptIa_Codigo_EsActivo ON dbo.PromptIa;
        PRINT 'Indice redundante IX_PromptIa_Codigo_EsActivo eliminado.';
    END

    IF EXISTS (
        SELECT 1 FROM sys.indexes
        WHERE name = 'IX_PromptIa_Codigo' AND object_id = OBJECT_ID('dbo.PromptIa')
    )
    BEGIN
        DROP INDEX IX_PromptIa_Codigo ON dbo.PromptIa;
        PRINT 'Indice redundante IX_PromptIa_Codigo eliminado.';
    END

    PRINT 'Verificacion de dbo.PromptIa completada.';
END
GO
