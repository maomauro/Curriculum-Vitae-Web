-- =============================================================================
-- Portal de Currículum Vitae - Script de inserción de datos de prueba
-- SQL Server (2016+)
-- =============================================================================

SET NOCOUNT ON;
GO

-- Roles base (no duplicar si ya existen)
IF NOT EXISTS (SELECT 1 FROM dbo.Rol WHERE RolId = 1)
BEGIN
    SET IDENTITY_INSERT dbo.Rol ON;
    INSERT INTO dbo.Rol (RolId, NombreRol, Descripcion) VALUES
        (1, N'Visitante', N'Usuario no autenticado que consulta información pública'),
        (2, N'Publicador', N'Profesional dueño de un CV'),
        (3, N'Admin', N'Administrador del sistema');
    SET IDENTITY_INSERT dbo.Rol OFF;
END
GO

-- Usuarios de prueba
INSERT INTO dbo.Usuario (Email, PasswordHash, Estado)
VALUES
    (N'juan.perez@example.com', N'HashedPassword1', N'Activo'),
    (N'maria.gomez@example.com', N'HashedPassword2', N'Activo'),
    (N'ana.lopez@example.com', N'HashedPassword3', N'Activo'),
    (N'carlos.rivera@example.com', N'HashedPassword4', N'Activo'),
    (N'laura.moreno@example.com', N'HashedPassword5', N'Activo'),
    (N'diego.sanchez@example.com', N'HashedPassword6', N'Activo'),
    (N'sofia.castillo@example.com', N'HashedPassword7', N'Activo'),
    (N'nicolas.martinez@example.com', N'HashedPassword8', N'Activo'),
    (N'camila.rodriguez@example.com', N'HashedPassword9', N'Activo'),
    (N'fernando.torres@example.com', N'HashedPassword10', N'Activo'),
    (N'paula.mendoza@example.com', N'HashedPassword11', N'Activo'),
    (N'javier.fernandez@example.com', N'HashedPassword12', N'Activo');
GO

-- Currículums de prueba
INSERT INTO dbo.Curriculum (UsuarioId, UrlPublica, Estado, ContadorVisitas, ContadorContactos)
VALUES
    (1, N'juan-perez', N'Publicado', 42, 5),
    (2, N'maria-gomez', N'Borrador', 7, 1),
    (3, N'ana-lopez', N'Publicado', 18, 3),
    (4, N'carlos-rivera', N'Publicado', 65, 12),
    (5, N'laura-moreno', N'Borrador', 4, 0),
    (6, N'diego-sanchez', N'Publicado', 29, 6),
    (7, N'sofia-castillo', N'Publicado', 52, 9),
    (8, N'nicolas-martinez', N'Publicado', 13, 2),
    (9, N'camila-rodriguez', N'Borrador', 0, 0),
    (10, N'fernando-torres', N'Publicado', 21, 4),
    (11, N'paula-mendoza', N'Publicado', 34, 7),
    (12, N'javier-fernandez', N'Borrador', 5, 1);
GO

-- Información personal
INSERT INTO dbo.Personales (
    CurriculumId,
    TipoIdentificacion,
    NumeroDocumento,
    PrimerNombre,
    SegundoNombre,
    PrimerApellido,
    SegundoApellido,
    FechaNacimiento,
    Pais,
    Departamento,
    Ciudad,
    Barrio,
    Direccion,
    Email,
    Celular
)
VALUES
    (1, N'Cédula', N'123456789', N'Juan', N'Carlos', N'Pérez', N'Sánchez', '1988-04-12', N'Colombia', N'Antioquia', N'Medellín', N'El Poblado', N'Calle 10 #45-60', N'juan.perez@correo.com', N'3112345678'),
    (2, N'Cédula', N'987654321', N'María', N'Fernanda', N'Gómez', N'Ramírez', '1992-09-25', N'Colombia', N'Valle del Cauca', N'Cali', N'San Fernando', N'Carrera 12 #34-56', N'maria.gomez@correo.com', N'3123456789'),
    (3, N'Cédula', N'112233445', N'Ana', N'Lucía', N'López', N'García', '1990-01-20', N'Colombia', N'Bogotá', N'Bogotá', N'Chapinero', N'Carrera 5 #45-23', N'ana.lopez@correo.com', N'3201234567'),
    (4, N'Cédula', N'223344556', N'Carlos', N'Andrés', N'Rivera', N'Soto', '1985-07-18', N'Colombia', N'Atlántico', N'Barranquilla', N'El Prado', N'Carrera 24 #12-89', N'carlos.rivera@correo.com', N'3212345678'),
    (5, N'Cédula', N'334455667', N'Laura', N'Isabel', N'Moreno', N'Gómez', '1993-03-10', N'Colombia', N'Boyacá', N'Tunja', N'Centro', N'Carrera 8 #15-20', N'laura.moreno@correo.com', N'3223456789'),
    (6, N'Cédula', N'445566778', N'Diego', N'María', N'Sánchez', N'Romero', '1989-11-05', N'Colombia', N'Cundinamarca', N'Bogotá', N'Usaquén', N'Cra 7 #120-45', N'diego.sanchez@correo.com', N'3234567890'),
    (7, N'Cédula', N'556677889', N'Sofía', N'Valentina', N'Castillo', N'Pérez', '1991-06-22', N'Colombia', N'Antioquia', N'Medellín', N'Laureles', N'Calle 33 #78-45', N'sofia.castillo@correo.com', N'3245678901'),
    (8, N'Cédula', N'667788990', N'Nicolás', N'José', N'Martínez', N'Lozano', '1987-02-14', N'Colombia', N'Valle del Cauca', N'Cali', N'Granada', N'Carrera 39 #14-65', N'nicolas.martinez@correo.com', N'3256789012'),
    (9, N'Cédula', N'778899001', N'Camila', N'Sofía', N'Rodríguez', N'Hernández', '1995-12-08', N'Colombia', N'Valle del Cauca', N'Cali', N'Ciudad Jardín', N'Calle 4 #23-78', N'camila.rodriguez@correo.com', N'3267890123'),
    (10, N'Cédula', N'889900112', N'Fernando', N'David', N'Torres', N'Gómez', '1986-10-30', N'Colombia', N'Antioquia', N'Medellín', N'El Poblado', N'Carrera 14 #34-56', N'fernando.torres@correo.com', N'3278901234'),
    (11, N'Cédula', N'990011223', N'Paula', N'Daniela', N'Mendoza', N'Castro', '1994-05-16', N'Colombia', N'Bogotá', N'Bogotá', N'Chico', N'Carrera 11 #10-22', N'paula.mendoza@correo.com', N'3289012345'),
    (12, N'Cédula', N'001122334', N'Javier', N'Andrés', N'Fernández', N'Gutiérrez', '1984-09-02', N'Colombia', N'Santander', N'Bucaramanga', N'Cabecera', N'Carrera 21 #38-90', N'javier.fernandez@correo.com', N'3290123456');
GO

-- Perfil profesional
INSERT INTO dbo.Perfil (CurriculumId, NombrePerfil, DescripcionPerfil, AspiracionSalarialPesos, AspiracionSalarialDolares)
VALUES
    (1, N'Ingeniero de Software', N'Desarollador backend con 6 años de experiencia en .NET y bases de datos SQL Server.', 8500000.00, 2200.00),
    (2, N'Diseñadora UX/UI', N'Diseñadora creativa con experiencia en investigación de usuarios y creación de interfaces accesibles.', 6500000.00, 1800.00);
GO

-- Experiencia laboral
INSERT INTO dbo.Experiencia (
    CurriculumId,
    Empresa,
    Cargo,
    Sector,
    FechaInicio,
    FechaFin,
    TipoContrato,
    MotivoRetiro,
    Funciones,
    EsActual
)
VALUES
    (1, N'Tech Solutions S.A.S.', N'Analista de Desarrollo', N'Tecnología', '2018-06-01', '2022-11-30', N'Termino fijo',       N'Búsqueda de nuevos retos', N'Diseño y desarrollo de APIs REST, optimización de consultas y despliegue continuo.', 0),
    (2, N'Creative Studio',       N'Diseñadora UX',          N'Diseño',     '2020-03-15', NULL,         N'Contrato indefinido', NULL,                        N'Investigación de usuarios, prototipado y pruebas de usabilidad para apps móviles.',  1);
GO

-- Referencias
INSERT INTO dbo.Referencia (
    CurriculumId,
    TipoReferencia,
    ExperienciaId,
    Nombre,
    Apellido,
    Email,
    Telefono,
    Cargo,
    Empresa,
    Relacion,
    Observaciones
)
VALUES
    (1, N'Laboral', 1, N'Andrés', N'Gómez', N'andres.gomez@techsolutions.com', N'3109876543', N'Gerente de Proyecto', N'Tech Solutions S.A.S.', N'Jefe directo', N'Juan entregó soluciones de alto impacto en tiempo y forma.'),
    (2, N'Personal', NULL, N'Paula', N'Rivas', N'paula.rivas@correo.com', N'3134567890', NULL, NULL, N'Amiga', N'María es responsable, creativa y siempre cumple sus objetivos.');
GO

-- Familiares de contacto
INSERT INTO dbo.FamiliarContacto (CurriculumId, Parentesco, Nombres, Apellidos, Email, Telefono, EsContactoPrincipal)
VALUES
    (1, N'Esposa', N'Laura', N'Martínez', N'laura.martinez@correo.com', N'3001234567', 1),
    (2, N'Hermana', N'Carolina', N'Gómez', N'carolina.gomez@correo.com', N'3009876543', 1);
GO

-- Redes sociales
INSERT INTO dbo.RedSocial (CurriculumId, NombreRed, LinkPublico, UsuarioContacto)
VALUES
    (1, N'LinkedIn', N'https://www.linkedin.com/in/juan-perez', N'juan-perez'),
    (1, N'GitHub', N'https://github.com/juanperez', N'juanperez'),
    (2, N'Dribbble', N'https://dribbble.com/maria-gomez', N'maria-gomez');
GO

-- Formación académica
INSERT INTO dbo.Formacion (CurriculumId, Titulo, Institucion, Area, FechaInicio, FechaFin, TipoFormacion, Descripcion)
VALUES
    (1, N'Ingeniería de Sistemas', N'Universidad Nacional', N'Tecnología', '2007-02-15', '2012-12-18', N'Pregrado', N'Proyecto de grado en arquitectura de software escalable.'),
    (2, N'Maestría en Diseño de Interacción', N'Universidad Javeriana', N'Diseño', '2019-08-01', '2021-06-30', N'Maestría', N'Tesis sobre experiencia de usuario móvil para servicios financieros.');
GO

-- Habilidades
INSERT INTO dbo.Habilidad (CurriculumId, Nombre, Tipo, Nivel, Descripcion)
VALUES
    (1, N'C#', N'Tecnica', N'Avanzado', N'Desarollo de APIs, servicios y automatizaciones.'),
    (1, N'SQL Server', N'Tecnica', N'Avanzado', N'Diseño y optimización de consultas, índices y procedimientos almacenados.'),
    (2, N'Figma', N'Tecnica', N'Avanzado', N'Diseño de interfaces y prototipos de alta fidelidad.'),
    (2, N'Comunicación', N'Blanda', N'Experto', N'Trabajo en equipo y presentación de propuestas de diseño.');
GO

-- Proyectos
INSERT INTO dbo.Proyecto (CurriculumId, NombreProyecto, Rol, EquipoTamano, DuracionMeses, StackTecnologico, Aporte, Logro, Desafio)
VALUES
    (1, N'Sistema de gestión de inventarios', N'Líder técnico', 5, 10, N'.NET, SQL Server, Azure', N'Diseño de la arquitectura de backend y coordinación del equipo.', N'Reducción del 30% en tiempos de consulta.', N'Integrar múltiples orígenes de datos con alta disponibilidad.'),
    (2, N'Plataforma de e-commerce móvil', N'Diseñadora UX', 4, 8, N'Figma, Adobe XD, React Native', N'Diseño de flujos de compra y prototipos interactivos.', N'Aumento del 20% en la conversión de usuarios.', N'Crear una experiencia de pago simple y confiable.');
GO

-- Visitantes de contacto
INSERT INTO dbo.VisitanteContacto (CurriculumId, Nombre, Correo, Empresa, MotivoContacto, ComoMeEncontraste, Mensaje)
VALUES
    (1, N'Andrea López', N'andrea.lopez@empresa.com', N'Empresa S.A.', N'Interés en contratación', N'LinkedIn', N'Hola Juan, me interesa tu perfil para una vacante de desarrollador senior.'),
    (2, N'Carlos Rivera', N'carlos.rivera@startup.com', N'StartupLab', N'Consulta de portafolio', N'Dribbble', N'Buen día María, quiero conversar sobre una posible colaboración.');
GO

-- Alertas de visita
INSERT INTO dbo.AlertaVisita (CurriculumId, FechaVisita, Origen, TipoVisita, EsLeida, Titulo, Descripcion, Ciudad, Pais)
VALUES
    (1, GETDATE(),                    N'Página pública', N'Contacto', 0, N'Nuevo mensaje de contacto recibido',  N'Andrea López de Empresa S.A. te envió un mensaje.',           N'Bogotá',      N'Colombia'),
    (2, DATEADD(DAY, -3, GETDATE()),  N'Página pública', N'Vista',    1, N'Nueva visita a tu CV',                N'Alguien ha consultado tu perfil desde Barranquilla.',         N'Barranquilla', N'Colombia'),
    (1, DATEADD(DAY, -1, GETDATE()),  N'Google',         N'Descarga', 0, N'Descarga de tu CV',                   N'Un visitante descargó tu CV en formato PDF.',                 N'Medellín',    N'Colombia'),
    (1, DATEADD(DAY, -7, GETDATE()),  NULL,              N'Sistema',  1, N'Tu CV fue publicado exitosamente',    N'Tu perfil ya es visible al público.',                         NULL,           NULL);
GO

-- Visibilidad de secciones
INSERT INTO dbo.VisibilidadSeccion (CurriculumId, NombreSeccion, EsVisible)
VALUES
    (1, N'Perfil', 1),
    (1, N'Experiencia', 1),
    (1, N'Proyectos', 1),
    (2, N'Formacion', 1),
    (2, N'Habilidades', 1),
    (2, N'Referencias', 0);
GO

-- Estadísticas públicas
MERGE dbo.EstadisticasPublicas AS target
USING (
    VALUES
        (1, 42, 5, GETDATE()),
        (2, 7, 1, DATEADD(DAY, -1, GETDATE()))
) AS source (CurriculumId, TotalVisitas, TotalContactos, UltimaVisita)
ON target.CurriculumId = source.CurriculumId
WHEN MATCHED THEN
    UPDATE SET
        TotalVisitas = source.TotalVisitas,
        TotalContactos = source.TotalContactos,
        UltimaVisita = source.UltimaVisita,
        FechaActualizacion = SYSDATETIME()
WHEN NOT MATCHED THEN
    INSERT (CurriculumId, TotalVisitas, TotalContactos, UltimaVisita)
    VALUES (source.CurriculumId, source.TotalVisitas, source.TotalContactos, source.UltimaVisita);
GO

PRINT N'Script 02_InsertTestData.sql ejecutado correctamente.';
GO
