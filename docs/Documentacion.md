---

# 📚 DOCUMENTACIÓN BASE DEL PORTAL DE CURRÍCULUM VITAE

## Versión 1.0 - Fundamentos del Sistema

**Referencias:** [Backlog](Backlog.md) · [modelo de datos](modelo.md) · [Despliegue / CI-CD](Despliegue.md) · [Guía Git](Guia-git.md) · [database/README](../database/README.md)

---

## 1. VISIÓN GENERAL DEL PROYECTO

### 1.1 Propósito del Sistema

**Portal de Currículum Vitae** es una plataforma web diseñada para conectar profesionales (publicadores) con reclutadores y empresas (visitantes) interesadas en su talento. El sistema opera bajo un modelo **100% público y transparente**, donde todos los currículums vitae son accesibles sin necesidad de registro, y las estadísticas de cada perfil están disponibles para cualquier visitante.

### 1.2 Filosofía del Producto

```
🌟 PRINCIPIOS RECTORES
├── 1. Acceso sin barreras
│   └── Cualquier reclutador puede ver CVs sin registrarse
├── 2. Transparencia total
│   └── Todas las estadísticas son públicas
├── 3. Confianza
│   └── Los profesionales controlan su información
└── 4. Conexión directa
    └── Contacto simple entre reclutadores y talento
```

### 1.3 Objetivos Estratégicos

| Objetivo | Descripción | Métrica de Éxito |
|----------|-------------|-------------------|
| **Maximizar visibilidad** | Todos los CVs son públicos por defecto | >10,000 visitas/mes al portal |
| **Facilitar la conexión** | Reclutadores contactan sin barreras | >200 contactos/mes |
| **Empoderar profesionales** | Control total sobre su información | >80% de usuarios activos editan su CV |
| **Generar confianza** | Transparencia en estadísticas | >90% de reclutadores consultan métricas |

### 1.4 Usuarios del Sistema

| Usuario | Descripción | Autenticación | Necesidades Principales |
|---------|-------------|---------------|------------------------|
| **Visitante / Reclutador** | Persona o empresa buscando talento | **NO requiere** | Buscar CVs, ver estadísticas, contactar candidatos |
| **Publicador** | Profesional dueño de un CV | **SÍ requiere** | Crear/editar su CV, ver quién lo contacta, configurar privacidad |
| **Administrador** | Gestor del portal | **SÍ requiere** | Moderar contenido, gestionar usuarios, monitorear sistema |

### 1.5 Flujo de Usuarios

```
🌐 VISITANTE / RECLUTADOR (Sin autenticación)
┌─────────────────────────────────────────────────────┐
│  1. Llega al portal desde buscador o referencia     │
│  2. Busca profesionales por palabras clave          │
│  3. Filtra resultados por ciudad, habilidades, etc. │
│  4. Selecciona un CV de interés                     │
│  5. Ve detalle completo del profesional             │
│  6. Consulta estadísticas (visitas, contactos)      │
│  7. Decide contactar → llena formulario simple      │
│  8. Recibe confirmación de envío                    │
└─────────────────────────────────────────────────────┘

👤 PUBLICADOR (Con autenticación)
┌─────────────────────────────────────────────────────┐
│  1. Se registra en el portal                        │
│  2. Completa su información personal                │
│  3. Agrega experiencia laboral                      │
│  4. Añade formación académica                       │
│  5. Lista habilidades y proyectos                   │
│  6. Configura qué información mostrar               │
│  7. Publica su CV                                   │
│  8. Recibe notificaciones de contactos              │
│  9. Monitorea estadísticas de su CV                 │
└─────────────────────────────────────────────────────┘
```

---

## 2. COMPONENTES DEL SISTEMA

### 2.1 Tabla de Componentes por Tipo y Acceso

| Componente | Tipo | Descripción | Visitante | Publicador | Admin |
|------------|------|-------------|-----------|------------|-------|
| **Landing Page** | Vista | Página principal con buscador y CVs destacados | ✅ | ✅ | ✅ |
| **Listado de CVs** | Vista | Resultados de búsqueda paginados | ✅ | ✅ | ✅ |
| **Detalle de CV** | Vista | Visualización completa del CV | ✅ | ✅ | ✅ |
| **Dashboard Público** | Vista | Estadísticas y métricas del CV | ✅ | ✅ | ✅ |
| **Formulario Contacto** | Formulario | Para reclutadores contactar profesionales | ✅ | ✅ | ✅ |
| **Registro** | Formulario | Creación de cuenta para publicadores | ❌ | ✅ | ✅ |
| **Login** | Formulario | Acceso al sistema para publicadores | ❌ | ✅ | ✅ |
| **Editor CV** | Formularios | Gestión completa del CV (CRUD) | ❌ | ✅ | ✅ |
| - Personales | Formulario | Datos personales del profesional | ❌ | ✅ | ✅ |
| - Perfil | Formulario | Perfiles y aspiraciones profesionales | ❌ | ✅ | ✅ |
| - Experiencia | Formulario | Historial laboral | ❌ | ✅ | ✅ |
| - Formación | Formulario | Estudios y capacitaciones | ❌ | ✅ | ✅ |
| - Habilidades | Formulario | Competencias profesionales | ❌ | ✅ | ✅ |
| - Proyectos | Formulario | Proyectos destacados | ❌ | ✅ | ✅ |
| - Referencias | Formulario | Referencias personales/laborales | ❌ | ✅ | ✅ |
| - Redes Sociales | Formulario | Perfiles sociales profesionales | ❌ | ✅ | ✅ |
| - Familiares | Formulario | Contactos de emergencia | ❌ | ✅ | ✅ |
| **Configuración Visibilidad** | Configuración | Activar/desactivar secciones del CV | ❌ | ✅ | ✅ |
| **Alertas Privadas** | Vista | Notificaciones de contactos recibidos | ❌ | ✅ | ✅ |
| **Estadísticas Detalladas** | Vista | Análisis profundo para publicadores | ❌ | ✅ | ✅ |
| **Gestión de Roles** | Configuración | Administración de roles del sistema | ❌ | ❌ | ✅ |
| **Gestión de Usuarios** | Configuración | Administración de publicadores | ❌ | ❌ | ✅ |
| **Auditoría** | Vista | Logs y monitoreo del sistema | ❌ | ❌ | ✅ |

### 2.2 Módulos del Sistema

```
PORTAL DE CURRÍCULUM VITAE
│
├── 🌐 MÓDULO PÚBLICO (Acceso libre)
│   ├── Landing Page
│   ├── Búsqueda de CVs
│   ├── Listado de Resultados
│   ├── Vista Detalle CV
│   ├── Dashboard Público
│   └── Contacto Rápido
│
├── 🔐 MÓDULO DE AUTENTICACIÓN (Para publicadores)
│   ├── Registro
│   ├── Login
│   └── Recuperación de Contraseña
│
├── 📋 MÓDULO DE GESTIÓN DE CV (Privado - Publicadores)
│   ├── Editor de CV
│   │   ├── Datos Personales
│   │   ├── Perfil Profesional
│   │   ├── Experiencia Laboral
│   │   ├── Formación Académica
│   │   ├── Habilidades
│   │   ├── Proyectos
│   │   ├── Referencias
│   │   └── Redes Sociales
│   └── Previsualización
│
├── ⚙️ MÓDULO DE CONFIGURACIÓN (Privado - Publicadores)
│   ├── Visibilidad de Secciones
│   └── Preferencias de Cuenta
│
├── 📊 MÓDULO DE SEGUIMIENTO (Privado - Publicadores)
│   ├── Dashboard Personal
│   ├── Alertas de Contacto
│   └── Estadísticas Detalladas
│
└── 👑 MÓDULO DE ADMINISTRACIÓN (Privado - Admin)
    ├── Gestión de Roles
    ├── Gestión de Usuarios
    └── Auditoría del Sistema
```

---

## 3. MODELO DE SEGURIDAD Y PERMISOS

### 3.1 Roles del Sistema

| Rol | Código | Autenticación | Descripción |
|-----|--------|---------------|-------------|
| **Visitante** | `VISITOR` | **NO** | Usuario no autenticado que consulta información pública |
| **Publicador** | `PUBLISHER` | **SÍ** | Profesional dueño de un CV |
| **Administrador** | `ADMIN` | **SÍ** | Superusuario con control total del sistema |

### 3.2 Matriz de Permisos

#### 🌐 Módulo Público (Acceso Universal)

| Recurso | Acción | Visitante | Publicador | Admin |
|---------|--------|-----------|------------|-------|
| CVs | Ver listado | ✅ | ✅ | ✅ |
| CVs | Ver detalle | ✅ | ✅ | ✅ |
| CVs | Buscar | ✅ | ✅ | ✅ |
| CVs | Ver estadísticas | ✅ | ✅ | ✅ |
| Contacto | Enviar mensaje | ✅ | ✅ | ✅ |

#### 🔐 Módulo de Gestión de CV (Privado)

| Recurso | Acción | Visitante | Publicador | Admin |
|---------|--------|-----------|------------|-------|
| CV Propio | Crear | ❌ | ✅ | ✅ |
| CV Propio | Editar | ❌ | ✅ | ✅ |
| CV Propio | Eliminar | ❌ | ✅ | ✅ |
| Datos Personales | Gestionar | ❌ | ✅ | ✅ |
| Experiencia | Gestionar | ❌ | ✅ | ✅ |
| Formación | Gestionar | ❌ | ✅ | ✅ |
| Habilidades | Gestionar | ❌ | ✅ | ✅ |
| Proyectos | Gestionar | ❌ | ✅ | ✅ |
| Referencias | Gestionar | ❌ | ✅ | ✅ |
| Visibilidad | Configurar | ❌ | ✅ | ✅ |

#### 📊 Módulo de Seguimiento (Privado)

| Recurso | Acción | Visitante | Publicador | Admin |
|---------|--------|-----------|------------|-------|
| Alertas | Ver propias | ❌ | ✅ | ✅ |
| Contactos | Ver recibidos | ❌ | ✅ | ✅ |
| Estadísticas | Ver detalladas | ❌ | ✅ | ✅ |

#### 👑 Módulo de Administración (Privado - Admin)

| Recurso | Acción | Visitante | Publicador | Admin |
|---------|--------|-----------|------------|-------|
| Roles | Gestionar | ❌ | ❌ | ✅ |
| Usuarios | Gestionar | ❌ | ❌ | ✅ |
| CVs | Gestionar cualquier | ❌ | ❌ | ✅ |
| Auditoría | Ver logs | ❌ | ❌ | ✅ |

### 3.3 Políticas de Seguridad Clave

```
🔐 PARA INFORMACIÓN PÚBLICA
├── Rate limiting por IP (100 req/min)
├── Cacheo agresivo (TTL: 5-60 minutos)
├── Datos sensibles parcialmente ocultos
│   └── Email: jua...@gmail.com
│   └── Teléfono: 300***4567
└── Protección contra scraping

🔐 PARA INFORMACIÓN PRIVADA
├── Autenticación JWT (expiración 15 min)
├── Refresh tokens en HttpOnly cookies
├── Autorización por roles (RBAC)
├── Validación de propiedad (solo dueño)
└── 2FA opcional para administradores
```

---

## 4. MODELO DE DATOS

### 4.1 Entidades Principales

```
SEGURIDAD Y USUARIOS
├── Usuario
├── Rol
└── UsuarioRol

NÚCLEO DEL CV
├── Curriculum (Raíz - 1 por usuario)
└── Personales

INFORMACIÓN PROFESIONAL
├── Perfil (puede tener múltiples perfiles)
├── Experiencia
├── Formacion
├── Habilidad
└── Proyecto

CONTACTOS Y REDES
├── Referencia (laborales y personales)
├── FamiliarContacto
└── RedSocial

INTERACCIÓN Y SEGUIMIENTO
├── VisitanteContacto (contactos de reclutadores)
├── AlertaVisita (registro de visitas)
└── VisibilidadSeccion (configuración por sección)

ESTADÍSTICAS
└── EstadisticasPublicas (vista materializada)
```

### 4.2 Diccionario de Datos

#### Usuario
| Campo | Tipo | Descripción |
|-------|------|-------------|
| UsuarioId | PK int | Identificador único |
| Email | string(100) | Email único para login |
| PasswordHash | string(255) | Hash de contraseña |
| Estado | string(20) | Activo/Inactivo/Bloqueado |
| FechaRegistro | datetime | Fecha de creación |

#### Curriculum
| Campo | Tipo | Descripción |
|-------|------|-------------|
| CurriculumId | PK int | Identificador único |
| UsuarioId | FK int | Dueño del CV (unique) |
| UrlPublica | string(255) | URL amigable para compartir |
| Estado | string(20) | Borrador/Publicado/Oculto |
| ContadorVisitas | int | Visitas totales (público) |
| ContadorContactos | int | Contactos totales (público) |

#### Personales
| Campo | Tipo | Descripción |
|-------|------|-------------|
| PersonalesId | PK int | Identificador único |
| CurriculumId | FK int | Relación 1:1 con CV |
| PrimerNombre | string(50) | (requerido) |
| PrimerApellido | string(50) | (requerido) |
| Email | string(100) | Contacto |
| Celular | string(20) | Contacto |
| Ciudad | string(50) | Ubicación |
| ... | ... | +40 campos adicionales |

#### EstadisticasPublicas
| Campo | Tipo | Descripción |
|-------|------|-------------|
| EstadisticasId | PK int | Identificador único |
| CurriculumId | FK int | Relación 1:1 |
| TotalVisitas | int | Acumulado de visitas |
| TotalContactos | int | Acumulado de contactos |
| UltimaVisita | datetime | Fecha última visita |
| FechaActualizacion | datetime | Última actualización |

#### Referencia
| Campo | Tipo | Descripción |
|-------|------|-------------|
| ReferenciaId | PK int | Identificador único |
| CurriculumId | FK int | CV al que pertenece |
| TipoReferencia | string(20) | Laboral \| Personal |
| ExperienciaId | FK int (opcional) | Si es laboral, experiencia que avala |
| Nombre | string(100) | Nombre del referente |
| Apellido | string(100) | Apellido |
| Email | string(100) | Contacto |
| Telefono | string(20) | Contacto |
| Parentesco | string(50) | Si es personal |
| Cargo, Empresa, Relacion, etc. | — | Si es laboral (opcionales) |

### 4.3 Relaciones Clave

```
Usuario (1) ———— (1) Curriculum
Curriculum (1) ———— (1) Personales
Curriculum (1) ———— (N) Perfil
Curriculum (1) ———— (N) Experiencia
Curriculum (1) ———— (N) Referencia
Curriculum (1) ———— (N) Formacion
Curriculum (1) ———— (N) Habilidad
Curriculum (1) ———— (N) Proyecto
Curriculum (1) ———— (N) FamiliarContacto
Curriculum (1) ———— (N) RedSocial
Curriculum (1) ———— (N) VisitanteContacto
Curriculum (1) ———— (N) AlertaVisita
Curriculum (1) ———— (N) VisibilidadSeccion
Curriculum (1) ———— (1) EstadisticasPublicas
Usuario (N) ———— (N) Rol (vía UsuarioRol)
```

### 4.4 Tabla Referencia (unificada)

Se usa una sola tabla **Referencia** vinculada a **Curriculum**, que agrupa tanto referencias laborales como personales. Se distingue el tipo con el campo `TipoReferencia` (Laboral | Personal). Para referencias laborales puede usarse `ExperienciaId` (FK opcional) para indicar a qué experiencia pertenecen.

---

## 5. DIAGRAMA ENTIDAD RELACIÓN

```
┌─────────────┐        ┌─────────────┐        ┌─────────────┐
│   Usuario   │        │  Curriculum │        │ Personales  │
├─────────────┤        ├─────────────┤        ├─────────────┤
│ UsuarioId PK│──────▶│CurriculumId  │◀──────│PersonalesId │
│ Email       │1      1│ UsuarioId FK│       1│CurriculumId │
│ PasswordHash│        │ UrlPublica  │        │ PrimerNombre│
│ Estado      │        │ Estado      │        │ PrimerApell.│
└─────────────┘        │ ContVisitas │        │ Email       │
                       │ ContContact │        └─────────────┘
                       └─────────────┘
                            │
          ┌─────────────────┼─────────────────┬─────────────────┐
          │                 │                 │                 │
          ▼                 ▼                 ▼                 ▼
   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌──────────────┐
   │ Experiencia │   │  Formacion  │   │  Habilidad  │   │  Referencia  │
   ├─────────────┤   ├─────────────┤   ├─────────────┤   ├──────────────┤
   │ExpId PK     │   │FormId PK    │   │HabId PK     │   │ReferenciaId  │
   │CurriculumId │   │CurriculumId │   │CurriculumId │   │CurriculumId  │
   │Empresa      │   │Titulo       │   │Nombre       │   │TipoReferencia│
   │Cargo        │   │Institucion  │   │Tipo         │   │Nombre        │
   └─────────────┘   └─────────────┘   └─────────────┘   │Telefono      │
                                                         └──────────────┘

┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│VisitanteCont│   │AlertaVisita │   │Visibilidad  │
├─────────────┤   ├─────────────┤   ├─────────────┤
│VContId PK   │   │AlertaId PK  │   │VisId PK     │
│CurriculumId │   │CurriculumId │   │CurriculumId │
│Nombre       │   │FechaVisita  │   │NombreSeccion│
│Correo       │   │TipoVisita   │   │EsVisible    │
│Mensaje      │   └─────────────┘   └─────────────┘
└─────────────┘

┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│Estadisticas │   │    Rol      │   │ UsuarioRol  │
├─────────────┤   ├─────────────┤   ├─────────────┤
│EstId PK     │   │RolId PK     │   │UsuRolId PK  │
│CurriculumId │   │NombreRol    │   │UsuarioId FK │
│TotalVisitas │   │Descripcion  │   │RolId FK     │
│TotalContact │   └─────────────┘   └─────────────┘
└─────────────┘
```

---

## 6. DIAGRAMAS DE ARQUITECTURA

### 6.1 Arquitectura de Capas

```
┌────────────────────────────────────────────────────────────┐
│                    CAPA DE PRESENTACIÓN                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Angular / React SPA                     │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │  │
│  │  │  Módulo     │  │  Módulo     │  │  Módulo     │   │  │
│  │  │  Público    │  │  Autentic.  │  │  Editor CV  │   │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘   │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │  │
│  │  │  Módulo     │  │  Módulo     │  │  Módulo     │   │  │
│  │  │  Seguimiento│  │  Config.    │  │  Admin      │   │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘   │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      API GATEWAY                            │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  • Rate Limiting      • Autenticación JWT             │  │
│  │  • Caché (Redis)      • Logging Centralizado          │  │
│  │  • Compresión         • Enrutamiento                  │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      CAPA DE NEGOCIO                        │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Controladores por dominio:                           │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │  │
│  │  │   Auth   │ │  Public  │ │    CV    │ │   Stats  │  │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘  │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │  │
│  │  │  Admin   │ │  Alertas │ │  Config  │ │  Search  │  │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Servicios de Negocio:                                │  │
│  │  • Validación de CV    • Cálculo de estadísticas      │  │
│  │  • Gestión de permisos  • Búsqueda y filtrado         │  │
│  │  • Notificaciones       • Exportación de datos        │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────┐
│                      CAPA DE DATOS                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │  │
│  │  │   SQL DB    │  │    Redis    │  │    Blob     │   │  │
│  │  │  (Principal)│  │   (Caché)   │  │  Storage    │   │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘   │  │
│  │                                                      │  │
│  │  • Entity Framework / Prisma (ORM)                   │  │
│  │  • Migraciones automáticas                           │  │
│  │  • Vistas materializadas para estadísticas           │  │
│  │  • Índices optimizados para búsqueda                 │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

### 6.2 Flujo de Datos por Tipo de Usuario

```
🌐 VISITANTE (Sin autenticación)
┌────────┐    ┌────────┐    ┌────────┐    ┌────────┐
│ Cliente│───▶│  CDN   │───▶│  API   │───▶│ Caché  │
└────────┘    └────────┘    └────────┘    └────────┘
                                   │
                                   ▼
                              ┌────────┐
                              │   DB   │
                              └────────┘
Flujo:
1. Request del cliente
2. CDN sirve contenido estático
3. API consulta caché (Redis)
4. Si no está en caché → consulta DB
5. Almacena en caché (TTL: 5 min)
6. Responde al cliente

👤 PUBLICADOR (Autenticado)
┌────────┐    ┌────────┐    ┌────────┐    ┌────────┐
│ Cliente│───▶│  Auth  │───▶│  API   │───▶│   DB   │
└────────┘    └────────┘    └────────┘    └────────┘
                    │                           │
                    ▼                           ▼
               ┌────────┐                 ┌────────┐
               │  JWT   │                 │  Blob  │
               └────────┘                 └────────┘
Flujo:
1. Request con JWT
2. Validación de token
3. Verificación de permisos
4. Operación en DB (sin caché para datos propios)
5. Respuesta al cliente
```

---

## 7. MAPA DE NAVEGACIÓN

### 7.1 Estructura de Navegación

```
PORTAL DE CURRÍCULUM VITAE
│
├── 🌐 SECCIÓN PÚBLICA (Acceso libre)
│   │
│   ├── 🏠 Landing Page
│   │   ├── Buscador principal
│   │   ├── CVs destacados
│   │   ├── Categorías populares
│   │   └── Estadísticas del portal
│   │
│   ├── 🔍 Búsqueda de CVs
│   │   ├── Resultados paginados
│   │   ├── Filtros: Ciudad, Habilidades, Experiencia
│   │   ├── Ordenar por: Relevancia, Fecha, Visitas
│   │   └── Vista de tarjetas / Vista de lista
│   │
│   ├── 👤 Detalle de CV
│   │   ├── Información personal (ocultando datos sensibles)
│   │   ├── Perfil profesional
│   │   ├── Experiencia laboral
│   │   ├── Formación académica
│   │   ├── Habilidades
│   │   ├── Proyectos
│   │   ├── Referencias (si aplica)
│   │   └── Botón "Contactar profesional"
│   │
│   ├── 📊 Dashboard Público
│   │   ├── Métricas generales (visitas, contactos)
│   │   ├── Gráfico de visitas por período
│   │   ├── Distribución de contactos
│   │   └── Timeline de actividad
│   │
│   └── 📝 Formulario de Contacto
│       ├── Nombre del reclutador
│       ├── Email de contacto
│       ├── Empresa (opcional)
│       ├── Mensaje
│       └── Confirmación de envío
│
├── 🔐 SECCIÓN DE AUTENTICACIÓN
│   │
│   ├── 📝 Registro
│   │   ├── Email
│   │   ├── Contraseña
│   │   ├── Confirmar contraseña
│   │   ├── Aceptar términos
│   │   └── Confirmación de registro
│   │
│   ├── 🔑 Login
│   │   ├── Email
│   │   ├── Contraseña
│   │   ├── Recordar sesión
│   │   └── Recuperar contraseña
│   │
│   └── 🔄 Recuperación de Contraseña
│       ├── Solicitar reset
│       ├── Verificar código
│       └── Nueva contraseña
│
├── 📋 SECCIÓN PRIVADA - PUBLICADOR
│   │
│   ├── 🏢 Mi CV
│   │   ├── 👤 Datos Personales
│   │   │   ├── Información de identificación
│   │   │   ├── Datos básicos
│   │   │   ├── Contacto
│   │   │   └── Residencia
│   │   │
│   │   ├── 🎯 Perfil Profesional
│   │   │   ├── Nombre del perfil
│   │   │   ├── Descripción
│   │   │   └── Aspiración salarial
│   │   │
│   │   ├── 💼 Experiencia Laboral
│   │   │   ├── Listado de experiencias
│   │   │   ├── Agregar/Editar experiencia
│   │   │   └── Referencia laboral asociada
│   │   │
│   │   ├── 🎓 Formación Académica
│   │   │   ├── Listado de formaciones
│   │   │   └── Agregar/Editar formación
│   │   │
│   │   ├── ⭐ Habilidades
│   │   │   ├── Técnicas
│   │   │   ├── Blandas
│   │   │   └── Idiomas
│   │   │
│   │   ├── 🚀 Proyectos
│   │   │   ├── Listado de proyectos
│   │   │   └── Agregar/Editar proyecto
│   │   │
│   │   ├── 👥 Referencias
│   │   │   ├── Personales
│   │   │   └── Laborales
│   │   │
│   │   ├── 🔗 Redes Sociales
│   │   │   └── LinkedIn, GitHub, etc.
│   │   │
│   │   └── 👪 Contactos Familiares
│   │       └── Contactos de emergencia
│   │
│   ├── ⚙️ Configuración
│   │   ├── 👁️ Visibilidad de Secciones
│   │   │   ├── Activar/Desactivar secciones
│   │   │   └── Vista previa de cambios
│   │   └── 🧑 Preferencias de Cuenta
│   │       ├── Cambiar email
│   │       ├── Cambiar contraseña
│   │       └── Cerrar cuenta
│   │
│   └── 📊 Seguimiento
│       ├── 📈 Dashboard Personal
│       │   ├── Visitas (detallado)
│       │   ├── Contactos (detallado)
│       │   └── Comparativas
│       │
│       ├── 🔔 Alertas
│       │   ├── Nuevos contactos
│       │   ├── Nuevas visitas
│       │   └── Historial
│       │
│       └── 📋 Contactos Recibidos
│           ├── Lista de mensajes
│           ├── Ver detalle
│           └── Marcar como leído
│
└── 👑 SECCIÓN PRIVADA - ADMIN
    │
    ├── 👥 Gestión de Usuarios
    │   ├── Listado de publicadores
    │   ├── Activar/Desactivar
    │   └── Ver detalles
    │
    ├── 🎭 Gestión de Roles
    │   ├── Listado de roles
    │   ├── Crear/Editar roles
    │   └── Asignar permisos
    │
    └── 📋 Auditoría
        ├── Logs del sistema
        ├── Actividad reciente
        └── Reportes
```

### 7.2 Mapa de Navegación Visual

```
┌─────────────────────────────────────────────────────────────────┐
│                        LANDING PAGE                             │
│                      (Búsqueda + Destacados)                    │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
┌─────────────────────────┐      ┌─────────────────────────┐
│    RESULTADOS BÚSQUEDA  │      │      REGISTRO/LOGIN     │
│   (Listado de CVs)      │      │    (Para publicadores)  │
└─────────────────────────┘      └─────────────────────────┘
              ▼                               ▼
┌─────────────────────────┐       ┌─────────────────────────┐
│    DETALLE DE CV        │       │   ÁREA PRIVADA          │
│   (Información + Stats) │─────▶│   (Gestión de CV)       │
└─────────────────────────┘       └─────────────────────────┘
              ▼                               │
┌─────────────────────────┐                   │
│   FORMULARIO CONTACTO   │                   │
│   (Para reclutadores)   │                   │
└─────────────────────────┘                   │
                                              │
                ┌─────────────────────────────┼───────────────────┐
                ▼                             ▼                   ▼
    ┌─────────────────────┐      ┌─────────────────────┐    ┌─────────────┐
    │   EDITOR CV         │      │   CONFIGURACIÓN     │    │SEGUIMIENTO  │
    │ (CRUD completo)     │      │ (Visibilidad + Pref)│    │(Alertas)    │
    └─────────────────────┘      └─────────────────────┘    └─────────────┘
```

---

## 📌 DOCUMENTACIÓN BASE COMPLETA

Hemos establecido los fundamentos del sistema:

| Sección | Estado |
|---------|--------|
| ✅ Visión General del Proyecto | Completado |
| ✅ Componentes del Sistema | Completado |
| ✅ Modelo de Seguridad y Permisos | Completado |
| ✅ Modelo de Datos | Completado |
| ✅ Diagrama Entidad Relación | Completado |
| ✅ Diagramas de Arquitectura | Completado |
| ✅ Mapa de Navegación | Completado |

Esta es la base sólida sobre la cual podemos construir el resto de la documentación (API, desarrollo frontend, backlog detallado, etc.).
