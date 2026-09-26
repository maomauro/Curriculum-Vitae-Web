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
| PlantillaCodigo   | varchar(32)      | Plantilla de color elegida para el CV (clasico, corporativo, etc.) | not null, default: 'clasico' |
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
| FotoUrl              | varchar(500)     | URL de foto pegada por el usuario (legacy). Se ignora si FotoBytes tiene valor |  |
| FotoBytes            | longblob         | Foto de perfil subida como archivo (máx. 1 MB, validado en aplicación) |       |
| FotoContentType      | varchar(100)     | Tipo MIME de FotoBytes (image/jpeg, image/png, image/webp) |               |

> **Visibilidad de Email/Celular en el CV público:** no son columnas propias de `Personales` — se controlan con filas genéricas en `VisibilidadSeccion` (claves `datos-personales.email` / `datos-personales.telefono`, ver tabla más abajo). Sin fila guardada, el atributo se considera visible por defecto.

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
| Observaciones   | text           | Observaciones                               |                               |
| AdjuntoSoporte  | varchar(500)   | Soporte adjunto                             |                               |
| MostrarEnCv     | boolean        | Incluir en Mi CV y en el detalle público    | not null, default: true       |
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
| MostrarEnCv     | boolean        | Si la red social se muestra en el CV público | not null, default: 1         |

---

## Tabla: Perfil
| Columna                | Tipo             | Descripción                                 | Reglas                        |
|------------------------|------------------|---------------------------------------------|-------------------------------|
| PerfilId               | int              | Identificador único                         | PK, autoincrement, not null   |
| CurriculumId           | int              | CV asociado                                 | FK Curriculum.CurriculumId, not null |
| NombrePerfil           | varchar(100)     | Nombre del perfil profesional                |                               |
| DescripcionPerfil      | text             | Descripción del perfil                       |                               |
| ExperienciaPerfilAnios | decimal(5,2)     | Años de experiencia asociados a este perfil  |                               |
| AspiracionSalarialPesos| decimal(18,2)    | Aspiración salarial en pesos                 |                               |
| AspiracionSalarialDolares| decimal(18,2)  | Aspiración salarial en dólares               |                               |
| EsActivo               | boolean        | Indica si el perfil está activo/habilitado   | not null, default: 1          |
| MostrarExperienciaPerfil | boolean      | Mostrar la experiencia de este perfil en el CV público | not null, default: true |
| MostrarAspiracionSalarial | boolean     | Mostrar la aspiración salarial de este perfil en el CV público | not null, default: true |

---

## Tabla: CvGenerado
Contenido del CV condensado por IA para "Mi CV", uno por `Perfil` — regenerar reemplaza el `ContenidoJson` en vez de crear una fila nueva.

| Columna          | Tipo           | Descripción                                 | Reglas                        |
|------------------|----------------|----------------------------------------------|-------------------------------|
| CvGeneradoId     | int            | Identificador único                          | PK, autoincrement, not null   |
| CurriculumId     | int            | CV asociado                                  | FK Curriculum.CurriculumId, not null, ON DELETE CASCADE |
| PerfilId         | int            | Perfil para el que se generó este CV         | FK Perfil.PerfilId, not null, ON DELETE NO ACTION, UNIQUE (uno por Perfil) |
| ContenidoJson    | text           | Experiencia/Educación/Proyectos/Habilidades condensados por IA, en JSON | not null |
| PromptPorDefecto | boolean        | Si se generó con el prompt por defecto (no uno personalizado por el usuario) | not null, default: 0 |
| FechaGeneracion  | datetime       | Fecha de la última generación                | not null, default: now()      |

---

## Tabla: Oferta
Historial de ofertas laborales analizadas por el postulante (flujo Oferta → Perfil → CV ya construido → correo con PDF adjunto, ver `docs/arquitectura/Roadmap-Ofertas-IA.md`).

| Columna          | Tipo           | Descripción                                        | Reglas                                        |
|------------------|----------------|------------------------------------------------------|------------------------------------------------|
| OfertaId         | int            | Identificador único                                   | PK, autoincrement, not null                    |
| CurriculumId     | int            | CV asociado                                           | FK Curriculum.CurriculumId, not null, ON DELETE CASCADE |
| Cargo            | varchar(150)   | Cargo de la oferta                                     | not null                                       |
| Empresa          | varchar(150)   | Empresa que publica la oferta                          | not null                                       |
| Descripcion      | text           | Descripción de la oferta                               |                                                 |
| CorreoReclutador | varchar(150)   | Correo del reclutador                                   |                                                 |
| NombreReclutador | varchar(150)   | Nombre del reclutador                                   |                                                 |
| Modalidad            | varchar(150)   | Modalidad de trabajo (texto libre, ej. "100% remoto")   |                                                 |
| TipoContrato         | varchar(100)   | Tipo de contrato (texto libre, ej. "Contractor")        |                                                 |
| Moneda               | varchar(20)    | Moneda de la remuneración (texto libre, ej. "USD")      |                                                 |
| Duracion             | varchar(150)   | Duración del contrato (texto libre)                     |                                                 |
| Horario              | varchar(100)   | Horario o huso horario (texto libre, ej. "CST")         |                                                 |
| ExperienciaRequerida | varchar(100)   | Años de experiencia pedidos (texto libre, ej. "3 a 5 años") |                                             |
| StackTecnologico     | text           | Stack/tecnologías pedidas (texto libre)                 |                                                 |
| NivelIdioma          | varchar(100)   | Nivel de idioma requerido (texto libre, ej. "Inglés B2+/C1") |                                            |
| TextoOriginal    | text           | Texto pegado por el usuario, o texto detectado si vino de imagen | not null                             |
| OrigenEntrada    | varchar(20)    | Cómo se entregó la oferta                               | not null, CHECK IN ('texto', 'imagen', 'ambos') |
| Estado           | varchar(20)    | Etapa del flujo Oferta → Perfil → correo enviado        | not null, CHECK IN ('Analizada', 'PerfilAsignado', 'EnviadaPorCorreo') |
| PerfilId         | int            | Perfil asignado a esta oferta                           | FK Perfil.PerfilId, NULL, ON DELETE NO ACTION |
| FechaAnalisis    | datetime       | Fecha en que se analizó la oferta                       | not null, default: now()                       |
| FechaEnvioCorreo | datetime       | Cuándo se envió el correo con el CV adjunto              | NULL hasta que se envía                        |

Los 8 atributos adicionales (Modalidad, TipoContrato, Moneda, Duracion, Horario, ExperienciaRequerida, StackTecnologico, NivelIdioma) son texto libre a propósito: `EXTRACTOR_OFERTA` los transcribe tal cual los redactó el reclutador, sin forzarlos a categorías fijas, porque cada oferta los expresa de forma distinta.

Duplicados: el back-end valida a nivel de aplicación que no exista otra oferta con el mismo `(CurriculumId, Cargo, Empresa)` normalizado (trim + mayúsculas) antes de crear/actualizar — no es un índice único en la base de datos.

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
| MostrarEnCv    | boolean        | Incluir este registro en el CV (Mi CV / detalle público) | not null, default: 1 |
| AdjuntoSoporte | varchar(500)   | URL de soporte pegada por el usuario (legacy). Se ignora si AdjuntoSoporteBytes tiene valor |  |
| AdjuntoSoporteBytes | longblob | Soporte subido como archivo (carta laboral, contrato — solo PDF, máx. 3 MB) |          |
| AdjuntoSoporteContentType | varchar(100) | Tipo MIME de AdjuntoSoporteBytes (siempre application/pdf) |                    |
| FechaRegistro  | datetime       | Fecha de registro                            | not null, default: now()      |

---

## Tabla: Formacion
| Columna        | Tipo           | Descripción                                 | Reglas                        |
|----------------|----------------|---------------------------------------------|-------------------------------|
| FormacionId    | int            | Identificador único                         | PK, autoincrement, not null   |
| CurriculumId   | int            | CV asociado                                 | FK Curriculum.CurriculumId, not null |
| Titulo         | varchar(200)   | Título obtenido                             |                               |
| Institucion    | varchar(200)   | Institución educativa                        |                               |
| Area           | varchar(300)   | Área de estudio                              |                               |
| FechaInicio    | date           | Fecha de inicio                              |                               |
| FechaFin       | date           | Fecha de finalización                        |                               |
| TipoFormacion  | varchar(50)    | Tipo de formación                            |                               |
| Descripcion    | text           | Descripción adicional                        |                               |
| AdjuntoSoporte | varchar(500)   | URL de soporte pegada por el usuario (legacy). Se ignora si AdjuntoSoporteBytes tiene valor |  |
| AdjuntoSoporteBytes | longblob | Soporte subido como archivo (diploma, certificado — solo PDF, máx. 3 MB) |         |
| AdjuntoSoporteContentType | varchar(100) | Tipo MIME de AdjuntoSoporteBytes (siempre application/pdf) |                    |
| FechaVigencia  | date           | Fecha de vigencia/expiración del certificado |                               |
| DuracionHoras  | int            | Duración en horas (para cursos)              |                               |
| MostrarEnCv    | boolean        | Incluir este registro en el CV (Mi CV / detalle público) | not null, default: 1 |

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
| MostrarEnCv    | boolean        | Si la habilidad se muestra en el CV público | not null, default: 1         |

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
| EsLeida            | boolean        | Indica si el contacto fue leído             | not null, default: 0          |

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
| VisitanteAnonimoId | varchar(36) | Id anónimo (cookie/localStorage) del visitante, para deduplicar Vista/Descarga | opcional |
| VistasAcumuladas | int          | Cuántas veces se acumuló esta misma alerta (deduplicación) | not null, default: 1 |
| VisitanteContactoId | int        | Contacto asociado, si `TipoVisita='Contacto'` | FK VisitanteContacto.VisitanteContactoId, opcional, ON DELETE NO ACTION |
| VisitanteAnonimoIdSiVista    | varchar(36) | Columna generada: `VisitanteAnonimoId` si `TipoVisita='Vista'`, si no NULL | generada, solo lectura |
| VisitanteAnonimoIdSiDescarga | varchar(36) | Columna generada: `VisitanteAnonimoId` si `TipoVisita='Descarga'`, si no NULL | generada, solo lectura |
| VisitanteContactoIdSiContacto | int        | Columna generada: `VisitanteContactoId` si `TipoVisita='Contacto'`, si no NULL | generada, solo lectura |

Las 3 columnas generadas de arriba emulan índices únicos filtrados (`WHERE TipoVisita = ...`) que MariaDB no soporta de forma nativa: cada una vale NULL salvo que se cumpla la condición, y como MariaDB permite múltiples `NULL` en una clave única, el resultado es una alerta "Vista"/"Descarga" deduplicada por `(CurriculumId, VisitanteAnonimoId)` y una alerta "Contacto" única por `VisitanteContactoId`.

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

---

## Tabla: AuditoriaAdmin
Registro append-only de acciones realizadas en el panel de administración.

| Columna         | Tipo           | Descripción                                 | Reglas                        |
|-----------------|----------------|---------------------------------------------|-------------------------------|
| AuditoriaAdminId| int            | Identificador único                         | PK, autoincrement, not null   |
| FechaUtc        | datetime   | Momento del evento, en UTC                  | not null, default: now() |
| ActorUsuarioId  | int            | Usuario que ejecutó la acción                | FK Usuario.UsuarioId, NULL si el actor fue eliminado |
| Accion          | varchar(80)    | Código de la acción (p. ej. `usuario.estado_actualizado`) | not null      |
| EntidadTipo     | varchar(40)    | Tipo de entidad afectada                    | not null                     |
| EntidadId       | int            | Id de la entidad afectada                   |                               |
| DetalleJson     | text           | Detalle adicional en JSON                   |                               |

---

## Tabla: AuditoriaAuth
Registro append-only de eventos de autenticación (login exitoso/fallido, logout).

| Columna         | Tipo           | Descripción                                 | Reglas                        |
|-----------------|----------------|---------------------------------------------|-------------------------------|
| AuditoriaAuthId | int            | Identificador único                         | PK, autoincrement, not null   |
| FechaUtc        | datetime   | Momento del evento, en UTC                  | not null, default: now() |
| ActorUsuarioId  | int            | Usuario autenticado                         | FK Usuario.UsuarioId, NULL en login fallido o si el actor fue eliminado |
| Accion          | varchar(80)    | Código de la acción (`auth.login_exitoso` / `auth.login_fallido` / `auth.logout`) | not null |
| Email           | varchar(256)   | Email involucrado en el intento             | not null                     |
| DetalleJson     | text           | Detalle adicional en JSON                   |                               |
| IpOrigen        | varchar(45)    | IP del cliente (IPv4 o IPv6)                | usada para detectar fuerza bruta en login fallido |

---

## Tabla: AuditoriaCv
Registro append-only de cambios realizados sobre el CV desde el área privada.

| Columna         | Tipo           | Descripción                                 | Reglas                        |
|-----------------|----------------|---------------------------------------------|-------------------------------|
| AuditoriaCvId   | int            | Identificador único                         | PK, autoincrement, not null   |
| FechaUtc        | datetime   | Momento del evento, en UTC                  | not null, default: now() |
| ActorUsuarioId  | int            | Usuario que ejecutó la acción                | FK Usuario.UsuarioId, NULL si el actor fue eliminado |
| CurriculumId    | int            | CV afectado                                 | FK Curriculum.CurriculumId, not null, ON DELETE CASCADE |
| Accion          | varchar(80)    | Código de la acción                         | not null                     |
| EntidadTipo     | varchar(40)    | Tipo de entidad afectada (p. ej. sección del CV) | not null                |
| EntidadId       | int            | Id de la entidad afectada                   |                               |
| DetalleJson     | text           | Detalle adicional en JSON                   |                               |

---

## Tabla: PromptIa
Prompts del asistente de IA, propios de cada CV y editables desde su área privada sin necesidad de desplegar. Cada edición inserta una fila nueva (mismo `CurriculumId`+`Codigo`, `Version+1`) y desactiva la anterior — ninguna columna de una fila existente se sobrescribe, así queda historial completo y se puede reactivar una versión previa.

| Columna                 | Tipo           | Descripción                                 | Reglas                        |
|--------------------------|----------------|---------------------------------------------|-------------------------------|
| PromptIaId               | int            | Identificador único de la fila (versión)    | PK, autoincrement, not null   |
| CurriculumId             | int            | Dueño del prompt                            | FK Curriculum.CurriculumId, not null, ON DELETE CASCADE |
| Codigo                   | varchar(50)    | Identifica el prompt para su dueño, p. ej. `EXTRACTOR_OFERTA` | not null, repetido entre versiones y entre CV distintos |
| Nombre                   | varchar(150)   | Nombre visible en la página de administración | not null                   |
| Descripcion              | varchar(500)   | Descripción de uso del prompt               |                               |
| RolContexto              | text           | Quién es la IA, para qué sistema trabaja    | not null                     |
| Tarea                    | text           | Qué debe hacer exactamente, incluye dónde va el marcador de entrada (p. ej. `{{OFERTA_TEXTO}}`) | not null |
| Reglas                   | text           | Restricciones y casos especiales            | opcional                     |
| FormatoSalida            | text           | Schema/ejemplo exacto de la respuesta esperada | not null                  |
| Ejemplos                 | text           | Ejemplos few-shot                           | opcional                     |
| Contenido                | text           | Texto final ensamblado por la app a partir de las 5 columnas de arriba | not null, nunca se edita a mano |
| Version                  | int            | Número de versión dentro del mismo `Codigo` (por CV) | not null, default: 1 |
| EsActivo                 | boolean        | Si es la versión vigente para ese `Codigo`  | not null, default: 1, solo una fila activa por (`CurriculumId`, `Codigo`) |
| FechaCreacion            | datetime       | Momento en que se creó esta versión, en UTC | not null, default: now() |
| ActualizadoPorUsuarioId  | int            | Usuario que creó esta versión (siempre el propio dueño, self-service) | FK Usuario.UsuarioId, NULL si el actor fue eliminado |
| CodigoSiActivo           | varchar(50)    | Columna generada: `Codigo` si `EsActivo=1`, si no NULL | generada, solo lectura |

Índices únicos `(CurriculumId, Codigo)` filtrado por `EsActivo=1` y `(CurriculumId, Codigo, Version)`, más `(CurriculumId, Codigo)` de apoyo para listar el historial — la unicidad de `Codigo` es siempre relativa a cada CV, nunca global.

---

## Tabla: ProveedorIa
Conexión con proveedores de IA **global de toda la plataforma** (no por CV) — administrada exclusivamente por el rol Admin. Se pueden guardar **varias** conexiones (Claude, OpenAI, Gemini, Groq, Ollama/self-hosted, otro) pero siempre hay como máximo una marcada `EsActivo=1` en toda la base, y esa es la que usan "Analizar Oferta" y los prompts de `PromptIa` de cualquier CV para invocar al modelo. No versionado: editar una conexión sobrescribe sus columnas.

| Columna             | Tipo           | Descripción                                 | Reglas                        |
|----------------------|----------------|-----------------------------------------------|-------------------------------|
| ProveedorIaId  | int            | Identificador único                          | PK, autoincrement, not null   |
| Proveedor            | varchar(20)    | Proveedor de IA elegido                       | not null, CHECK IN ('claude', 'openai', 'gemini', 'groq', 'ollama', 'otro') |
| Nombre               | varchar(100)   | Alias opcional para distinguir varias conexiones del mismo proveedor (p. ej. "Cuenta trabajo" vs "Cuenta personal") | opcional |
| Modelo               | varchar(100)   | Modelo a usar (p. ej. `claude-opus-4-20250514`) | opcional, si se omite se usa el modelo por defecto del proveedor |
| Endpoint             | varchar(500)   | URL del servidor                              | opcional; **obligatorio** para proveedores self-hosted (hoy, `ollama`) |
| ApiKeyCifrada        | text           | Clave de API, cifrada con AES-256-GCM (`AesGcmApiKeyCipher`, clave en `Encryption:Key`) | opcional (Ollama local normalmente no la requiere); **nunca se devuelve al front-end** ni cifrada ni en texto plano; requerida para claude/openai/gemini |
| EsActivo             | boolean        | Si es la conexión activa de toda la plataforma | not null, default: 0, a lo sumo una activa (índice único filtrado) |
| FechaCreacion        | datetime       | Momento en que se guardó esta conexión, en UTC | not null, default: now() |
| FechaActualizacion   | datetime       | Momento del último guardado, en UTC          | not null, default: now() |
| EsActivoUnico        | tinyint        | Columna generada: `1` si `EsActivo=1`, si no NULL | generada, solo lectura |

Índice único `EsActivoUnico` (mismo patrón de columna generada que la unicidad de versión activa en `PromptIa`) — garantiza que nunca haya dos conexiones activas al mismo tiempo en toda la plataforma. Si se elimina la conexión activa y quedan otras, el backend activa automáticamente la más reciente.

---

## Tabla: ConfiguracionCorreo
Configuración SMTP para enviar correos a reclutadores desde el flujo Analizar Oferta → Enviar correo. Una por CV — el remitente/login SMTP siempre es `Personales.Email`, no se guarda un usuario aparte. La contraseña se cifra igual que `ProveedorIa.ApiKeyCifrada`.

| Columna               | Tipo           | Descripción                                 | Reglas                        |
|-----------------------|----------------|----------------------------------------------|-------------------------------|
| ConfiguracionCorreoId | int            | Identificador único                          | PK, autoincrement, not null   |
| CurriculumId          | int            | CV dueño de la configuración                  | FK Curriculum.CurriculumId, not null, ON DELETE CASCADE, UNIQUE (una por CV) |
| Host                  | varchar(200)   | Servidor SMTP                                 | not null, default: 'smtp.gmail.com' |
| Puerto                | int            | Puerto SMTP                                   | not null, default: 587        |
| UsarTls               | boolean        | Si la conexión usa TLS                        | not null, default: 1          |
| PasswordCifrada       | text           | Contraseña SMTP, cifrada con AES-256-GCM       | opcional; **nunca se devuelve al front-end** |
| FechaCreacion         | datetime       | Momento en que se guardó esta configuración, en UTC | not null, default: now() |
| FechaActualizacion    | datetime       | Momento del último guardado, en UTC          | not null, default: now()      |