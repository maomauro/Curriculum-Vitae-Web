# Diccionario de Datos - Portal de Currículum Vitae

A continuación se documentan todas las tablas y columnas del modelo, con nombre, tipo, descripción y reglas principales (PK, FK, not null, default, etc).

---

## Tabla: Rol
| Columna      | Tipo           | Descripción                                 | Reglas                        |
|--------------|----------------|---------------------------------------------|-------------------------------|
| RolId        | int            | Identificador único del rol                 | PK, autoincrement, not null   |
| NombreRol    | varchar(50)    | Nombre del rol                             | not null                     |
| Descripcion  | varchar(255)   | Descripción del rol                        |                               |

---

## Tabla: Usuario
| Columna        | Tipo             | Descripción                                 | Reglas                        |
|----------------|------------------|---------------------------------------------|-------------------------------|
| UsuarioId      | int              | Identificador único del usuario             | PK, autoincrement, not null   |
| Email          | varchar(100)     | Correo electrónico del usuario              | not null                     |
| PasswordHash   | varchar(255)     | Hash de la contraseña                       | not null                     |
| Estado         | varchar(20)      | Estado del usuario (Activo/Inactivo)        | not null, default: 'Activo'  |
| FechaRegistro  | datetime         | Fecha de registro                           | not null, default: now()     |

---

## Tabla: UsuarioRol
| Columna        | Tipo         | Descripción                                 | Reglas                        |
|----------------|--------------|---------------------------------------------|-------------------------------|
| UsuarioRolId   | int          | Identificador único                         | PK, autoincrement, not null   |
| UsuarioId      | int          | Usuario asignado                            | FK Usuario.UsuarioId, not null|
| RolId          | int          | Rol asignado                                | FK Rol.RolId, not null        |
| (UsuarioId, RolId) |           | Relación única usuario-rol                  | UNIQUE                       |

---

## Tabla: Curriculum
| Columna           | Tipo             | Descripción                                 | Reglas                        |
|-------------------|------------------|---------------------------------------------|-------------------------------|
| CurriculumId      | int              | Identificador único del CV                  | PK, autoincrement, not null   |
| UsuarioId         | int              | Usuario propietario                         | FK Usuario.UsuarioId, not null|
| UrlPublica        | varchar(255)     | URL pública del CV                          | not null, UNIQUE              |
| Estado            | varchar(20)      | Estado del CV (Borrador/Publicado)          | not null, default: 'Borrador' |
| ContadorVisitas   | int              | Número de visitas                           | not null, default: 0          |
| ContadorContactos | int              | Número de contactos recibidos               | not null, default: 0          |
| FechaCreacion     | datetime         | Fecha de creación                           | not null, default: now()      |
| FechaActualizacion| datetime         | Fecha de última actualización               | not null, default: now()      |

---

## Tabla: Personales
| Columna              | Tipo             | Descripción                                 | Reglas                        |
|----------------------|------------------|---------------------------------------------|-------------------------------|
| PersonalesId         | int              | Identificador único                         | PK, autoincrement, not null   |
| CurriculumId         | int              | CV asociado                                 | FK Curriculum.CurriculumId, not null |
| TipoIdentificacion   | varchar(50)      | Tipo de documento de identidad              |                               |
| NumeroDocumento      | varchar(50)      | Número de documento                         |                               |
| FechaExpedicion      | date             | Fecha de expedición del documento           |                               |
| LugarExpedicion      | varchar(100)     | Lugar de expedición                         |                               |
| LibretaMilitarNumero | varchar(50)      | Número de libreta militar                   |                               |
| LibretaMilitarClase  | varchar(20)      | Clase de libreta militar                    |                               |
| PasaporteNumero      | varchar(50)      | Número de pasaporte                         |                               |
| PasaporteVigencia    | date             | Vigencia del pasaporte                      |                               |
| VisaNumero           | varchar(50)      | Número de visa                              |                               |
| VisaVigencia         | date             | Vigencia de la visa                         |                               |
| VisaClase            | varchar(50)      | Clase de visa                               |                               |
| PrimerNombre         | varchar(50)      | Primer nombre                               | not null                     |
| SegundoNombre        | varchar(50)      | Segundo nombre                              |                               |
| PrimerApellido       | varchar(50)      | Primer apellido                             | not null                     |
| SegundoApellido      | varchar(50)      | Segundo apellido                            |                               |
| FechaNacimiento      | date             | Fecha de nacimiento                         |                               |
| LugarNacimiento      | varchar(100)     | Lugar de nacimiento                         |                               |
| Genero               | varchar(20)      | Género                                      |                               |
| Nacionalidad         | varchar(50)      | Nacionalidad                                |                               |
| TipoSangre           | varchar(10)      | Tipo de sangre                              |                               |
| EPS                  | varchar(100)     | EPS                                         |                               |
| Pencion              | varchar(100)     | Fondo de pensión                            |                               |
| Cesantias            | varchar(100)     | Fondo de cesantías                          |                               |
| Email                | varchar(100)     | Correo electrónico                          |                               |
| Celular              | varchar(20)      | Número de celular                           |                               |
| TelefonoFijo         | varchar(20)      | Teléfono fijo                               |                               |
| Pais                 | varchar(50)      | País de residencia                          |                               |
| Departamento         | varchar(50)      | Departamento                                |                               |
| Ciudad               | varchar(50)      | Ciudad                                      |                               |
| Barrio               | varchar(100)     | Barrio                                      |                               |
| CodigoPostal         | varchar(20)      | Código postal                               |                               |
| Direccion            | varchar(255)     | Dirección                                   |                               |
| TipoResidencia       | varchar(50)      | Tipo de residencia                          |                               |
| FotoUrl              | varchar(500)     | URL de la foto de perfil                    |                               |
| PrivacidadEmail      | varchar(20)      | Visibilidad del email en el CV público      | not null, default: 'Publico'; IN ('Publico','SoloFormulario','Oculto') |
| PrivacidadTelefono   | varchar(20)      | Visibilidad del teléfono en el CV público   | not null, default: 'Publico'; IN ('Publico','Parcial','Oculto') |

---

# ---

## Tabla: Referencia
| Columna         | Tipo           | Descripción                                 | Reglas                        |
|-----------------|----------------|---------------------------------------------|-------------------------------|
| ReferenciaId    | int            | Identificador único                         | PK, autoincrement, not null   |
| CurriculumId    | int            | CV asociado                                 | FK Curriculum.CurriculumId, not null |
| TipoReferencia  | varchar(20)    | Tipo de referencia (laboral/personal)       | not null                     |
| ExperienciaId   | int            | Experiencia asociada (opcional)             | FK Experiencia.ExperienciaId  |
| Nombre          | varchar(100)   | Nombre de la referencia                     | not null                     |
| Apellido        | varchar(100)   | Apellido de la referencia                   |                               |
| Email           | varchar(100)   | Correo electrónico                          |                               |
| Telefono        | varchar(20)    | Teléfono                                    |                               |
| Parentesco      | varchar(50)    | Parentesco                                  |                               |
| Cargo           | varchar(100)   | Cargo de la referencia                      |                               |
| Empresa         | varchar(150)   | Empresa de la referencia                    |                               |
| Relacion        | varchar(100)   | Relación                                    |                               |
| Observaciones   | varchar(500)   | Observaciones                               |                               |
| AdjuntoSoporte  | varchar(500)   | Soporte adjunto                             |                               |
| FechaRegistro   | datetime       | Fecha de registro                           | not null, default: now()      |

---

## Tabla: FamiliarContacto
| Columna            | Tipo           | Descripción                                 | Reglas                        |
|--------------------|----------------|---------------------------------------------|-------------------------------|
| FamiliarId         | int            | Identificador único                         | PK, autoincrement, not null   |
| CurriculumId       | int            | CV asociado                                 | FK Curriculum.CurriculumId, not null |
| Parentesco         | varchar(50)    | Parentesco                                  |                               |
| Nombres            | varchar(100)   | Nombres del familiar                        |                               |
| Apellidos          | varchar(100)   | Apellidos del familiar                      |                               |
| Email              | varchar(100)   | Correo electrónico                          |                               |
| Telefono           | varchar(20)    | Teléfono                                    |                               |
| EsContactoPrincipal| boolean        | ¿Es contacto principal?                     | not null, default: 0          |

---

## Tabla: RedSocial
| Columna         | Tipo           | Descripción                                 | Reglas                        |
|-----------------|----------------|---------------------------------------------|-------------------------------|
| RedSocialId     | int            | Identificador único                         | PK, autoincrement, not null   |
| CurriculumId    | int            | CV asociado                                 | FK Curriculum.CurriculumId, not null |
| NombreRed       | varchar(50)    | Nombre de la red social                     | not null                     |
| LinkPublico     | varchar(500)   | Enlace público al perfil                    |                               |
| UsuarioContacto | varchar(100)   | Usuario/contacto en la red                  |                               |

---

## Tabla: Perfil
| Columna                | Tipo             | Descripción                                 | Reglas                        |
|------------------------|------------------|---------------------------------------------|-------------------------------|
| PerfilId               | int              | Identificador único                         | PK, autoincrement, not null   |
| CurriculumId           | int              | CV asociado                                 | FK Curriculum.CurriculumId, not null |
| NombrePerfil           | varchar(100)     | Nombre del perfil profesional                |                               |
| DescripcionPerfil      | text             | Descripción del perfil                       |                               |
| AspiracionSalarialPesos| decimal(18,2)    | Aspiración salarial en pesos                 |                               |
| AspiracionSalarialDolares| decimal(18,2)  | Aspiración salarial en dólares               |                               |
| EsActivo               | boolean        | Indica si el perfil está activo/habilitado   | not null, default: 1          |

---

## Tabla: Experiencia
| Columna        | Tipo           | Descripción                                 | Reglas                        |
|----------------|----------------|---------------------------------------------|-------------------------------|
| ExperienciaId  | int            | Identificador único                         | PK, autoincrement, not null   |
| CurriculumId   | int            | CV asociado                                 | FK Curriculum.CurriculumId, not null |
| Empresa        | varchar(150)   | Empresa donde trabajó                        |                               |
| Cargo          | varchar(100)   | Cargo desempeñado                            |                               |
| Sector         | varchar(100)   | Sector de la empresa                         |                               |
| FechaInicio    | date           | Fecha de inicio                              |                               |
| FechaFin       | date           | Fecha de finalización                        |                               |
| TipoContrato   | varchar(50)    | Tipo de contrato                             |                               |
| MotivoRetiro   | varchar(255)   | Motivo de retiro                             |                               |
| Funciones      | text           | Funciones realizadas                         |                               |
| EsActual       | boolean        | Indica si es el trabajo actual (sin FechaFin)| not null, default: 0          |
| AdjuntoSoporte | varchar(500)   | URL de soporte adjunto (carta laboral, etc.) |                               |
| FechaRegistro  | datetime       | Fecha de registro                            | not null, default: now()      |

---

## Tabla: Formacion
| Columna        | Tipo           | Descripción                                 | Reglas                        |
|----------------|----------------|---------------------------------------------|-------------------------------|
| FormacionId    | int            | Identificador único                         | PK, autoincrement, not null   |
| CurriculumId   | int            | CV asociado                                 | FK Curriculum.CurriculumId, not null |
| Titulo         | varchar(200)   | Título obtenido                             |                               |
| Institucion    | varchar(200)   | Institución educativa                        |                               |
| Area           | varchar(100)   | Área de estudio                              |                               |
| FechaInicio    | date           | Fecha de inicio                              |                               |
| FechaFin       | date           | Fecha de finalización                        |                               |
| TipoFormacion  | varchar(50)    | Tipo de formación                            |                               |
| Descripcion    | text           | Descripción adicional                        |                               |
| AdjuntoSoporte | varchar(500)   | Soporte adjunto                              |                               |
| FechaVigencia  | date           | Fecha de vigencia/expiración del certificado |                               |
| DuracionHoras  | int            | Duración en horas (para cursos)              |                               |

---

## Tabla: Habilidad
| Columna      | Tipo           | Descripción                                 | Reglas                        |
|--------------|----------------|---------------------------------------------|-------------------------------|
| HabilidadId  | int            | Identificador único                         | PK, autoincrement, not null   |
| CurriculumId | int            | CV asociado                                 | FK Curriculum.CurriculumId, not null |
| Nombre       | varchar(100)   | Nombre de la habilidad                      | not null                     |
| Tipo         | varchar(30)    | Tipo de habilidad                           |                               |
| Nivel        | varchar(30)    | Nivel de dominio                            |                               |
| Descripcion  | varchar(500)   | Descripción de la habilidad                 |                               |
| NivelLectura   | varchar(5)     | Nivel de lectura CEFR (solo idiomas)        | IN ('A1','A2','B1','B2','C1','C2') o NULL |
| NivelEscritura | varchar(5)     | Nivel de escritura CEFR (solo idiomas)      | IN ('A1','A2','B1','B2','C1','C2') o NULL |
| NivelEscucha   | varchar(5)     | Nivel de escucha CEFR (solo idiomas)        | IN ('A1','A2','B1','B2','C1','C2') o NULL |
| NivelHabla     | varchar(5)     | Nivel de habla CEFR (solo idiomas)          | IN ('A1','A2','B1','B2','C1','C2') o NULL |

---

## Tabla: Proyecto
| Columna        | Tipo           | Descripción                                 | Reglas                        |
|----------------|----------------|---------------------------------------------|-------------------------------|
| ProyectoId     | int            | Identificador único                         | PK, autoincrement, not null   |
| CurriculumId   | int            | CV asociado                                 | FK Curriculum.CurriculumId, not null |
| NombreProyecto | varchar(200)   | Nombre del proyecto                         |                               |
| Rol            | varchar(100)   | Rol desempeñado                             |                               |
| EquipoTamano   | int            | Tamaño del equipo                           |                               |
| DuracionMeses  | int            | Duración en meses                           |                               |
| StackTecnologico| varchar(500)  | Tecnologías utilizadas                      |                               |
| Aporte         | text           | Aporte personal                             |                               |
| Logro          | text           | Logros obtenidos                            |                               |
| Desafio        | text           | Desafíos enfrentados                        |                               |

---

## Tabla: VisitanteContacto
| Columna            | Tipo           | Descripción                                 | Reglas                        |
|--------------------|----------------|---------------------------------------------|-------------------------------|
| VisitanteContactoId| int            | Identificador único                         | PK, autoincrement, not null   |
| CurriculumId       | int            | CV asociado                                 | FK Curriculum.CurriculumId, not null |
| Nombre             | varchar(100)   | Nombre del visitante                        |                               |
| Correo             | varchar(100)   | Correo electrónico del visitante            | not null                     |
| Empresa            | varchar(150)   | Empresa del visitante                       |                               |
| MotivoContacto     | varchar(255)   | Motivo del contacto                         |                               |
| Asunto             | varchar(255)   | Asunto del mensaje de contacto              |                               |
| ComoMeEncontraste  | varchar(255)   | Cómo encontró el CV                         |                               |
| Mensaje            | text           | Mensaje enviado                             |                               |
| FechaContacto      | datetime       | Fecha del contacto                          | not null, default: now()      |

---

## Tabla: AlertaVisita
| Columna        | Tipo           | Descripción                                 | Reglas                        |
|----------------|----------------|---------------------------------------------|-------------------------------|
| AlertaVisitaId | int            | Identificador único                         | PK, autoincrement, not null   |
| CurriculumId   | int            | CV asociado                                 | FK Curriculum.CurriculumId, not null |
| FechaVisita    | datetime       | Fecha de la visita                          | not null, default: now()      |
| Origen         | varchar(255)   | Origen de la visita                         |                               |
| TipoVisita     | varchar(20)    | Tipo de visita                              | IN ('Vista','Contacto','Descarga','Sistema') |
| EsLeida        | boolean        | Indica si la alerta fue leída               | not null, default: 0          |
| Titulo         | varchar(255)   | Título descriptivo de la alerta             |                               |
| Descripcion    | text           | Texto descriptivo de la alerta              |                               |
| Ciudad         | varchar(100)   | Ciudad del visitante (si aplica)            |                               |
| Pais           | varchar(100)   | País del visitante (si aplica)              |                               |

---

## Tabla: VisibilidadSeccion
| Columna            | Tipo           | Descripción                                 | Reglas                        |
|--------------------|----------------|---------------------------------------------|-------------------------------|
| VisibilidadSeccionId| int           | Identificador único                         | PK, autoincrement, not null   |
| CurriculumId       | int            | CV asociado                                 | FK Curriculum.CurriculumId, not null |
| NombreSeccion      | varchar(100)   | Nombre de la sección                        | not null                     |
| EsVisible          | boolean        | ¿Se muestra la sección?                     | not null, default: 1          |

---

## Tabla: EstadisticasPublicas
| Columna         | Tipo           | Descripción                                 | Reglas                        |
|-----------------|----------------|---------------------------------------------|-------------------------------|
| EstadisticasId  | int            | Identificador único                         | PK, autoincrement, not null   |
| CurriculumId    | int            | CV asociado                                 | FK Curriculum.CurriculumId, not null |
| TotalVisitas    | int            | Total de visitas públicas                   | not null, default: 0          |
| TotalContactos  | int            | Total de contactos públicos                 | not null, default: 0          |
| UltimaVisita    | datetime       | Fecha de la última visita                   |                               |
| FechaActualizacion| datetime      | Fecha de actualización                      | not null, default: now()      |