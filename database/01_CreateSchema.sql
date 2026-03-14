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
USE [PortalCV];
GO
*/

-- =============================================================================
-- LIMPIEZA: Eliminar tablas en orden inverso de dependencias (para re-ejecutar)
-- =============================================================================

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
IF OBJECT_ID(N'dbo.Curriculum', N'U') IS NOT NULL              DROP TABLE dbo.Curriculum;
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
    FechaCreacion     DATETIME2(0)  NOT NULL DEFAULT SYSDATETIME(),
    FechaActualizacion DATETIME2(0) NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT PK_Curriculum PRIMARY KEY CLUSTERED (CurriculumId),
    CONSTRAINT FK_Curriculum_Usuario FOREIGN KEY (UsuarioId) REFERENCES dbo.Usuario (UsuarioId) ON DELETE CASCADE,
    CONSTRAINT UQ_Curriculum_UsuarioId UNIQUE (UsuarioId),
    CONSTRAINT UQ_Curriculum_UrlPublica UNIQUE (UrlPublica),
    CONSTRAINT CK_Curriculum_Estado CHECK (Estado IN (N'Borrador', N'Publicado', N'Oculto'))
);

CREATE NONCLUSTERED INDEX IX_Curriculum_UrlPublica ON dbo.Curriculum (UrlPublica);
CREATE NONCLUSTERED INDEX IX_Curriculum_Estado ON dbo.Curriculum (Estado);

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
    CONSTRAINT PK_Personales PRIMARY KEY CLUSTERED (PersonalesId),
    CONSTRAINT FK_Personales_Curriculum FOREIGN KEY (CurriculumId) REFERENCES dbo.Curriculum (CurriculumId) ON DELETE CASCADE,
    CONSTRAINT UQ_Personales_CurriculumId UNIQUE (CurriculumId)
);

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
    AspiracionSalarialPesos DECIMAL(18,2) NULL,
    AspiracionSalarialDolares DECIMAL(18,2) NULL,
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
    FechaRegistro  DATETIME2(0) NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT PK_Experiencia PRIMARY KEY CLUSTERED (ExperienciaId),
    CONSTRAINT FK_Experiencia_Curriculum FOREIGN KEY (CurriculumId) REFERENCES dbo.Curriculum (CurriculumId) ON DELETE CASCADE
);

CREATE NONCLUSTERED INDEX IX_Experiencia_CurriculumId ON dbo.Experiencia (CurriculumId);

-- Referencia.ExperienciaId (FK añadida después de crear Experiencia)
IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_Referencia_Experiencia')
    ALTER TABLE dbo.Referencia
    ADD CONSTRAINT FK_Referencia_Experiencia FOREIGN KEY (ExperienciaId) REFERENCES dbo.Experiencia (ExperienciaId) ON DELETE SET NULL;

-- -----------------------------------------------------------------------------
-- G. FORMACIÓN ACADÉMICA
-- -----------------------------------------------------------------------------

CREATE TABLE dbo.Formacion (
    FormacionId    INT NOT NULL IDENTITY(1,1),
    CurriculumId   INT NOT NULL,
    Titulo         NVARCHAR(200) NULL,
    Institucion    NVARCHAR(200) NULL,
    Area           NVARCHAR(100) NULL,
    FechaInicio    DATE NULL,
    FechaFin       DATE NULL,
    TipoFormacion  NVARCHAR(50) NULL,
    Descripcion    NVARCHAR(MAX) NULL,
    AdjuntoSoporte NVARCHAR(500) NULL,
    CONSTRAINT PK_Formacion PRIMARY KEY CLUSTERED (FormacionId),
    CONSTRAINT FK_Formacion_Curriculum FOREIGN KEY (CurriculumId) REFERENCES dbo.Curriculum (CurriculumId) ON DELETE CASCADE
);

-- -----------------------------------------------------------------------------
-- H. HABILIDADES
-- -----------------------------------------------------------------------------

CREATE TABLE dbo.Habilidad (
    HabilidadId  INT NOT NULL IDENTITY(1,1),
    CurriculumId INT NOT NULL,
    Nombre       NVARCHAR(100) NOT NULL,
    Tipo         NVARCHAR(30)  NULL,
    Nivel        NVARCHAR(30)  NULL,
    Descripcion  NVARCHAR(500) NULL,
    CONSTRAINT PK_Habilidad PRIMARY KEY CLUSTERED (HabilidadId),
    CONSTRAINT FK_Habilidad_Curriculum FOREIGN KEY (CurriculumId) REFERENCES dbo.Curriculum (CurriculumId) ON DELETE CASCADE,
    CONSTRAINT CK_Habilidad_Tipo CHECK (Tipo IN (N'Tecnica', N'Blanda', N'Idioma', N'Otra')),
    CONSTRAINT CK_Habilidad_Nivel CHECK (Nivel IN (N'Basico', N'Intermedio', N'Avanzado', N'Experto'))
);

CREATE NONCLUSTERED INDEX IX_Habilidad_CurriculumId ON dbo.Habilidad (CurriculumId);
CREATE NONCLUSTERED INDEX IX_Habilidad_Nombre ON dbo.Habilidad (Nombre);

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
    ComoMeEncontraste   NVARCHAR(255) NULL,
    Mensaje             NVARCHAR(MAX) NULL,
    FechaContacto       DATETIME2(0) NOT NULL DEFAULT SYSDATETIME(),
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
    CONSTRAINT PK_AlertaVisita PRIMARY KEY CLUSTERED (AlertaVisitaId),
    CONSTRAINT FK_AlertaVisita_Curriculum FOREIGN KEY (CurriculumId) REFERENCES dbo.Curriculum (CurriculumId) ON DELETE CASCADE,
    CONSTRAINT CK_AlertaVisita_TipoVisita CHECK (TipoVisita IN (N'SoloVista', N'ConContacto'))
);

CREATE NONCLUSTERED INDEX IX_AlertaVisita_CurriculumId ON dbo.AlertaVisita (CurriculumId);
CREATE NONCLUSTERED INDEX IX_AlertaVisita_FechaVisita ON dbo.AlertaVisita (FechaVisita);

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

-- Vista que mantiene EstadisticasPublicas alineada con Curriculum (opcional: usar en lugar de tabla o sincronizar por job/trigger)
-- CREATE OR ALTER VIEW dbo.vw_EstadisticasDesdeCurriculum AS
-- SELECT c.CurriculumId, c.ContadorVisitas AS TotalVisitas, c.ContadorContactos AS TotalContactos, c.FechaActualizacion AS UltimaVisita, c.FechaActualizacion
-- FROM dbo.Curriculum c;

GO

-- =============================================================================
-- DATOS INICIALES: Roles del sistema
-- =============================================================================

IF NOT EXISTS (SELECT 1 FROM dbo.Rol)
BEGIN
    SET IDENTITY_INSERT dbo.Rol ON;
    INSERT INTO dbo.Rol (RolId, NombreRol, Descripcion) VALUES
        (1, N'Visitante', N'Usuario no autenticado que consulta información pública'),
        (2, N'Publicador', N'Profesional dueño de un CV'),
        (3, N'Admin', N'Administrador del sistema');
    SET IDENTITY_INSERT dbo.Rol OFF;
END
GO

PRINT N'Script 01_CreateSchema.sql ejecutado correctamente.';
GO
