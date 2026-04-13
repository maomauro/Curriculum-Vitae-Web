-- =============================================================================
-- Portal de Currículum Vitae - Script de creación de base de datos
-- SQL Server (2016+)
-- Basado en docs/Documentacion.md y docs/modelo.md
-- =============================================================================

SET NOCOUNT ON;
GO

-- Opcional: crear la base de datos (descomentar si se ejecuta como admin)
/*
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = N'PortalCV')
BEGIN
    CREATE DATABASE [PortalCV];
END
GO
*/
USE [PortalCV];
GO

-- =============================================================================
-- LIMPIEZA: Eliminar vistas y tablas en orden inverso de dependencias (para re-ejecutar)
-- =============================================================================

IF OBJECT_ID(N'dbo.vw_VisitasYContactosPorCurriculum', N'V') IS NOT NULL DROP VIEW dbo.vw_VisitasYContactosPorCurriculum;
IF OBJECT_ID(N'dbo.vw_CurriculumPersonales', N'V') IS NOT NULL DROP VIEW dbo.vw_CurriculumPersonales;
IF OBJECT_ID(N'dbo.vw_CurriculumResumen', N'V') IS NOT NULL DROP VIEW dbo.vw_CurriculumResumen;
IF OBJECT_ID(N'dbo.vw_EstadisticasDesdeCurriculum', N'V') IS NOT NULL DROP VIEW dbo.vw_EstadisticasDesdeCurriculum;
GO

IF OBJECT_ID(N'dbo.UsuarioRol', N'U') IS NOT NULL            DROP TABLE dbo.UsuarioRol;
IF OBJECT_ID(N'dbo.EstadisticasPublicas', N'U') IS NOT NULL   DROP TABLE dbo.EstadisticasPublicas;
IF OBJECT_ID(N'dbo.VisibilidadSeccion', N'U') IS NOT NULL     DROP TABLE dbo.VisibilidadSeccion;
IF OBJECT_ID(N'dbo.AlertaVisita', N'U') IS NOT NULL           DROP TABLE dbo.AlertaVisita;
IF OBJECT_ID(N'dbo.VisitanteContacto', N'U') IS NOT NULL      DROP TABLE dbo.VisitanteContacto;
IF OBJECT_ID(N'dbo.RedSocial', N'U') IS NOT NULL              DROP TABLE dbo.RedSocial;
IF OBJECT_ID(N'dbo.FamiliarContacto', N'U') IS NOT NULL      DROP TABLE dbo.FamiliarContacto;
IF OBJECT_ID(N'dbo.Referencia', N'U') IS NOT NULL            DROP TABLE dbo.Referencia;
IF OBJECT_ID(N'dbo.Proyecto', N'U') IS NOT NULL              DROP TABLE dbo.Proyecto;
IF OBJECT_ID(N'dbo.Habilidad', N'U') IS NOT NULL              DROP TABLE dbo.Habilidad;
IF OBJECT_ID(N'dbo.Formacion', N'U') IS NOT NULL             DROP TABLE dbo.Formacion;
IF OBJECT_ID(N'dbo.Experiencia', N'U') IS NOT NULL            DROP TABLE dbo.Experiencia;
IF OBJECT_ID(N'dbo.Perfil', N'U') IS NOT NULL                 DROP TABLE dbo.Perfil;
IF OBJECT_ID(N'dbo.Personales', N'U') IS NOT NULL            DROP TABLE dbo.Personales;
IF OBJECT_ID(N'dbo.AuditoriaCv', N'U') IS NOT NULL           DROP TABLE dbo.AuditoriaCv;
IF OBJECT_ID(N'dbo.Curriculum', N'U') IS NOT NULL              DROP TABLE dbo.Curriculum;
IF OBJECT_ID(N'dbo.AuditoriaAdmin', N'U') IS NOT NULL        DROP TABLE dbo.AuditoriaAdmin;
IF OBJECT_ID(N'dbo.Usuario', N'U') IS NOT NULL                DROP TABLE dbo.Usuario;
IF OBJECT_ID(N'dbo.Rol', N'U') IS NOT NULL                   DROP TABLE dbo.Rol;
GO

-- =============================================================================
-- ESQUEMA: Tablas en orden de dependencias (FK)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- A. SEGURIDAD Y USUARIOS
-- -----------------------------------------------------------------------------

CREATE TABLE dbo.Rol (
    RolId           INT NOT NULL IDENTITY(1,1),
    NombreRol        NVARCHAR(50)  NOT NULL,
    Descripcion      NVARCHAR(255) NULL,
    CONSTRAINT PK_Rol PRIMARY KEY CLUSTERED (RolId),
    CONSTRAINT UQ_Rol_NombreRol UNIQUE (NombreRol)
);

CREATE TABLE dbo.Usuario (
    UsuarioId       INT NOT NULL IDENTITY(1,1),
    Email           NVARCHAR(100) NOT NULL,
    PasswordHash    NVARCHAR(255) NOT NULL,
    Estado          NVARCHAR(20)  NOT NULL DEFAULT N'Activo',
    FechaRegistro   DATETIME2(0)  NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT PK_Usuario PRIMARY KEY CLUSTERED (UsuarioId),
    CONSTRAINT UQ_Usuario_Email UNIQUE (Email),
    CONSTRAINT CK_Usuario_Estado CHECK (Estado IN (N'Activo', N'Inactivo', N'Bloqueado'))
);

CREATE TABLE dbo.UsuarioRol (
    UsuarioRolId    INT NOT NULL IDENTITY(1,1),
    UsuarioId       INT NOT NULL,
    RolId           INT NOT NULL,
    CONSTRAINT PK_UsuarioRol PRIMARY KEY CLUSTERED (UsuarioRolId),
    CONSTRAINT FK_UsuarioRol_Usuario FOREIGN KEY (UsuarioId) REFERENCES dbo.Usuario (UsuarioId) ON DELETE CASCADE,
    CONSTRAINT FK_UsuarioRol_Rol     FOREIGN KEY (RolId)     REFERENCES dbo.Rol (RolId) ON DELETE CASCADE,
    CONSTRAINT UQ_UsuarioRol_UsuarioId_RolId UNIQUE (UsuarioId, RolId)
);

-- -----------------------------------------------------------------------------
-- B. CURRICULUM (agregado raíz)
-- -----------------------------------------------------------------------------

CREATE TABLE dbo.Curriculum (
    CurriculumId      INT NOT NULL IDENTITY(1,1),
    UsuarioId         INT NOT NULL,
    UrlPublica        NVARCHAR(255) NOT NULL,
    Estado            NVARCHAR(20)  NOT NULL DEFAULT N'Borrador',
    ContadorVisitas   INT NOT NULL DEFAULT 0,
    ContadorContactos INT NOT NULL DEFAULT 0,
    PlantillaCodigo   NVARCHAR(32)  NOT NULL DEFAULT N'clasico',
    FechaCreacion     DATETIME2(0)  NOT NULL DEFAULT SYSDATETIME(),
    FechaActualizacion DATETIME2(0) NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT PK_Curriculum PRIMARY KEY CLUSTERED (CurriculumId),
    CONSTRAINT FK_Curriculum_Usuario FOREIGN KEY (UsuarioId) REFERENCES dbo.Usuario (UsuarioId) ON DELETE CASCADE,
    CONSTRAINT UQ_Curriculum_UsuarioId UNIQUE (UsuarioId),
    CONSTRAINT UQ_Curriculum_UrlPublica UNIQUE (UrlPublica),
    CONSTRAINT CK_Curriculum_Estado CHECK (Estado IN (N'Borrador', N'Publicado', N'Oculto'))
);

CREATE NONCLUSTERED INDEX IX_Curriculum_UrlPublica ON dbo.Curriculum (UrlPublica);
CREATE NONCLUSTERED INDEX IX_Curriculum_Estado_Visitas ON dbo.Curriculum (Estado, ContadorVisitas DESC, CurriculumId)
    INCLUDE (UrlPublica);

-- -----------------------------------------------------------------------------
-- C. INFORMACIÓN PERSONAL (Personales - 1 a 1 con Curriculum)
-- -----------------------------------------------------------------------------

CREATE TABLE dbo.Personales (
    PersonalesId        INT NOT NULL IDENTITY(1,1),
    CurriculumId       INT NOT NULL,
    -- Identificación
    TipoIdentificacion NVARCHAR(50)  NULL,
    NumeroDocumento     NVARCHAR(50)  NULL,
    FechaExpedicion    DATE          NULL,
    LugarExpedicion    NVARCHAR(100) NULL,
    LibretaMilitarNumero NVARCHAR(50) NULL,
    LibretaMilitarClase NVARCHAR(20) NULL,
    PasaporteNumero    NVARCHAR(50)  NULL,
    PasaporteVigencia  DATE          NULL,
    VisaNumero         NVARCHAR(50)  NULL,
    VisaVigencia       DATE          NULL,
    VisaClase          NVARCHAR(50)  NULL,
    -- Datos básicos
    PrimerNombre       NVARCHAR(50)  NOT NULL,
    SegundoNombre      NVARCHAR(50)  NULL,
    PrimerApellido     NVARCHAR(50)  NOT NULL,
    SegundoApellido    NVARCHAR(50)  NULL,
    FechaNacimiento    DATE          NULL,
    LugarNacimiento    NVARCHAR(100) NULL,
    Genero             NVARCHAR(20)  NULL,
    Nacionalidad       NVARCHAR(50)  NULL,
    TipoSangre         NVARCHAR(10) NULL,
    EPS                NVARCHAR(100) NULL,
    Pencion            NVARCHAR(100) NULL,
    Cesantias          NVARCHAR(100) NULL,
    -- Contacto
    Email              NVARCHAR(100) NULL,
    Celular            NVARCHAR(20) NULL,
    TelefonoFijo       NVARCHAR(20) NULL,
    -- Residencia
    Pais               NVARCHAR(50) NULL,
    Departamento       NVARCHAR(50) NULL,
    Ciudad             NVARCHAR(50) NULL,
    Barrio             NVARCHAR(100) NULL,
    CodigoPostal       NVARCHAR(20) NULL,
    Direccion          NVARCHAR(255) NULL,
    TipoResidencia     NVARCHAR(50) NULL,
    FotoUrl            NVARCHAR(500) NULL,
    CONSTRAINT PK_Personales PRIMARY KEY CLUSTERED (PersonalesId),
    CONSTRAINT FK_Personales_Curriculum FOREIGN KEY (CurriculumId) REFERENCES dbo.Curriculum (CurriculumId) ON DELETE CASCADE,
    CONSTRAINT UQ_Personales_CurriculumId UNIQUE (CurriculumId)
);

CREATE NONCLUSTERED INDEX IX_Personales_Ciudad ON dbo.Personales (Ciudad)
    INCLUDE (CurriculumId, PrimerNombre, PrimerApellido);

-- -----------------------------------------------------------------------------
-- D. CONTACTOS Y REDES
-- -----------------------------------------------------------------------------

CREATE TABLE dbo.Referencia (
    ReferenciaId     INT NOT NULL IDENTITY(1,1),
    CurriculumId     INT NOT NULL,
    TipoReferencia   NVARCHAR(20)  NOT NULL,
    ExperienciaId    INT           NULL,
    Nombre           NVARCHAR(100) NOT NULL,
    Apellido         NVARCHAR(100) NULL,
    Email            NVARCHAR(100) NULL,
    Telefono         NVARCHAR(20) NULL,
    Parentesco       NVARCHAR(50)  NULL,
    -- Campos para referencia laboral
    Cargo            NVARCHAR(100) NULL,
    Empresa          NVARCHAR(150) NULL,
    Relacion         NVARCHAR(100) NULL,
    Observaciones    NVARCHAR(500) NULL,
    AdjuntoSoporte   NVARCHAR(500) NULL,
    FechaRegistro    DATETIME2(0)  NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT PK_Referencia PRIMARY KEY CLUSTERED (ReferenciaId),
    CONSTRAINT FK_Referencia_Curriculum  FOREIGN KEY (CurriculumId)  REFERENCES dbo.Curriculum (CurriculumId) ON DELETE CASCADE,
    CONSTRAINT CK_Referencia_TipoReferencia CHECK (TipoReferencia IN (N'Laboral', N'Personal'))
);

-- FK a Experiencia se agrega después de crear Experiencia
CREATE NONCLUSTERED INDEX IX_Referencia_CurriculumId ON dbo.Referencia (CurriculumId);
CREATE NONCLUSTERED INDEX IX_Referencia_TipoReferencia ON dbo.Referencia (TipoReferencia);

CREATE TABLE dbo.FamiliarContacto (
    FamiliarId          INT NOT NULL IDENTITY(1,1),
    CurriculumId        INT NOT NULL,
    Parentesco          NVARCHAR(50)  NULL,
    Nombres             NVARCHAR(100) NULL,
    Apellidos           NVARCHAR(100) NULL,
    Email               NVARCHAR(100) NULL,
    Telefono            NVARCHAR(20) NULL,
    EsContactoPrincipal  BIT NOT NULL DEFAULT 0,
    CONSTRAINT PK_FamiliarContacto PRIMARY KEY CLUSTERED (FamiliarId),
    CONSTRAINT FK_FamiliarContacto_Curriculum FOREIGN KEY (CurriculumId) REFERENCES dbo.Curriculum (CurriculumId) ON DELETE CASCADE
);

CREATE TABLE dbo.RedSocial (
    RedSocialId     INT NOT NULL IDENTITY(1,1),
    CurriculumId    INT NOT NULL,
    NombreRed       NVARCHAR(50)  NOT NULL,
    LinkPublico     NVARCHAR(500) NULL,
    UsuarioContacto NVARCHAR(100) NULL,
    CONSTRAINT PK_RedSocial PRIMARY KEY CLUSTERED (RedSocialId),
    CONSTRAINT FK_RedSocial_Curriculum FOREIGN KEY (CurriculumId) REFERENCES dbo.Curriculum (CurriculumId) ON DELETE CASCADE
);

-- -----------------------------------------------------------------------------
-- E. PERFIL PROFESIONAL
-- -----------------------------------------------------------------------------

CREATE TABLE dbo.Perfil (
    PerfilId                INT NOT NULL IDENTITY(1,1),
    CurriculumId            INT NOT NULL,
    NombrePerfil            NVARCHAR(100) NULL,
    DescripcionPerfil       NVARCHAR(MAX) NULL,
    ExperienciaPerfilAnios  DECIMAL(5,2) NULL,
    AspiracionSalarialPesos DECIMAL(18,2) NULL,
    AspiracionSalarialDolares DECIMAL(18,2) NULL,
    EsActivo                  BIT           NOT NULL DEFAULT 1,
    CONSTRAINT PK_Perfil PRIMARY KEY CLUSTERED (PerfilId),
    CONSTRAINT FK_Perfil_Curriculum FOREIGN KEY (CurriculumId) REFERENCES dbo.Curriculum (CurriculumId) ON DELETE CASCADE
);

-- -----------------------------------------------------------------------------
-- F. EXPERIENCIA LABORAL
-- -----------------------------------------------------------------------------

CREATE TABLE dbo.Experiencia (
    ExperienciaId  INT NOT NULL IDENTITY(1,1),
    CurriculumId   INT NOT NULL,
    Empresa        NVARCHAR(150) NULL,
    Cargo          NVARCHAR(100) NULL,
    Sector         NVARCHAR(100) NULL,
    FechaInicio    DATE NULL,
    FechaFin       DATE NULL,
    TipoContrato   NVARCHAR(50) NULL,
    MotivoRetiro   NVARCHAR(255) NULL,
    Funciones      NVARCHAR(MAX) NULL,
    EsActual       BIT           NOT NULL DEFAULT 0,
    AdjuntoSoporte NVARCHAR(500) NULL,
    FechaRegistro  DATETIME2(0) NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT PK_Experiencia PRIMARY KEY CLUSTERED (ExperienciaId),
    CONSTRAINT FK_Experiencia_Curriculum FOREIGN KEY (CurriculumId) REFERENCES dbo.Curriculum (CurriculumId) ON DELETE CASCADE
);

CREATE NONCLUSTERED INDEX IX_Experiencia_CurriculumId ON dbo.Experiencia (CurriculumId);
CREATE NONCLUSTERED INDEX IX_Experiencia_Empresa_Curriculum ON dbo.Experiencia (Empresa, CurriculumId)
    INCLUDE (Cargo, Sector, FechaInicio);

-- Referencia.ExperienciaId (FK añadida después de crear Experiencia)
IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_Referencia_Experiencia')
    ALTER TABLE dbo.Referencia
    ADD CONSTRAINT FK_Referencia_Experiencia FOREIGN KEY (ExperienciaId) REFERENCES dbo.Experiencia (ExperienciaId) ON DELETE NO ACTION;

-- -----------------------------------------------------------------------------
-- G. FORMACIÓN ACADÉMICA
-- -----------------------------------------------------------------------------

CREATE TABLE dbo.Formacion (
    FormacionId    INT NOT NULL IDENTITY(1,1),
    CurriculumId   INT NOT NULL,
    Titulo         NVARCHAR(200) NULL,
    Institucion    NVARCHAR(200) NULL,
    Area           NVARCHAR(300) NULL,
    FechaInicio    DATE NULL,
    FechaFin       DATE NULL,
    TipoFormacion  NVARCHAR(50) NULL,
    Descripcion    NVARCHAR(MAX) NULL,
    AdjuntoSoporte NVARCHAR(500) NULL,
    FechaVigencia  DATE          NULL,
    DuracionHoras  INT           NULL,
    CONSTRAINT PK_Formacion PRIMARY KEY CLUSTERED (FormacionId),
    CONSTRAINT FK_Formacion_Curriculum FOREIGN KEY (CurriculumId) REFERENCES dbo.Curriculum (CurriculumId) ON DELETE CASCADE
);

CREATE NONCLUSTERED INDEX IX_Formacion_Titulo_Institucion ON dbo.Formacion (Titulo, Institucion, CurriculumId);

-- -----------------------------------------------------------------------------
-- H. HABILIDADES
-- -----------------------------------------------------------------------------

CREATE TABLE dbo.Habilidad (
    HabilidadId  INT NOT NULL IDENTITY(1,1),
    CurriculumId INT NOT NULL,
    Nombre       NVARCHAR(100) NOT NULL,
    Tipo         NVARCHAR(30)  NULL,
    Nivel        NVARCHAR(30)  NULL,
    Descripcion    NVARCHAR(500) NULL,
    -- Niveles CEFR para idiomas (sólo aplica cuando Tipo = 'Idioma')
    NivelLectura   NVARCHAR(5)   NULL,
    NivelEscritura NVARCHAR(5)   NULL,
    NivelEscucha   NVARCHAR(5)   NULL,
    NivelHabla     NVARCHAR(5)   NULL,
    CONSTRAINT PK_Habilidad PRIMARY KEY CLUSTERED (HabilidadId),
    CONSTRAINT FK_Habilidad_Curriculum FOREIGN KEY (CurriculumId) REFERENCES dbo.Curriculum (CurriculumId) ON DELETE CASCADE,
    CONSTRAINT CK_Habilidad_Tipo CHECK (Tipo IN (N'Tecnica', N'Blanda', N'Idioma', N'Otra')),
    -- Incluye Básico (con tilde): el front envía estos textos tal cual en español
    CONSTRAINT CK_Habilidad_Nivel CHECK (Nivel IN (N'Basico', N'Básico', N'Intermedio', N'Avanzado', N'Experto') OR Nivel IS NULL),
    CONSTRAINT CK_Habilidad_NivelLectura   CHECK (NivelLectura   IN (N'A1', N'A2', N'B1', N'B2', N'C1', N'C2') OR NivelLectura   IS NULL),
    CONSTRAINT CK_Habilidad_NivelEscritura CHECK (NivelEscritura IN (N'A1', N'A2', N'B1', N'B2', N'C1', N'C2') OR NivelEscritura IS NULL),
    CONSTRAINT CK_Habilidad_NivelEscucha   CHECK (NivelEscucha   IN (N'A1', N'A2', N'B1', N'B2', N'C1', N'C2') OR NivelEscucha   IS NULL),
    CONSTRAINT CK_Habilidad_NivelHabla     CHECK (NivelHabla     IN (N'A1', N'A2', N'B1', N'B2', N'C1', N'C2') OR NivelHabla     IS NULL)
);

CREATE NONCLUSTERED INDEX IX_Habilidad_CurriculumId ON dbo.Habilidad (CurriculumId);
CREATE NONCLUSTERED INDEX IX_Habilidad_Nombre_Curriculum ON dbo.Habilidad (Nombre, CurriculumId)
    INCLUDE (Tipo, Nivel);

-- -----------------------------------------------------------------------------
-- I. PROYECTOS
-- -----------------------------------------------------------------------------

CREATE TABLE dbo.Proyecto (
    ProyectoId        INT NOT NULL IDENTITY(1,1),
    CurriculumId      INT NOT NULL,
    NombreProyecto    NVARCHAR(200) NULL,
    Rol               NVARCHAR(100) NULL,
    EquipoTamano      INT NULL,
    DuracionMeses     INT NULL,
    StackTecnologico  NVARCHAR(500) NULL,
    Aporte            NVARCHAR(MAX) NULL,
    Logro             NVARCHAR(MAX) NULL,
    Desafio           NVARCHAR(MAX) NULL,
    CONSTRAINT PK_Proyecto PRIMARY KEY CLUSTERED (ProyectoId),
    CONSTRAINT FK_Proyecto_Curriculum FOREIGN KEY (CurriculumId) REFERENCES dbo.Curriculum (CurriculumId) ON DELETE CASCADE
);

-- -----------------------------------------------------------------------------
-- J. VISITANTES Y ALERTAS
-- -----------------------------------------------------------------------------

CREATE TABLE dbo.VisitanteContacto (
    VisitanteContactoId INT NOT NULL IDENTITY(1,1),
    CurriculumId       INT NOT NULL,
    Nombre             NVARCHAR(100) NULL,
    Correo              NVARCHAR(100) NOT NULL,
    Empresa             NVARCHAR(150) NULL,
    MotivoContacto     NVARCHAR(255) NULL,
    Asunto              NVARCHAR(255) NULL,
    ComoMeEncontraste   NVARCHAR(255) NULL,
    Mensaje             NVARCHAR(MAX) NULL,
    FechaContacto       DATETIME2(0) NOT NULL DEFAULT SYSDATETIME(),
    EsLeida             BIT           NOT NULL DEFAULT 0,
    CONSTRAINT PK_VisitanteContacto PRIMARY KEY CLUSTERED (VisitanteContactoId),
    CONSTRAINT FK_VisitanteContacto_Curriculum FOREIGN KEY (CurriculumId) REFERENCES dbo.Curriculum (CurriculumId) ON DELETE CASCADE
);

CREATE NONCLUSTERED INDEX IX_VisitanteContacto_CurriculumId ON dbo.VisitanteContacto (CurriculumId);
CREATE NONCLUSTERED INDEX IX_VisitanteContacto_FechaContacto ON dbo.VisitanteContacto (FechaContacto);

CREATE TABLE dbo.AlertaVisita (
    AlertaVisitaId INT NOT NULL IDENTITY(1,1),
    CurriculumId   INT NOT NULL,
    FechaVisita    DATETIME2(0) NOT NULL DEFAULT SYSDATETIME(),
    Origen         NVARCHAR(255) NULL,
    TipoVisita     NVARCHAR(20)  NULL,
    EsLeida        BIT           NOT NULL DEFAULT 0,
    Titulo         NVARCHAR(255) NULL,
    Descripcion    NVARCHAR(MAX) NULL,
    Ciudad         NVARCHAR(100) NULL,
    Pais           NVARCHAR(100) NULL,
    VisitanteAnonimoId NVARCHAR(36) NULL,
    VistasAcumuladas   INT        NOT NULL DEFAULT 1,
    VisitanteContactoId INT NULL,
    CONSTRAINT PK_AlertaVisita PRIMARY KEY CLUSTERED (AlertaVisitaId),
    CONSTRAINT FK_AlertaVisita_Curriculum FOREIGN KEY (CurriculumId) REFERENCES dbo.Curriculum (CurriculumId) ON DELETE CASCADE,
    CONSTRAINT FK_AlertaVisita_VisitanteContacto FOREIGN KEY (VisitanteContactoId) REFERENCES dbo.VisitanteContacto (VisitanteContactoId) ON DELETE NO ACTION,
    CONSTRAINT CK_AlertaVisita_TipoVisita CHECK (TipoVisita IN (N'Vista', N'Contacto', N'Descarga', N'Sistema'))
);

CREATE NONCLUSTERED INDEX IX_AlertaVisita_CurriculumId ON dbo.AlertaVisita (CurriculumId);
CREATE NONCLUSTERED INDEX IX_AlertaVisita_FechaVisita ON dbo.AlertaVisita (FechaVisita);
CREATE UNIQUE NONCLUSTERED INDEX UQ_AlertaVisita_Curriculum_Visitante_Vista
    ON dbo.AlertaVisita (CurriculumId, VisitanteAnonimoId)
    WHERE TipoVisita = N'Vista' AND VisitanteAnonimoId IS NOT NULL;
CREATE UNIQUE NONCLUSTERED INDEX UQ_AlertaVisita_Curriculum_Visitante_Descarga
    ON dbo.AlertaVisita (CurriculumId, VisitanteAnonimoId)
    WHERE TipoVisita = N'Descarga' AND VisitanteAnonimoId IS NOT NULL;
CREATE UNIQUE NONCLUSTERED INDEX UQ_AlertaVisita_VisitanteContacto_Contacto
    ON dbo.AlertaVisita (VisitanteContactoId)
    WHERE VisitanteContactoId IS NOT NULL AND TipoVisita = N'Contacto';

-- -----------------------------------------------------------------------------
-- K. CONFIGURACIÓN (Visibilidad de secciones)
-- -----------------------------------------------------------------------------

CREATE TABLE dbo.VisibilidadSeccion (
    VisibilidadSeccionId INT NOT NULL IDENTITY(1,1),
    CurriculumId         INT NOT NULL,
    NombreSeccion        NVARCHAR(100) NOT NULL,
    EsVisible            BIT NOT NULL DEFAULT 1,
    CONSTRAINT PK_VisibilidadSeccion PRIMARY KEY CLUSTERED (VisibilidadSeccionId),
    CONSTRAINT FK_VisibilidadSeccion_Curriculum FOREIGN KEY (CurriculumId) REFERENCES dbo.Curriculum (CurriculumId) ON DELETE CASCADE
);

CREATE UNIQUE NONCLUSTERED INDEX UQ_VisibilidadSeccion_CurriculumId_NombreSeccion
    ON dbo.VisibilidadSeccion (CurriculumId, NombreSeccion);

-- -----------------------------------------------------------------------------
-- L. ESTADÍSTICAS PÚBLICAS (tabla de resumen / puede sincronizarse con Curriculum)
-- -----------------------------------------------------------------------------

CREATE TABLE dbo.EstadisticasPublicas (
    EstadisticasId    INT NOT NULL IDENTITY(1,1),
    CurriculumId      INT NOT NULL,
    TotalVisitas      INT NOT NULL DEFAULT 0,
    TotalContactos    INT NOT NULL DEFAULT 0,
    UltimaVisita      DATETIME2(0) NULL,
    FechaActualizacion DATETIME2(0) NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT PK_EstadisticasPublicas PRIMARY KEY CLUSTERED (EstadisticasId),
    CONSTRAINT FK_EstadisticasPublicas_Curriculum FOREIGN KEY (CurriculumId) REFERENCES dbo.Curriculum (CurriculumId) ON DELETE CASCADE,
    CONSTRAINT UQ_EstadisticasPublicas_CurriculumId UNIQUE (CurriculumId)
);

-- -----------------------------------------------------------------------------
-- M. AUDITORÍA (administración y edición de CV)
-- -----------------------------------------------------------------------------

CREATE TABLE dbo.AuditoriaAdmin (
    AuditoriaAdminId INT NOT NULL IDENTITY(1,1),
    FechaUtc         DATETIME2(0) NOT NULL CONSTRAINT DF_AuditoriaAdmin_FechaUtc DEFAULT (SYSUTCDATETIME()),
    ActorUsuarioId   INT NULL,
    Accion           NVARCHAR(80)  NOT NULL,
    EntidadTipo      NVARCHAR(40)  NOT NULL,
    EntidadId        INT NULL,
    DetalleJson      NVARCHAR(MAX) NULL,
    CONSTRAINT PK_AuditoriaAdmin PRIMARY KEY CLUSTERED (AuditoriaAdminId),
    CONSTRAINT FK_AuditoriaAdmin_Usuario_Actor FOREIGN KEY (ActorUsuarioId)
        REFERENCES dbo.Usuario (UsuarioId) ON DELETE SET NULL
);

CREATE NONCLUSTERED INDEX IX_AuditoriaAdmin_FechaUtc ON dbo.AuditoriaAdmin (FechaUtc DESC);

CREATE TABLE dbo.AuditoriaCv (
    AuditoriaCvId    INT NOT NULL IDENTITY(1,1),
    FechaUtc         DATETIME2(0) NOT NULL CONSTRAINT DF_AuditoriaCv_FechaUtc DEFAULT (SYSUTCDATETIME()),
    ActorUsuarioId   INT NULL,
    CurriculumId     INT NOT NULL,
    Accion           NVARCHAR(80)  NOT NULL,
    EntidadTipo      NVARCHAR(40)  NOT NULL,
    EntidadId        INT NULL,
    DetalleJson      NVARCHAR(MAX) NULL,
    CONSTRAINT PK_AuditoriaCv PRIMARY KEY CLUSTERED (AuditoriaCvId),
    CONSTRAINT FK_AuditoriaCv_Usuario_Actor FOREIGN KEY (ActorUsuarioId)
        REFERENCES dbo.Usuario (UsuarioId) ON DELETE NO ACTION,
    CONSTRAINT FK_AuditoriaCv_Curriculum FOREIGN KEY (CurriculumId)
        REFERENCES dbo.Curriculum (CurriculumId) ON DELETE CASCADE
);

CREATE NONCLUSTERED INDEX IX_AuditoriaCv_CurriculumId ON dbo.AuditoriaCv (CurriculumId);
GO

-- -----------------------------------------------------------------------------
-- TRIGGERS DE SINCRONIZACIÓN DE CONTADORES (Cursos y Estadísticas)
-- -----------------------------------------------------------------------------
-- Trigger para mantener en sincronía el contador de contactos y la tabla
-- EstadisticasPublicas cada vez que se inserta/actualiza/elimina un registro
-- de VisitanteContacto.
CREATE TRIGGER dbo.trg_VisitanteContacto_SyncEstadisticas
ON dbo.VisitanteContacto
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @Now DATETIME2(0) = SYSDATETIME();

    DECLARE @Curriculos TABLE (CurriculumId INT PRIMARY KEY);
    DECLARE @ContactCounts TABLE (CurriculumId INT PRIMARY KEY, ContactCount INT NOT NULL);

    INSERT INTO @Curriculos (CurriculumId)
    SELECT DISTINCT CurriculumId FROM inserted
    UNION
    SELECT DISTINCT CurriculumId FROM deleted;

    INSERT INTO @ContactCounts (CurriculumId, ContactCount)
    SELECT CurriculumId, COUNT(*) AS ContactCount
    FROM dbo.VisitanteContacto
    WHERE CurriculumId IN (SELECT CurriculumId FROM @Curriculos)
    GROUP BY CurriculumId;

    UPDATE c
    SET ContadorContactos = ISNULL(cc.ContactCount, 0)
    FROM dbo.Curriculum c
    INNER JOIN @Curriculos ch ON c.CurriculumId = ch.CurriculumId
    LEFT JOIN @ContactCounts cc ON c.CurriculumId = cc.CurriculumId;

    UPDATE ep
    SET TotalContactos = ISNULL(cc.ContactCount, 0),
        FechaActualizacion = @Now
    FROM dbo.EstadisticasPublicas ep
    INNER JOIN @Curriculos ch ON ep.CurriculumId = ch.CurriculumId
    LEFT JOIN @ContactCounts cc ON ep.CurriculumId = cc.CurriculumId;

    INSERT INTO dbo.EstadisticasPublicas (CurriculumId, TotalVisitas, TotalContactos, UltimaVisita, FechaActualizacion)
    SELECT ch.CurriculumId, 0, ISNULL(cc.ContactCount, 0), NULL, @Now
    FROM @Curriculos ch
    LEFT JOIN dbo.EstadisticasPublicas ep ON ep.CurriculumId = ch.CurriculumId
    LEFT JOIN @ContactCounts cc ON cc.CurriculumId = ch.CurriculumId
    WHERE ep.CurriculumId IS NULL;
END;
GO

-- Trigger para mantener en sincronía el contador de visitas y la tabla
-- EstadisticasPublicas cada vez que se inserta/actualiza/elimina un registro
-- de AlertaVisita.
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

-- -----------------------------------------------------------------------------
-- VISTAS (resúmenes y combinaciones comunes para consultas frecuentes)
-- -----------------------------------------------------------------------------
-- Vista que mantiene EstadisticasPublicas alineada con Curriculum (opcional: usar en lugar de tabla o sincronizar por job/trigger)
IF OBJECT_ID(N'dbo.vw_EstadisticasDesdeCurriculum', N'V') IS NOT NULL
    DROP VIEW dbo.vw_EstadisticasDesdeCurriculum;
GO
CREATE VIEW dbo.vw_EstadisticasDesdeCurriculum AS
SELECT
    c.CurriculumId,
    c.ContadorVisitas AS TotalVisitas,
    c.ContadorContactos AS TotalContactos,
    c.FechaActualizacion AS UltimaVisita,
    c.FechaActualizacion AS FechaActualizacion
FROM dbo.Curriculum c;
GO

-- Vista de resumen de Curriculum con datos de usuario y estadísticas (un solo registro por curriculum)
IF OBJECT_ID(N'dbo.vw_CurriculumResumen', N'V') IS NOT NULL
    DROP VIEW dbo.vw_CurriculumResumen;
GO
CREATE VIEW dbo.vw_CurriculumResumen AS
SELECT
    c.CurriculumId,
    u.Email AS UsuarioEmail,
    c.UrlPublica,
    c.Estado AS CurriculumEstado,
    c.ContadorVisitas,
    c.ContadorContactos,
    ep.TotalVisitas,
    ep.TotalContactos,
    ep.UltimaVisita,
    ep.FechaActualizacion AS EstadisticasActualizacion
FROM dbo.Curriculum c
INNER JOIN dbo.Usuario u ON c.UsuarioId = u.UsuarioId
LEFT JOIN dbo.EstadisticasPublicas ep ON ep.CurriculumId = c.CurriculumId;
GO

-- Vista que exhibe información personal asociada a cada Curriculum (un perfil por curriculum)
IF OBJECT_ID(N'dbo.vw_CurriculumPersonales', N'V') IS NOT NULL
    DROP VIEW dbo.vw_CurriculumPersonales;
GO
CREATE VIEW dbo.vw_CurriculumPersonales AS
SELECT
    c.CurriculumId,
    u.Email AS UsuarioEmail,
    p.PrimerNombre,
    p.SegundoNombre,
    p.PrimerApellido,
    p.SegundoApellido,
    p.TelefonoFijo,
    p.Celular,
    p.Email AS EmailPersonal,
    p.Pais,
    p.Ciudad,
    p.Direccion
FROM dbo.Curriculum c
INNER JOIN dbo.Personales p ON p.CurriculumId = c.CurriculumId
INNER JOIN dbo.Usuario u ON c.UsuarioId = u.UsuarioId;
GO

-- Vista para reportes de visitas/contactos por Curriculum, incluye totales y última visita
IF OBJECT_ID(N'dbo.vw_VisitasYContactosPorCurriculum', N'V') IS NOT NULL
    DROP VIEW dbo.vw_VisitasYContactosPorCurriculum;
GO
CREATE VIEW dbo.vw_VisitasYContactosPorCurriculum AS
SELECT
    c.CurriculumId,
    c.UrlPublica,
    c.Estado,
    c.ContadorVisitas,
    c.ContadorContactos,
    ISNULL(ep.TotalVisitas, 0) AS TotalVisitasHistorico,
    ISNULL(ep.TotalContactos, 0) AS TotalContactosHistorico,
    ep.UltimaVisita
FROM dbo.Curriculum c
LEFT JOIN dbo.EstadisticasPublicas ep ON ep.CurriculumId = c.CurriculumId;

GO

PRINT N'Script 01_CreateSchema.sql ejecutado correctamente.';
GO
