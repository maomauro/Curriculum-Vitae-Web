-- =============================================================================
-- Portal de Curriculum Vitae - Script de creacion de base de datos
-- MariaDB (10.6+ recomendado; requiere >= 10.2 por columnas generadas y CHECK)
-- Traducido desde scripts/manual/01_CreateSchema.sql (SQL Server), que sigue
-- siendo la fuente de verdad para Azure SQL. Ver MIGRACION_MARIADB.md para el
-- detalle de cada diferencia de dialecto resuelta en este archivo.
-- =============================================================================

-- Base de datos en minusculas a proposito: en Linux los nombres de base de
-- datos son sensibles a mayusculas/minusculas (a diferencia de SQL Server) --
-- usar minusculas evita el clasico problema de "Table 'PortalCV.usuario'
-- doesn't exist" cuando el contenedor corre sobre un filesystem case-sensitive.
CREATE DATABASE IF NOT EXISTS portalcv
    CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE portalcv;

-- =============================================================================
-- LIMPIEZA: DROP IF EXISTS en orden inverso de dependencias (para re-ejecutar)
-- =============================================================================

DROP VIEW IF EXISTS vw_VisitasYContactosPorCurriculum;
DROP VIEW IF EXISTS vw_CurriculumPersonales;
DROP VIEW IF EXISTS vw_CurriculumResumen;
DROP VIEW IF EXISTS vw_EstadisticasDesdeCurriculum;

DROP TABLE IF EXISTS UsuarioRol;
DROP TABLE IF EXISTS EstadisticasPublicas;
DROP TABLE IF EXISTS VisibilidadSeccion;
DROP TABLE IF EXISTS AlertaVisita;
DROP TABLE IF EXISTS VisitanteContacto;
DROP TABLE IF EXISTS RedSocial;
DROP TABLE IF EXISTS FamiliarContacto;
DROP TABLE IF EXISTS Referencia;
DROP TABLE IF EXISTS Proyecto;
DROP TABLE IF EXISTS Habilidad;
DROP TABLE IF EXISTS Formacion;
DROP TABLE IF EXISTS Experiencia;
DROP TABLE IF EXISTS Oferta;
DROP TABLE IF EXISTS CvGenerado;
DROP TABLE IF EXISTS Perfil;
DROP TABLE IF EXISTS Personales;
DROP TABLE IF EXISTS AuditoriaCv;
DROP TABLE IF EXISTS PromptIa;
DROP TABLE IF EXISTS ProveedorIa;
DROP TABLE IF EXISTS ConfiguracionCorreo;
DROP TABLE IF EXISTS Curriculum;
DROP TABLE IF EXISTS AuditoriaAdmin;
DROP TABLE IF EXISTS AuditoriaAuth;
DROP TABLE IF EXISTS Usuario;
DROP TABLE IF EXISTS Rol;

-- =============================================================================
-- ESQUEMA: Tablas en orden de dependencias (FK)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- A. SEGURIDAD Y USUARIOS
-- -----------------------------------------------------------------------------

CREATE TABLE Rol (
    RolId           INT NOT NULL AUTO_INCREMENT,
    NombreRol       VARCHAR(50)  NOT NULL,
    Descripcion     VARCHAR(255) NULL,
    CONSTRAINT PK_Rol PRIMARY KEY (RolId),
    CONSTRAINT UQ_Rol_NombreRol UNIQUE (NombreRol)
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE Usuario (
    UsuarioId       INT NOT NULL AUTO_INCREMENT,
    Email           VARCHAR(100) NOT NULL,
    PasswordHash    VARCHAR(255) NOT NULL,
    Estado          VARCHAR(20)  NOT NULL DEFAULT 'Activo',
    FechaRegistro   DATETIME NOT NULL DEFAULT (UTC_TIMESTAMP()),
    CONSTRAINT PK_Usuario PRIMARY KEY (UsuarioId),
    CONSTRAINT UQ_Usuario_Email UNIQUE (Email),
    CONSTRAINT CK_Usuario_Estado CHECK (Estado IN ('Activo', 'Inactivo', 'Bloqueado'))
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE UsuarioRol (
    UsuarioRolId    INT NOT NULL AUTO_INCREMENT,
    UsuarioId       INT NOT NULL,
    RolId           INT NOT NULL,
    CONSTRAINT PK_UsuarioRol PRIMARY KEY (UsuarioRolId),
    CONSTRAINT FK_UsuarioRol_Usuario FOREIGN KEY (UsuarioId) REFERENCES Usuario (UsuarioId) ON DELETE CASCADE,
    CONSTRAINT FK_UsuarioRol_Rol     FOREIGN KEY (RolId)     REFERENCES Rol (RolId) ON DELETE CASCADE,
    CONSTRAINT UQ_UsuarioRol_UsuarioId_RolId UNIQUE (UsuarioId, RolId)
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- B. CURRICULUM (agregado raiz)
-- -----------------------------------------------------------------------------

CREATE TABLE Curriculum (
    CurriculumId       INT NOT NULL AUTO_INCREMENT,
    UsuarioId          INT NOT NULL,
    UrlPublica         VARCHAR(255) NOT NULL,
    Estado             VARCHAR(20)  NOT NULL DEFAULT 'Borrador',
    ContadorVisitas    INT NOT NULL DEFAULT 0,
    ContadorContactos  INT NOT NULL DEFAULT 0,
    PlantillaCodigo    VARCHAR(32)  NOT NULL DEFAULT 'clasico',
    FechaCreacion      DATETIME NOT NULL DEFAULT (UTC_TIMESTAMP()),
    FechaActualizacion DATETIME NOT NULL DEFAULT (UTC_TIMESTAMP()) ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT PK_Curriculum PRIMARY KEY (CurriculumId),
    CONSTRAINT FK_Curriculum_Usuario FOREIGN KEY (UsuarioId) REFERENCES Usuario (UsuarioId) ON DELETE CASCADE,
    CONSTRAINT UQ_Curriculum_UsuarioId UNIQUE (UsuarioId),
    CONSTRAINT UQ_Curriculum_UrlPublica UNIQUE (UrlPublica),
    CONSTRAINT CK_Curriculum_Estado CHECK (Estado IN ('Borrador', 'Publicado', 'Oculto'))
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Nota: "ON UPDATE CURRENT_TIMESTAMP" en FechaActualizacion es una comodidad de
-- MariaDB sin equivalente exacto en el script SQL Server original (alli se
-- actualiza a mano en el service). Se deja para no romper nada si el backend
-- ya la actualiza explicitamente -- el ON UPDATE solo aplica si ninguna sentencia
-- toca esa columna; si el backend la fija, ese valor manda.

CREATE INDEX IX_Curriculum_UrlPublica ON Curriculum (UrlPublica);
CREATE INDEX IX_Curriculum_Estado_Visitas ON Curriculum (Estado, ContadorVisitas DESC, CurriculumId, UrlPublica);
-- La clausula INCLUDE (UrlPublica) de SQL Server no existe en MariaDB; se
-- agrega UrlPublica como columna final del indice para conservar el mismo
-- indice de cobertura (covering index) en las consultas que la necesitan.

-- -----------------------------------------------------------------------------
-- C. INFORMACION PERSONAL (Personales - 1 a 1 con Curriculum)
-- -----------------------------------------------------------------------------

CREATE TABLE Personales (
    PersonalesId         INT NOT NULL AUTO_INCREMENT,
    CurriculumId         INT NOT NULL,
    -- Identificacion
    TipoIdentificacion   VARCHAR(50)  NULL,
    NumeroDocumento      VARCHAR(50)  NULL,
    FechaExpedicion      DATE         NULL,
    LugarExpedicion      VARCHAR(100) NULL,
    LibretaMilitarNumero VARCHAR(50)  NULL,
    LibretaMilitarClase  VARCHAR(20)  NULL,
    PasaporteNumero      VARCHAR(50)  NULL,
    PasaporteVigencia    DATE         NULL,
    VisaNumero           VARCHAR(50)  NULL,
    VisaVigencia         DATE         NULL,
    VisaClase            VARCHAR(50)  NULL,
    -- Datos basicos
    PrimerNombre         VARCHAR(50)  NOT NULL,
    SegundoNombre        VARCHAR(50)  NULL,
    PrimerApellido       VARCHAR(50)  NOT NULL,
    SegundoApellido      VARCHAR(50)  NULL,
    FechaNacimiento      DATE         NULL,
    LugarNacimiento      VARCHAR(100) NULL,
    Genero               VARCHAR(20)  NULL,
    Nacionalidad         VARCHAR(50)  NULL,
    TipoSangre           VARCHAR(10)  NULL,
    EPS                  VARCHAR(100) NULL,
    Pencion              VARCHAR(100) NULL,
    Cesantias            VARCHAR(100) NULL,
    -- Contacto
    Email                VARCHAR(100) NULL,
    Celular              VARCHAR(20)  NULL,
    TelefonoFijo         VARCHAR(20)  NULL,
    -- Residencia
    Pais                 VARCHAR(50)  NULL,
    Departamento         VARCHAR(50)  NULL,
    Ciudad               VARCHAR(50)  NULL,
    Barrio               VARCHAR(100) NULL,
    CodigoPostal         VARCHAR(20)  NULL,
    Direccion            VARCHAR(255) NULL,
    TipoResidencia       VARCHAR(50)  NULL,
    FotoUrl              VARCHAR(500) NULL,
    FotoBytes            LONGBLOB     NULL,
    FotoContentType      VARCHAR(100) NULL,
    CONSTRAINT PK_Personales PRIMARY KEY (PersonalesId),
    CONSTRAINT FK_Personales_Curriculum FOREIGN KEY (CurriculumId) REFERENCES Curriculum (CurriculumId) ON DELETE CASCADE,
    CONSTRAINT UQ_Personales_CurriculumId UNIQUE (CurriculumId)
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX IX_Personales_Ciudad ON Personales (Ciudad, CurriculumId, PrimerNombre, PrimerApellido);

-- -----------------------------------------------------------------------------
-- D. CONTACTOS Y REDES
-- -----------------------------------------------------------------------------

CREATE TABLE Referencia (
    ReferenciaId   INT NOT NULL AUTO_INCREMENT,
    CurriculumId   INT NOT NULL,
    TipoReferencia VARCHAR(20)  NOT NULL,
    ExperienciaId  INT          NULL,
    Nombre         VARCHAR(100) NOT NULL,
    Apellido       VARCHAR(100) NULL,
    Email          VARCHAR(100) NULL,
    Telefono       VARCHAR(20)  NULL,
    Parentesco     VARCHAR(50)  NULL,
    -- Campos para referencia laboral
    Cargo          VARCHAR(100) NULL,
    Empresa        VARCHAR(150) NULL,
    Relacion       VARCHAR(100) NULL,
    Observaciones  LONGTEXT     NULL,
    AdjuntoSoporte VARCHAR(500) NULL,
    MostrarEnCv    TINYINT(1)   NOT NULL DEFAULT 1,
    FechaRegistro  DATETIME     NOT NULL DEFAULT (UTC_TIMESTAMP()),
    CONSTRAINT PK_Referencia PRIMARY KEY (ReferenciaId),
    CONSTRAINT FK_Referencia_Curriculum FOREIGN KEY (CurriculumId) REFERENCES Curriculum (CurriculumId) ON DELETE CASCADE,
    CONSTRAINT CK_Referencia_TipoReferencia CHECK (TipoReferencia IN ('Laboral', 'Personal'))
    -- FK a Experiencia se agrega despues de crear Experiencia
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX IX_Referencia_CurriculumId ON Referencia (CurriculumId);
CREATE INDEX IX_Referencia_TipoReferencia ON Referencia (TipoReferencia);

CREATE TABLE FamiliarContacto (
    FamiliarId          INT NOT NULL AUTO_INCREMENT,
    CurriculumId        INT NOT NULL,
    Parentesco          VARCHAR(50)  NULL,
    Nombres             VARCHAR(100) NULL,
    Apellidos           VARCHAR(100) NULL,
    Email               VARCHAR(100) NULL,
    Telefono            VARCHAR(20)  NULL,
    EsContactoPrincipal TINYINT(1)   NOT NULL DEFAULT 0,
    CONSTRAINT PK_FamiliarContacto PRIMARY KEY (FamiliarId),
    CONSTRAINT FK_FamiliarContacto_Curriculum FOREIGN KEY (CurriculumId) REFERENCES Curriculum (CurriculumId) ON DELETE CASCADE
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE RedSocial (
    RedSocialId     INT NOT NULL AUTO_INCREMENT,
    CurriculumId    INT NOT NULL,
    NombreRed       VARCHAR(50)  NOT NULL,
    LinkPublico     VARCHAR(500) NULL,
    UsuarioContacto VARCHAR(100) NULL,
    MostrarEnCv     TINYINT(1)   NOT NULL DEFAULT 1,
    CONSTRAINT PK_RedSocial PRIMARY KEY (RedSocialId),
    CONSTRAINT FK_RedSocial_Curriculum FOREIGN KEY (CurriculumId) REFERENCES Curriculum (CurriculumId) ON DELETE CASCADE
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- E. PERFIL PROFESIONAL
-- -----------------------------------------------------------------------------

CREATE TABLE Perfil (
    PerfilId                  INT NOT NULL AUTO_INCREMENT,
    CurriculumId              INT NOT NULL,
    NombrePerfil              VARCHAR(100)   NULL,
    DescripcionPerfil         LONGTEXT       NULL,
    ExperienciaPerfilAnios    DECIMAL(5,2)   NULL,
    AspiracionSalarialPesos   DECIMAL(18,2)  NULL,
    AspiracionSalarialDolares DECIMAL(18,2)  NULL,
    EsActivo                  TINYINT(1)     NOT NULL DEFAULT 1,
    MostrarExperienciaPerfil  TINYINT(1)     NOT NULL DEFAULT 1,
    MostrarAspiracionSalarial TINYINT(1)     NOT NULL DEFAULT 1,
    CONSTRAINT PK_Perfil PRIMARY KEY (PerfilId),
    CONSTRAINT FK_Perfil_Curriculum FOREIGN KEY (CurriculumId) REFERENCES Curriculum (CurriculumId) ON DELETE CASCADE
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- E1B. CV GENERADO -- contenido condensado por IA para "Mi CV", uno por Perfil
-- (regenerar reemplaza el contenido en vez de crear una fila nueva)
-- -----------------------------------------------------------------------------

CREATE TABLE CvGenerado (
    CvGeneradoId     INT NOT NULL AUTO_INCREMENT,
    CurriculumId     INT NOT NULL,
    PerfilId         INT NOT NULL,
    ContenidoJson    LONGTEXT NOT NULL,
    PromptPorDefecto TINYINT(1) NOT NULL DEFAULT 0,
    FechaGeneracion  DATETIME NOT NULL DEFAULT UTC_TIMESTAMP(),
    CONSTRAINT PK_CvGenerado PRIMARY KEY (CvGeneradoId),
    CONSTRAINT FK_CvGenerado_Curriculum FOREIGN KEY (CurriculumId) REFERENCES Curriculum (CurriculumId) ON DELETE CASCADE,
    -- NoAction (no Cascade): Curriculum->Perfil ya cascadea; ver CvGeneradoConfiguration.cs
    CONSTRAINT FK_CvGenerado_Perfil FOREIGN KEY (PerfilId) REFERENCES Perfil (PerfilId) ON DELETE NO ACTION,
    CONSTRAINT UQ_CvGenerado_PerfilId UNIQUE (PerfilId)
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX IX_CvGenerado_CurriculumId ON CvGenerado (CurriculumId);

-- -----------------------------------------------------------------------------
-- E2. OFERTAS ANALIZADAS (IA) -- historial de ofertas laborales analizadas
-- -----------------------------------------------------------------------------

CREATE TABLE Oferta (
    OfertaId             INT NOT NULL AUTO_INCREMENT,
    CurriculumId         INT NOT NULL,
    Cargo                VARCHAR(150)  NOT NULL,
    Empresa              VARCHAR(150)  NOT NULL,
    Descripcion          LONGTEXT      NULL,
    CorreoReclutador     VARCHAR(150)  NULL,
    NombreReclutador     VARCHAR(150)  NULL,
    Modalidad            VARCHAR(150)  NULL,
    TipoContrato         VARCHAR(100)  NULL,
    Moneda               VARCHAR(20)   NULL,
    Duracion             VARCHAR(150)  NULL,
    Horario              VARCHAR(100)  NULL,
    ExperienciaRequerida VARCHAR(100)  NULL,
    StackTecnologico     LONGTEXT      NULL,
    NivelIdioma          VARCHAR(100)  NULL,
    TextoOriginal        LONGTEXT      NOT NULL,
    OrigenEntrada        VARCHAR(20)   NOT NULL,
    Estado               VARCHAR(20)   NOT NULL,
    PerfilId             INT           NULL,
    FechaAnalisis        DATETIME      NOT NULL DEFAULT (UTC_TIMESTAMP()),
    FechaEnvioCorreo     DATETIME      NULL,
    CONSTRAINT PK_Oferta PRIMARY KEY (OfertaId),
    CONSTRAINT FK_Oferta_Curriculum FOREIGN KEY (CurriculumId) REFERENCES Curriculum (CurriculumId) ON DELETE CASCADE,
    CONSTRAINT FK_Oferta_Perfil FOREIGN KEY (PerfilId) REFERENCES Perfil (PerfilId) ON DELETE NO ACTION,
    CONSTRAINT CK_Oferta_OrigenEntrada CHECK (OrigenEntrada IN ('texto', 'imagen', 'ambos')),
    CONSTRAINT CK_Oferta_Estado CHECK (Estado IN ('Analizada', 'PerfilAsignado', 'EnviadaPorCorreo'))
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX IX_Oferta_CurriculumId ON Oferta (CurriculumId);

-- -----------------------------------------------------------------------------
-- F. EXPERIENCIA LABORAL
-- -----------------------------------------------------------------------------

CREATE TABLE Experiencia (
    ExperienciaId             INT NOT NULL AUTO_INCREMENT,
    CurriculumId              INT NOT NULL,
    Empresa                   VARCHAR(150) NULL,
    Cargo                     VARCHAR(100) NULL,
    Sector                    VARCHAR(100) NULL,
    FechaInicio               DATE NULL,
    FechaFin                  DATE NULL,
    TipoContrato              VARCHAR(50) NULL,
    MotivoRetiro              VARCHAR(255) NULL,
    Funciones                 LONGTEXT NULL,
    EsActual                  TINYINT(1) NOT NULL DEFAULT 0,
    MostrarEnCv               TINYINT(1) NOT NULL DEFAULT 1,
    AdjuntoSoporte            VARCHAR(500) NULL,
    AdjuntoSoporteBytes       LONGBLOB NULL,
    AdjuntoSoporteContentType VARCHAR(100) NULL,
    FechaRegistro             DATETIME NOT NULL DEFAULT (UTC_TIMESTAMP()),
    CONSTRAINT PK_Experiencia PRIMARY KEY (ExperienciaId),
    CONSTRAINT FK_Experiencia_Curriculum FOREIGN KEY (CurriculumId) REFERENCES Curriculum (CurriculumId) ON DELETE CASCADE
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX IX_Experiencia_CurriculumId ON Experiencia (CurriculumId);
CREATE INDEX IX_Experiencia_Empresa_Curriculum ON Experiencia (Empresa, CurriculumId, Cargo, Sector, FechaInicio);

-- Referencia.ExperienciaId (FK anadida despues de crear Experiencia). El
-- patron "IF NOT EXISTS (SELECT ... sys.foreign_keys ...)" del script SQL
-- Server no hace falta aca: como todo el script recrea las tablas desde cero
-- (DROP TABLE IF EXISTS de arriba), este ALTER siempre corre sobre una tabla
-- recien creada sin la FK todavia.
ALTER TABLE Referencia
    ADD CONSTRAINT FK_Referencia_Experiencia FOREIGN KEY (ExperienciaId) REFERENCES Experiencia (ExperienciaId) ON DELETE NO ACTION;

-- -----------------------------------------------------------------------------
-- G. FORMACION ACADEMICA
-- -----------------------------------------------------------------------------

CREATE TABLE Formacion (
    FormacionId               INT NOT NULL AUTO_INCREMENT,
    CurriculumId              INT NOT NULL,
    Titulo                    VARCHAR(200) NULL,
    Institucion               VARCHAR(200) NULL,
    Area                      VARCHAR(300) NULL,
    FechaInicio               DATE NULL,
    FechaFin                  DATE NULL,
    TipoFormacion             VARCHAR(50) NULL,
    Descripcion               LONGTEXT NULL,
    AdjuntoSoporte            VARCHAR(500) NULL,
    AdjuntoSoporteBytes       LONGBLOB NULL,
    AdjuntoSoporteContentType VARCHAR(100) NULL,
    FechaVigencia             DATE NULL,
    DuracionHoras             INT NULL,
    MostrarEnCv               TINYINT(1) NOT NULL DEFAULT 1,
    CONSTRAINT PK_Formacion PRIMARY KEY (FormacionId),
    CONSTRAINT FK_Formacion_Curriculum FOREIGN KEY (CurriculumId) REFERENCES Curriculum (CurriculumId) ON DELETE CASCADE
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX IX_Formacion_Titulo_Institucion ON Formacion (Titulo, Institucion, CurriculumId);

-- -----------------------------------------------------------------------------
-- H. HABILIDADES
-- -----------------------------------------------------------------------------

CREATE TABLE Habilidad (
    HabilidadId    INT NOT NULL AUTO_INCREMENT,
    CurriculumId   INT NOT NULL,
    Nombre         VARCHAR(100) NOT NULL,
    Tipo           VARCHAR(30)  NULL,
    Nivel          VARCHAR(30)  NULL,
    Descripcion    VARCHAR(500) NULL,
    -- Niveles CEFR para idiomas (solo aplica cuando Tipo = 'Idioma')
    NivelLectura   VARCHAR(5)   NULL,
    NivelEscritura VARCHAR(5)   NULL,
    NivelEscucha   VARCHAR(5)   NULL,
    NivelHabla     VARCHAR(5)   NULL,
    MostrarEnCv    TINYINT(1)   NOT NULL DEFAULT 1,
    CONSTRAINT PK_Habilidad PRIMARY KEY (HabilidadId),
    CONSTRAINT FK_Habilidad_Curriculum FOREIGN KEY (CurriculumId) REFERENCES Curriculum (CurriculumId) ON DELETE CASCADE,
    CONSTRAINT CK_Habilidad_Tipo CHECK (Tipo IN ('Tecnica', 'Blanda', 'Idioma', 'Otra')),
    -- Incluye "Basico" con y sin tilde: el front envia estos textos tal cual en espanol
    CONSTRAINT CK_Habilidad_Nivel CHECK (Nivel IN ('Basico', 'Básico', 'Intermedio', 'Avanzado', 'Experto') OR Nivel IS NULL),
    CONSTRAINT CK_Habilidad_NivelLectura   CHECK (NivelLectura   IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2') OR NivelLectura   IS NULL),
    CONSTRAINT CK_Habilidad_NivelEscritura CHECK (NivelEscritura IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2') OR NivelEscritura IS NULL),
    CONSTRAINT CK_Habilidad_NivelEscucha   CHECK (NivelEscucha   IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2') OR NivelEscucha   IS NULL),
    CONSTRAINT CK_Habilidad_NivelHabla     CHECK (NivelHabla     IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2') OR NivelHabla     IS NULL)
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX IX_Habilidad_CurriculumId ON Habilidad (CurriculumId);
CREATE INDEX IX_Habilidad_Nombre_Curriculum ON Habilidad (Nombre, CurriculumId, Tipo, Nivel);

-- -----------------------------------------------------------------------------
-- I. PROYECTOS
-- -----------------------------------------------------------------------------

CREATE TABLE Proyecto (
    ProyectoId       INT NOT NULL AUTO_INCREMENT,
    CurriculumId     INT NOT NULL,
    NombreProyecto   VARCHAR(200) NULL,
    Rol              VARCHAR(100) NULL,
    EquipoTamano     INT NULL,
    DuracionMeses    INT NULL,
    StackTecnologico VARCHAR(500) NULL,
    Aporte           LONGTEXT NULL,
    Logro            LONGTEXT NULL,
    Desafio          LONGTEXT NULL,
    MostrarEnCv      TINYINT(1) NOT NULL DEFAULT 1,
    CONSTRAINT PK_Proyecto PRIMARY KEY (ProyectoId),
    CONSTRAINT FK_Proyecto_Curriculum FOREIGN KEY (CurriculumId) REFERENCES Curriculum (CurriculumId) ON DELETE CASCADE
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- J. VISITANTES Y ALERTAS
-- -----------------------------------------------------------------------------

CREATE TABLE VisitanteContacto (
    VisitanteContactoId INT NOT NULL AUTO_INCREMENT,
    CurriculumId        INT NOT NULL,
    Nombre              VARCHAR(100) NULL,
    Correo              VARCHAR(100) NOT NULL,
    Empresa             VARCHAR(150) NULL,
    MotivoContacto      VARCHAR(255) NULL,
    Asunto              VARCHAR(255) NULL,
    ComoMeEncontraste   VARCHAR(255) NULL,
    Mensaje             LONGTEXT NULL,
    FechaContacto       DATETIME NOT NULL DEFAULT (UTC_TIMESTAMP()),
    EsLeida             TINYINT(1) NOT NULL DEFAULT 0,
    CONSTRAINT PK_VisitanteContacto PRIMARY KEY (VisitanteContactoId),
    CONSTRAINT FK_VisitanteContacto_Curriculum FOREIGN KEY (CurriculumId) REFERENCES Curriculum (CurriculumId) ON DELETE CASCADE
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX IX_VisitanteContacto_CurriculumId ON VisitanteContacto (CurriculumId);
CREATE INDEX IX_VisitanteContacto_FechaContacto ON VisitanteContacto (FechaContacto);

CREATE TABLE AlertaVisita (
    AlertaVisitaId      INT NOT NULL AUTO_INCREMENT,
    CurriculumId        INT NOT NULL,
    FechaVisita         DATETIME NOT NULL DEFAULT (UTC_TIMESTAMP()),
    Origen              VARCHAR(255) NULL,
    TipoVisita          VARCHAR(20)  NULL,
    EsLeida             TINYINT(1)   NOT NULL DEFAULT 0,
    Titulo              VARCHAR(255) NULL,
    Descripcion         LONGTEXT NULL,
    Ciudad              VARCHAR(100) NULL,
    Pais                VARCHAR(100) NULL,
    VisitanteAnonimoId  VARCHAR(36)  NULL,
    VistasAcumuladas    INT NOT NULL DEFAULT 1,
    VisitanteContactoId INT NULL,
    -- Las 3 columnas GENERATED de aca abajo emulan los indices unicos
    -- filtrados (WHERE ...) de SQL Server, que MariaDB no soporta: cada una
    -- vale NULL salvo que se cumpla la condicion original, y como MariaDB
    -- permite multiples NULL en un indice UNIQUE, el efecto es identico.
    VisitanteAnonimoIdSiVista    VARCHAR(36) GENERATED ALWAYS AS (
        CASE WHEN TipoVisita = 'Vista' AND VisitanteAnonimoId IS NOT NULL THEN VisitanteAnonimoId ELSE NULL END
    ) VIRTUAL,
    VisitanteAnonimoIdSiDescarga VARCHAR(36) GENERATED ALWAYS AS (
        CASE WHEN TipoVisita = 'Descarga' AND VisitanteAnonimoId IS NOT NULL THEN VisitanteAnonimoId ELSE NULL END
    ) VIRTUAL,
    VisitanteContactoIdSiContacto INT GENERATED ALWAYS AS (
        CASE WHEN TipoVisita = 'Contacto' AND VisitanteContactoId IS NOT NULL THEN VisitanteContactoId ELSE NULL END
    ) VIRTUAL,
    CONSTRAINT PK_AlertaVisita PRIMARY KEY (AlertaVisitaId),
    CONSTRAINT FK_AlertaVisita_Curriculum FOREIGN KEY (CurriculumId) REFERENCES Curriculum (CurriculumId) ON DELETE CASCADE,
    CONSTRAINT FK_AlertaVisita_VisitanteContacto FOREIGN KEY (VisitanteContactoId) REFERENCES VisitanteContacto (VisitanteContactoId) ON DELETE NO ACTION,
    CONSTRAINT CK_AlertaVisita_TipoVisita CHECK (TipoVisita IN ('Vista', 'Contacto', 'Descarga', 'Sistema')),
    CONSTRAINT UQ_AlertaVisita_Curriculum_Visitante_Vista    UNIQUE (CurriculumId, VisitanteAnonimoIdSiVista),
    CONSTRAINT UQ_AlertaVisita_Curriculum_Visitante_Descarga UNIQUE (CurriculumId, VisitanteAnonimoIdSiDescarga),
    CONSTRAINT UQ_AlertaVisita_VisitanteContacto_Contacto    UNIQUE (VisitanteContactoIdSiContacto)
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX IX_AlertaVisita_CurriculumId ON AlertaVisita (CurriculumId);
CREATE INDEX IX_AlertaVisita_FechaVisita ON AlertaVisita (FechaVisita);

-- -----------------------------------------------------------------------------
-- K. CONFIGURACION (Visibilidad de secciones)
-- -----------------------------------------------------------------------------

CREATE TABLE VisibilidadSeccion (
    VisibilidadSeccionId INT NOT NULL AUTO_INCREMENT,
    CurriculumId         INT NOT NULL,
    NombreSeccion        VARCHAR(100) NOT NULL,
    EsVisible            TINYINT(1) NOT NULL DEFAULT 1,
    CONSTRAINT PK_VisibilidadSeccion PRIMARY KEY (VisibilidadSeccionId),
    CONSTRAINT FK_VisibilidadSeccion_Curriculum FOREIGN KEY (CurriculumId) REFERENCES Curriculum (CurriculumId) ON DELETE CASCADE,
    CONSTRAINT UQ_VisibilidadSeccion_CurriculumId_NombreSeccion UNIQUE (CurriculumId, NombreSeccion)
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- L. ESTADISTICAS PUBLICAS (tabla de resumen / se sincroniza via triggers)
-- -----------------------------------------------------------------------------

CREATE TABLE EstadisticasPublicas (
    EstadisticasId     INT NOT NULL AUTO_INCREMENT,
    CurriculumId       INT NOT NULL,
    TotalVisitas       INT NOT NULL DEFAULT 0,
    TotalContactos     INT NOT NULL DEFAULT 0,
    UltimaVisita       DATETIME NULL,
    FechaActualizacion DATETIME NOT NULL DEFAULT (UTC_TIMESTAMP()),
    CONSTRAINT PK_EstadisticasPublicas PRIMARY KEY (EstadisticasId),
    CONSTRAINT FK_EstadisticasPublicas_Curriculum FOREIGN KEY (CurriculumId) REFERENCES Curriculum (CurriculumId) ON DELETE CASCADE,
    CONSTRAINT UQ_EstadisticasPublicas_CurriculumId UNIQUE (CurriculumId)
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- M. AUDITORIA (administracion y edicion de CV)
-- -----------------------------------------------------------------------------

CREATE TABLE AuditoriaAdmin (
    AuditoriaAdminId INT NOT NULL AUTO_INCREMENT,
    FechaUtc         DATETIME NOT NULL DEFAULT (UTC_TIMESTAMP()),
    ActorUsuarioId   INT NULL,
    Accion           VARCHAR(80)  NOT NULL,
    EntidadTipo      VARCHAR(40)  NOT NULL,
    EntidadId        INT NULL,
    DetalleJson      LONGTEXT NULL,
    CONSTRAINT PK_AuditoriaAdmin PRIMARY KEY (AuditoriaAdminId),
    CONSTRAINT FK_AuditoriaAdmin_Usuario_Actor FOREIGN KEY (ActorUsuarioId) REFERENCES Usuario (UsuarioId) ON DELETE SET NULL
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX IX_AuditoriaAdmin_FechaUtc ON AuditoriaAdmin (FechaUtc DESC);

CREATE TABLE AuditoriaAuth (
    AuditoriaAuthId INT NOT NULL AUTO_INCREMENT,
    FechaUtc        DATETIME NOT NULL DEFAULT (UTC_TIMESTAMP()),
    ActorUsuarioId  INT NULL,
    Accion          VARCHAR(80)  NOT NULL,
    Email           VARCHAR(256) NOT NULL,
    DetalleJson     LONGTEXT NULL,
    IpOrigen        VARCHAR(45) NULL,
    CONSTRAINT PK_AuditoriaAuth PRIMARY KEY (AuditoriaAuthId),
    CONSTRAINT FK_AuditoriaAuth_Usuario_Actor FOREIGN KEY (ActorUsuarioId) REFERENCES Usuario (UsuarioId) ON DELETE SET NULL
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX IX_AuditoriaAuth_FechaUtc ON AuditoriaAuth (FechaUtc DESC);

CREATE TABLE AuditoriaCv (
    AuditoriaCvId  INT NOT NULL AUTO_INCREMENT,
    FechaUtc       DATETIME NOT NULL DEFAULT (UTC_TIMESTAMP()),
    ActorUsuarioId INT NULL,
    CurriculumId   INT NOT NULL,
    Accion         VARCHAR(80)  NOT NULL,
    EntidadTipo    VARCHAR(40)  NOT NULL,
    EntidadId      INT NULL,
    DetalleJson    LONGTEXT NULL,
    CONSTRAINT PK_AuditoriaCv PRIMARY KEY (AuditoriaCvId),
    CONSTRAINT FK_AuditoriaCv_Usuario_Actor FOREIGN KEY (ActorUsuarioId) REFERENCES Usuario (UsuarioId) ON DELETE NO ACTION,
    CONSTRAINT FK_AuditoriaCv_Curriculum FOREIGN KEY (CurriculumId) REFERENCES Curriculum (CurriculumId) ON DELETE CASCADE
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX IX_AuditoriaCv_CurriculumId ON AuditoriaCv (CurriculumId);

CREATE TABLE PromptIa (
    PromptIaId              INT NOT NULL AUTO_INCREMENT,
    CurriculumId            INT NOT NULL,
    Codigo                  VARCHAR(50)  NOT NULL,
    Nombre                  VARCHAR(150) NOT NULL,
    Descripcion             VARCHAR(500) NULL,

    -- Estructura del prompt (anatomia): cada seccion es una columna propia
    RolContexto             LONGTEXT NOT NULL,
    Tarea                   LONGTEXT NOT NULL,
    Reglas                  LONGTEXT NULL,
    FormatoSalida           LONGTEXT NOT NULL,
    Ejemplos                LONGTEXT NULL,

    -- Ensamblado por la aplicacion a partir de las 5 columnas de arriba (nunca se edita a mano)
    Contenido               LONGTEXT NOT NULL,

    Version                 INT NOT NULL DEFAULT 1,
    EsActivo                TINYINT(1) NOT NULL DEFAULT 1,
    FechaCreacion           DATETIME NOT NULL DEFAULT (UTC_TIMESTAMP()),
    ActualizadoPorUsuarioId INT NULL,

    -- Emula UQ_PromptIa_Curriculum_Codigo_Activo (WHERE EsActivo = 1) de SQL Server
    CodigoSiActivo          VARCHAR(50) GENERATED ALWAYS AS (
        CASE WHEN EsActivo = 1 THEN Codigo ELSE NULL END
    ) VIRTUAL,

    CONSTRAINT PK_PromptIa PRIMARY KEY (PromptIaId),
    CONSTRAINT FK_PromptIa_Curriculum FOREIGN KEY (CurriculumId) REFERENCES Curriculum (CurriculumId) ON DELETE CASCADE,
    CONSTRAINT FK_PromptIa_Usuario_Actualizo FOREIGN KEY (ActualizadoPorUsuarioId) REFERENCES Usuario (UsuarioId) ON DELETE NO ACTION,
    CONSTRAINT UQ_PromptIa_Curriculum_Codigo_Activo UNIQUE (CurriculumId, CodigoSiActivo),
    -- Evita duplicar el numero de version dentro de un mismo (CurriculumId, Codigo)
    CONSTRAINT UQ_PromptIa_Curriculum_Codigo_Version UNIQUE (CurriculumId, Codigo, Version)
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Historial completo de un (CurriculumId, Codigo)
CREATE INDEX IX_PromptIa_Curriculum_Codigo ON PromptIa (CurriculumId, Codigo);

-- Conexiones con proveedores de IA propias de cada CV (self-service): un CV puede
-- guardar varias (Claude, OpenAI, Gemini, Ollama/self-hosted, otro), con exactamente
-- una activa a la vez (indice unico via columna generada, mismo patron que
-- UQ_PromptIa_Curriculum_Codigo_Activo). La clave se guarda cifrada (AES-256-GCM, ver
-- AesGcmApiKeyCipher) y nunca se devuelve al front-end; es opcional porque Ollama local
-- normalmente no la requiere. Endpoint es obligatorio solo para proveedores self-hosted.
-- Conexion de IA GLOBAL para toda la plataforma (una activa a la vez),
-- administrada exclusivamente por el rol Admin -- no pertenece a ningun CV.
CREATE TABLE ProveedorIa (
    ProveedorIaId      INT NOT NULL AUTO_INCREMENT,
    Proveedor          VARCHAR(20)  NOT NULL,
    Nombre             VARCHAR(100) NULL,
    Modelo             VARCHAR(100) NULL,
    Endpoint           VARCHAR(500) NULL,
    ApiKeyCifrada      LONGTEXT NULL,
    EsActivo           TINYINT(1) NOT NULL DEFAULT 0,
    FechaCreacion      DATETIME NOT NULL DEFAULT (UTC_TIMESTAMP()),
    FechaActualizacion DATETIME NOT NULL DEFAULT (UTC_TIMESTAMP()) ON UPDATE CURRENT_TIMESTAMP,
    -- Emula UQ_ProveedorIa_Activo (WHERE EsActivo = 1) de SQL Server: MariaDB no
    -- soporta indices unicos filtrados nativos, pero si permite multiples NULL en
    -- un indice unico, asi que solo una fila puede tener EsActivoUnico = 1.
    EsActivoUnico TINYINT GENERATED ALWAYS AS (
        CASE WHEN EsActivo = 1 THEN 1 ELSE NULL END
    ) VIRTUAL,
    CONSTRAINT PK_ProveedorIa PRIMARY KEY (ProveedorIaId),
    CONSTRAINT CK_ProveedorIa_Proveedor CHECK (Proveedor IN ('claude', 'openai', 'gemini', 'groq', 'ollama', 'otro')),
    CONSTRAINT UQ_ProveedorIa_Activo UNIQUE (EsActivoUnico)
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Configuracion SMTP para enviar correos a reclutadores (Analizar Oferta -> Enviar
-- correo). Una por CV -- el remitente/login SMTP siempre es Personales.Email, no se
-- guarda un usuario aparte. La contrasena se cifra igual que ApiKeyCifrada (AES-256-GCM).
CREATE TABLE ConfiguracionCorreo (
    ConfiguracionCorreoId INT NOT NULL AUTO_INCREMENT,
    CurriculumId          INT NOT NULL,
    Host                  VARCHAR(200) NOT NULL DEFAULT 'smtp.gmail.com',
    Puerto                INT NOT NULL DEFAULT 587,
    UsarTls               TINYINT(1) NOT NULL DEFAULT 1,
    PasswordCifrada       LONGTEXT NULL,
    FechaCreacion         DATETIME NOT NULL DEFAULT (UTC_TIMESTAMP()),
    FechaActualizacion    DATETIME NOT NULL DEFAULT (UTC_TIMESTAMP()) ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT PK_ConfiguracionCorreo PRIMARY KEY (ConfiguracionCorreoId),
    CONSTRAINT FK_ConfiguracionCorreo_Curriculum FOREIGN KEY (CurriculumId) REFERENCES Curriculum (CurriculumId) ON DELETE CASCADE,
    CONSTRAINT UQ_ConfiguracionCorreo_CurriculumId UNIQUE (CurriculumId)
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- =============================================================================
-- TRIGGERS DE SINCRONIZACION DE CONTADORES (Curriculum y EstadisticasPublicas)
-- =============================================================================
-- OJO -- diferencia real de comportamiento, no solo de sintaxis: los triggers
-- de SQL Server son "por sentencia" (leen las pseudo-tablas `inserted`/
-- `deleted`, que pueden traer muchas filas si el INSERT/UPDATE/DELETE afecto
-- varias a la vez). MariaDB solo soporta triggers "por fila" (una ejecucion
-- por cada fila afectada, con NEW/OLD apuntando a esa fila unicamente). Por
-- eso aca hay 3 triggers por tabla (INSERT/UPDATE/DELETE) en vez de 1, y cada
-- uno recalcula el agregado para el CurriculumId de ESA fila. El resultado
-- final es identico porque el codigo de la app siempre inserta/actualiza/
-- borra de a una fila de VisitanteContacto o AlertaVisita por vez -- si en el
-- futuro se agrega un borrado masivo (DELETE de muchas filas de un tiro),
-- estos triggers igual recalculan bien porque cada ejecucion vuelve a contar
-- desde la tabla real (COUNT/SUM), no arrastra un contador a mano.

DELIMITER $$

CREATE TRIGGER trg_VisitanteContacto_AfterInsert
AFTER INSERT ON VisitanteContacto
FOR EACH ROW
BEGIN
    UPDATE Curriculum
    SET ContadorContactos = (SELECT COUNT(*) FROM VisitanteContacto WHERE CurriculumId = NEW.CurriculumId)
    WHERE CurriculumId = NEW.CurriculumId;

    INSERT INTO EstadisticasPublicas (CurriculumId, TotalVisitas, TotalContactos, UltimaVisita, FechaActualizacion)
    VALUES (NEW.CurriculumId, 0, (SELECT COUNT(*) FROM VisitanteContacto WHERE CurriculumId = NEW.CurriculumId), NULL, UTC_TIMESTAMP())
    ON DUPLICATE KEY UPDATE
        TotalContactos = VALUES(TotalContactos),
        FechaActualizacion = VALUES(FechaActualizacion);
END$$

CREATE TRIGGER trg_VisitanteContacto_AfterUpdate
AFTER UPDATE ON VisitanteContacto
FOR EACH ROW
BEGIN
    UPDATE Curriculum
    SET ContadorContactos = (SELECT COUNT(*) FROM VisitanteContacto WHERE CurriculumId = NEW.CurriculumId)
    WHERE CurriculumId = NEW.CurriculumId;

    INSERT INTO EstadisticasPublicas (CurriculumId, TotalVisitas, TotalContactos, UltimaVisita, FechaActualizacion)
    VALUES (NEW.CurriculumId, 0, (SELECT COUNT(*) FROM VisitanteContacto WHERE CurriculumId = NEW.CurriculumId), NULL, UTC_TIMESTAMP())
    ON DUPLICATE KEY UPDATE
        TotalContactos = VALUES(TotalContactos),
        FechaActualizacion = VALUES(FechaActualizacion);
END$$

CREATE TRIGGER trg_VisitanteContacto_AfterDelete
AFTER DELETE ON VisitanteContacto
FOR EACH ROW
BEGIN
    UPDATE Curriculum
    SET ContadorContactos = (SELECT COUNT(*) FROM VisitanteContacto WHERE CurriculumId = OLD.CurriculumId)
    WHERE CurriculumId = OLD.CurriculumId;

    INSERT INTO EstadisticasPublicas (CurriculumId, TotalVisitas, TotalContactos, UltimaVisita, FechaActualizacion)
    VALUES (OLD.CurriculumId, 0, (SELECT COUNT(*) FROM VisitanteContacto WHERE CurriculumId = OLD.CurriculumId), NULL, UTC_TIMESTAMP())
    ON DUPLICATE KEY UPDATE
        TotalContactos = VALUES(TotalContactos),
        FechaActualizacion = VALUES(FechaActualizacion);
END$$

CREATE TRIGGER trg_AlertaVisita_AfterInsert
AFTER INSERT ON AlertaVisita
FOR EACH ROW
BEGIN
    UPDATE Curriculum
    SET ContadorVisitas = (
        SELECT COALESCE(SUM(CASE WHEN TipoVisita IN ('Vista', 'Descarga') THEN COALESCE(VistasAcumuladas, 1) ELSE 1 END), 0)
        FROM AlertaVisita WHERE CurriculumId = NEW.CurriculumId
    )
    WHERE CurriculumId = NEW.CurriculumId;

    INSERT INTO EstadisticasPublicas (CurriculumId, TotalVisitas, TotalContactos, UltimaVisita, FechaActualizacion)
    VALUES (
        NEW.CurriculumId,
        (SELECT COALESCE(SUM(CASE WHEN TipoVisita IN ('Vista', 'Descarga') THEN COALESCE(VistasAcumuladas, 1) ELSE 1 END), 0) FROM AlertaVisita WHERE CurriculumId = NEW.CurriculumId),
        0,
        (SELECT MAX(FechaVisita) FROM AlertaVisita WHERE CurriculumId = NEW.CurriculumId),
        UTC_TIMESTAMP()
    )
    ON DUPLICATE KEY UPDATE
        TotalVisitas = VALUES(TotalVisitas),
        UltimaVisita = VALUES(UltimaVisita),
        FechaActualizacion = VALUES(FechaActualizacion);
END$$

CREATE TRIGGER trg_AlertaVisita_AfterUpdate
AFTER UPDATE ON AlertaVisita
FOR EACH ROW
BEGIN
    UPDATE Curriculum
    SET ContadorVisitas = (
        SELECT COALESCE(SUM(CASE WHEN TipoVisita IN ('Vista', 'Descarga') THEN COALESCE(VistasAcumuladas, 1) ELSE 1 END), 0)
        FROM AlertaVisita WHERE CurriculumId = NEW.CurriculumId
    )
    WHERE CurriculumId = NEW.CurriculumId;

    INSERT INTO EstadisticasPublicas (CurriculumId, TotalVisitas, TotalContactos, UltimaVisita, FechaActualizacion)
    VALUES (
        NEW.CurriculumId,
        (SELECT COALESCE(SUM(CASE WHEN TipoVisita IN ('Vista', 'Descarga') THEN COALESCE(VistasAcumuladas, 1) ELSE 1 END), 0) FROM AlertaVisita WHERE CurriculumId = NEW.CurriculumId),
        0,
        (SELECT MAX(FechaVisita) FROM AlertaVisita WHERE CurriculumId = NEW.CurriculumId),
        UTC_TIMESTAMP()
    )
    ON DUPLICATE KEY UPDATE
        TotalVisitas = VALUES(TotalVisitas),
        UltimaVisita = VALUES(UltimaVisita),
        FechaActualizacion = VALUES(FechaActualizacion);
END$$

CREATE TRIGGER trg_AlertaVisita_AfterDelete
AFTER DELETE ON AlertaVisita
FOR EACH ROW
BEGIN
    UPDATE Curriculum
    SET ContadorVisitas = (
        SELECT COALESCE(SUM(CASE WHEN TipoVisita IN ('Vista', 'Descarga') THEN COALESCE(VistasAcumuladas, 1) ELSE 1 END), 0)
        FROM AlertaVisita WHERE CurriculumId = OLD.CurriculumId
    )
    WHERE CurriculumId = OLD.CurriculumId;

    INSERT INTO EstadisticasPublicas (CurriculumId, TotalVisitas, TotalContactos, UltimaVisita, FechaActualizacion)
    VALUES (
        OLD.CurriculumId,
        (SELECT COALESCE(SUM(CASE WHEN TipoVisita IN ('Vista', 'Descarga') THEN COALESCE(VistasAcumuladas, 1) ELSE 1 END), 0) FROM AlertaVisita WHERE CurriculumId = OLD.CurriculumId),
        0,
        (SELECT MAX(FechaVisita) FROM AlertaVisita WHERE CurriculumId = OLD.CurriculumId),
        UTC_TIMESTAMP()
    )
    ON DUPLICATE KEY UPDATE
        TotalVisitas = VALUES(TotalVisitas),
        UltimaVisita = VALUES(UltimaVisita),
        FechaActualizacion = VALUES(FechaActualizacion);
END$$

DELIMITER ;

-- =============================================================================
-- VISTAS (resumenes y combinaciones comunes para consultas frecuentes)
-- =============================================================================

CREATE VIEW vw_EstadisticasDesdeCurriculum AS
SELECT
    c.CurriculumId,
    c.ContadorVisitas AS TotalVisitas,
    c.ContadorContactos AS TotalContactos,
    c.FechaActualizacion AS UltimaVisita,
    c.FechaActualizacion AS FechaActualizacion
FROM Curriculum c;

CREATE VIEW vw_CurriculumResumen AS
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
FROM Curriculum c
INNER JOIN Usuario u ON c.UsuarioId = u.UsuarioId
LEFT JOIN EstadisticasPublicas ep ON ep.CurriculumId = c.CurriculumId;

CREATE VIEW vw_CurriculumPersonales AS
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
FROM Curriculum c
INNER JOIN Personales p ON p.CurriculumId = c.CurriculumId
INNER JOIN Usuario u ON c.UsuarioId = u.UsuarioId;

CREATE VIEW vw_VisitasYContactosPorCurriculum AS
SELECT
    c.CurriculumId,
    c.UrlPublica,
    c.Estado,
    c.ContadorVisitas,
    c.ContadorContactos,
    COALESCE(ep.TotalVisitas, 0) AS TotalVisitasHistorico,
    COALESCE(ep.TotalContactos, 0) AS TotalContactosHistorico,
    ep.UltimaVisita
FROM Curriculum c
LEFT JOIN EstadisticasPublicas ep ON ep.CurriculumId = c.CurriculumId;

-- -----------------------------------------------------------------------------
-- Roles base (idempotente respecto de este script; datos de demo en
-- scripts/manual/02_InsertTestData.sql, todavia no traducidos a MariaDB)
-- -----------------------------------------------------------------------------
INSERT INTO Rol (RolId, NombreRol, Descripcion) VALUES
    (1, 'Visitante',  'Usuario no autenticado que consulta informacion publica'),
    (2, 'Publicador', 'Profesional dueno de un CV'),
    (3, 'Admin',      'Administrador del sistema');

SELECT 'Script 01_CreateSchema.sql (MariaDB) ejecutado correctamente.' AS Resultado;
