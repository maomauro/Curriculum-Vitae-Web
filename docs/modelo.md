**Modelo de datos completo** (alineado con Documentacion.md):
---

# 🧩 **1. Entidades principales del dominio**

Estas son las tablas raíz del sistema:

- **Usuario**
- **Curriculum** (1 por usuario)
- **Personales**
- **Perfil**
- **Experiencia**
- **Formacion**
- **Habilidad**
- **Proyecto**
- **Referencia** (laborales y personales, una sola tabla)
- **FamiliarContacto**
- **RedSocial**
- **VisitanteContacto**
- **AlertaVisita**
- **VisibilidadSeccion**
- **EstadisticasPublicas** (vista materializada)
- **Rol**
- **UsuarioRol**

---

# 🧱 **2. Relaciones principales**

Aquí está la estructura conceptual:

```
Usuario 1 — 1 Curriculum
Curriculum 1 — 1 Personales
Curriculum 1 — N Perfil
Curriculum 1 — N Experiencia
Curriculum 1 — N Formacion
Curriculum 1 — N Habilidad
Curriculum 1 — N Proyecto
Curriculum 1 — N Referencia
Curriculum 1 — N FamiliarContacto
Curriculum 1 — N RedSocial
Curriculum 1 — N VisitanteContacto
Curriculum 1 — N AlertaVisita
Curriculum 1 — N VisibilidadSeccion
Curriculum 1 — 1 EstadisticasPublicas
Usuario N — N Rol (via UsuarioRol)
```

---

# 🧩 **3. Estructura completa de tablas (versión final)**

A continuación te dejo **todas las tablas**, organizadas por categoría.

---

# 🟦 **A. Seguridad y usuarios**

## **Usuario**
- UsuarioId (PK)
- Email
- PasswordHash
- Estado
- FechaRegistro

## **Rol**
- RolId (PK)
- NombreRol (Visitante, Publicador, Admin)
- Descripcion

## **UsuarioRol**
- UsuarioRolId (PK)
- UsuarioId (FK)
- RolId (FK)

---

# 🟩 **B. Curriculum (agregado raíz)**

## **Curriculum**
- CurriculumId (PK)
- UsuarioId (FK, UNIQUE)
- UrlPublica
- Estado
- ContadorVisitas
- ContadorContactos
- FechaCreacion
- FechaActualizacion

---

# 🟧 **C. Información personal**

## **Personales** (1 a 1 con Curriculum)
- PersonalesId (PK)
- CurriculumId (FK)
### Información de Identificación
- TipoIdentificacion
- NumeroDocumento
- FechaExpedicion
- LugarExpedicion
- LibretaMilitarNumero
- LibretaMilitarClase
- PasaporteNumero
- PasaporteVigencia
- VisaNumero
- VisaVigencia
- VisaClase
### Datos Básicos
- PrimerNombre
- SegundoNombre
- PrimerApellido
- SegundoApellido
- FechaNacimiento
- LugarNacimiento
- Genero
- Nacionalidad
- TipoSangre
- EPS
- Pencion
- Cesantias
### Información de Contacto
- Email
- Celular
- TelefonoFijo
### Información de Residencia
- Pais
- Departamento
- Ciudad
- Barrio
- CodigoPostal
- Direccion
- TipoResidencia

---

# 🟨 **D. Contactos y redes (hijas de Curriculum)**

## **Referencia** (laborales y personales)
- ReferenciaId (PK)
- CurriculumId (FK)
- TipoReferencia (Laboral | Personal)
- ExperienciaId (FK, opcional) — si es laboral, experiencia que avala
- Nombre
- Apellido
- Email
- Telefono
- Parentesco (si es personal)
- Cargo, Empresa, Relacion, Observaciones, AdjuntoSoporte (si es laboral, opcionales)
- FechaRegistro

## **FamiliarContacto**
- FamiliarId (PK)
- CurriculumId (FK)
- Parentesco
- Nombres
- Apellidos
- Email
- Telefono
- EsContactoPrincipal (bool)

## **RedSocial**
- RedSocialId (PK)
- CurriculumId (FK)
- NombreRed
- LinkPublico
- UsuarioContacto

---

# 🟦 **E. Perfil profesional**

## **Perfil**
- PerfilId (PK)
- CurriculumId (FK)
- NombrePerfil
- DescripcionPerfil
- AspiracionSalarialPesos
- AspiracionSalarialDolares

---

# 🟫 **F. Experiencia laboral**

## **Experiencia**
- ExperienciaId (PK)
- CurriculumId (FK)
- Empresa
- Cargo
- Sector
- FechaInicio
- FechaFin
- TipoContrato
- MotivoRetiro
- Funciones
- FechaRegistro

---

# 🟪 **G. Formación académica**

## **Formacion**
- FormacionId (PK)
- CurriculumId (FK)
- Titulo
- Institucion
- Area
- FechaInicio
- FechaFin
- TipoFormacion
- Descripcion
- AdjuntoSoporte

---

# 🟩 **H. Habilidades**

## **Habilidad**
- HabilidadId (PK)
- CurriculumId (FK)
- Nombre
- Tipo (Tecnica, Blanda, Idioma, Otra)
- Nivel (Basico, Intermedio, Avanzado, Experto)
- Descripcion

---

# 🟦 **I. Proyectos**

## **Proyecto**
- ProyectoId (PK)
- CurriculumId (FK)
- NombreProyecto
- Rol
- EquipoTamano
- DuracionMeses
- StackTecnologico
- Aporte
- Logro
- Desafio

---

# 🟧 **J. Visitantes y alertas**

## **VisitanteContacto**
- VisitanteContactoId (PK)
- CurriculumId (FK)
- Nombre
- Correo
- Empresa
- MotivoContacto
- ComoMeEncontraste
- Mensaje
- FechaContacto

## **AlertaVisita**
- AlertaVisitaId (PK)
- CurriculumId (FK)
- FechaVisita
- Origen
- TipoVisita (SoloVista / ConContacto)

---

# 🟫 **K. Configuración**

## **VisibilidadSeccion**
- VisibilidadSeccionId (PK)
- CurriculumId (FK)
- NombreSeccion
- EsVisible (bool)

---

# 🟦 **L. Estadísticas**

## **EstadisticasPublicas** (vista materializada)
- EstadisticasId (PK)
- CurriculumId (FK)
- TotalVisitas
- TotalContactos
- UltimaVisita
- FechaActualizacion

---

# 🎯 **¿Qué logramos con este modelo?**

- Está **completo**, **coherente** y **normalizado**.
- Respeta la regla: **un usuario = un CV**.
- **Referencia** en una sola tabla (TipoReferencia: Laboral | Personal), vinculada a Curriculum; ExperienciaId opcional para referencias laborales.
- Separa correctamente: Familiares, Redes sociales, Visitantes y alertas, Visibilidad.
- Vista **EstadisticasPublicas** para métricas de visitas y contactos.
- Permite escalar sin romper nada.
- Alineado con la documentación base del proyecto (Documentacion.md).

---

**Ver también:** [Documentacion.md](Documentacion.md) (visión y modelo de alto nivel) · [Backlog.md](Backlog.md) · [database/01_CreateSchema.sql](../database/01_CreateSchema.sql) (script DDL)

---

