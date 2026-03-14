## 📋 Referencias

- **Documentación del producto:** [Documentacion.md](Documentacion.md)  
- **Modelo de datos:** [modelo.md](modelo.md)  
- **Script BD SQL Server:** [../database/01_CreateSchema.sql](../database/01_CreateSchema.sql)  
- **Despliegue / CI-CD:** [Despliegue.md](Despliegue.md)

---

## 📊 JERARQUÍA AZURE DEVOPS
```
Epic (Épica)
  └── Feature (Característica)
       └── User Story (Historia de Usuario)
            └── Task (Tarea Técnica)

Además:
- Bug (Error)
- Issue (Incidente)
```
---

## ✅ ESTRUCTURA CORRECTA (BASADA EN LA JERARQUÍA AZURE DEVOPS)

```
📋 ÉPICA 0: FUNDACIÓN TÉCNICA (INFRAESTRUCTURA)
├── 🔧 Feature 0.1: Base de Datos SQL Server
│    ├── 📝 Historia Técnica: Modelado de base de datos
│    │    ├── Tarea: Refinar modelo entidad-relación
│    │    ├── Tarea: Definir tipos de datos
│    │    └── Tarea: Crear diagrama físico
│    │
│    ├── 📝 Historia Técnica: Implementación de BD
│    │    ├── Tarea: Crear script DDL completo
│    │    ├── Tarea: Crear índices estratégicos
│    │    ├── Tarea: Implementar triggers
│    │    └── Tarea: Crear vistas
│    │
│    └── 📝 Historia Técnica: Datos y documentación
│         ├── Tarea: Crear datos de prueba ofuscados
│         ├── Tarea: Pruebas de rendimiento
│         ├── Tarea: Documentar diccionario de datos
│         └── Tarea: Plan de backup y mantenimiento
│
└── 🔧 Feature 0.2: Configuración de Entornos
     ├── 📝 Historia Técnica: Repositorio y control de versiones
     │    ├── Tarea: Configurar GitLab (ramas, protect, templates)
     │    └── Tarea: Configurar tablero ágil (boards, milestones)
     │
     ├── 📝 Historia Técnica: Entorno de desarrollo local
     │    ├── Tarea: Configurar Docker y docker-compose con SQL Server
     │    ├── Tarea: Conectar proyectos a BD existente
     │    └── Tarea: Verificar datos de prueba
     │
     ├── 📝 Historia Técnica: Proyecto backend
     │    ├── Tarea: Crear solución .NET con arquitectura por capas
     │    ├── Tarea: Configurar Entity Framework (mapeo a SQL Server)
     │    ├── Tarea: Configurar autenticación JWT base
     │    └── Tarea: Configurar Swagger/OpenAPI
     │
     ├── 📝 Historia Técnica: Proyecto frontend
     │    ├── Tarea: Crear proyecto Angular con estructura de módulos
     │    └── Tarea: Configurar servicios base (HttpClient, interceptores)
     │
     └── 📝 Historia Técnica: CI/CD y documentación
          ├── Tarea: Configurar CI/CD básico (.gitlab-ci.yml)
          └── Tarea: Documentar guía de inicio rápido
```

---

## 📋 BACKLOG CON LA JERARQUÍA AZURE DEVOPS

### ÉPICA 0: FUNDACIÓN TÉCNICA (INFRAESTRUCTURA BASE)

**Prioridad:** MUST HAVE  
**Objetivo:** Establecer toda la infraestructura técnica necesaria para comenzar el desarrollo

---

#### FEATURE 0.1: BASE DE DATOS SQL SERVER

| ID | Tipo | Título | Tareas | Responsable | Story Points |
|----|------|--------|--------|-------------|--------------|
| **HS-01** | Historia Técnica | Modelado de base de datos | [ ] Refinar modelo entidad-relación<br>[ ] Definir tipos de datos SQL Server<br>[ ] Diseñar índices estratégicos<br>[ ] Definir constraints y reglas<br>[ ] Diseñar estrategia de particionamiento<br>[ ] Crear diagrama físico | DBA | 8 |
| **HS-02** | Historia Técnica | Implementación de base de datos | [ ] Crear script DDL completo (ver `database/01_CreateSchema.sql`)<br>[ ] Crear índices optimizados<br>[ ] (Opcional) Triggers para sincronizar estadísticas<br>[ ] (Opcional) Vistas para consultas frecuentes | Backend | 8 |
| **HS-03** | Historia Técnica | Datos de prueba y documentación | [ ] Crear datos de prueba ofuscados (10+ CVs)<br>[ ] Pruebas de rendimiento<br>[ ] Crear diccionario de datos completo<br>[ ] Plan de backup y mantenimiento | DBA | 5 |

---

#### FEATURE 0.2: CONFIGURACIÓN DE ENTORNOS

| ID | Tipo | Título | Tareas | Responsable | Story Points |
|----|------|--------|--------|-------------|--------------|
| **HS-04** | Historia Técnica | Repositorio y control de versiones | [ ] Configurar repositorio (GitHub recomendado o GitLab)<br>[ ] Estructurar ramas (main, develop, feature)<br>[ ] Proteger ramas principales<br>[ ] Configurar templates para PR/MR<br>[ ] Configurar tablero ágil (boards, milestones, labels) | DevOps | 3 |
| **HS-05** | Historia Técnica | Entorno de desarrollo local | [ ] Configurar Docker y docker-compose<br>[ ] Crear docker-compose.yml con SQL Server<br>[ ] Conectar proyectos a BD existente<br>[ ] Verificar datos de prueba funcionando | DevOps | 5 |
| **HS-06** | Historia Técnica | Configuración backend .NET | [ ] Crear solución con arquitectura por capas<br>[ ] Configurar Entity Framework (DbContext, mappings)<br>[ ] Configurar autenticación JWT base<br>[ ] Configurar Swagger/OpenAPI<br>[ ] Implementar middleware básico (logging, excepciones) | Backend | 8 |
| **HS-07** | Historia Técnica | Configuración frontend Angular | [ ] Crear proyecto con estructura de módulos<br>[ ] Configurar lazy loading<br>[ ] Implementar servicios base (HttpClient)<br>[ ] Configurar interceptores (auth, errores)<br>[ ] Crear componentes base (header, footer, layout) | Frontend | 5 |
| **HS-08** | Historia Técnica | CI/CD y documentación | [ ] Configurar pipeline CI/CD (GitHub Actions o .gitlab-ci.yml: build, test)<br>[ ] Configurar análisis de código (SonarQube/SonarCloud opcional)<br>[ ] Documentar guía de inicio rápido<br>[ ] Crear README principal del proyecto | DevOps | 3 |

---

### ÉPICA 1: MÓDULO PÚBLICO

**Prioridad:** MUST HAVE  
**Dependencia:** Épica 0 completada

---

#### FEATURE 1.1: BACKEND - APIs Públicas

| ID | Tipo | Título | Descripción | Endpoints | Story Points |
|----|------|--------|-------------|-----------|--------------|
| **HS-09** | Historia Técnica | API: Listado de CVs públicos | Endpoint paginado con filtros básicos | `GET /api/public/cvs` | 5 |
| **HS-10** | Historia Técnica | API: Búsqueda por palabras clave | Endpoint con autocompletado | `GET /api/public/search?q=` | 3 |
| **HS-11** | Historia Técnica | API: Detalle de CV por URL | Obtener CV completo por slug | `GET /api/public/cvs/{urlPublica}` | 5 |
| **HS-12** | Historia Técnica | API: Estadísticas públicas | Métricas de visitas y contactos | `GET /api/public/cvs/{urlPublica}/stats` | 3 |
| **HS-13** | Historia Técnica | API: Formulario de contacto | Guardar contacto y generar alerta | `POST /api/public/contact/{cvId}` | 5 |
| **HS-14** | Historia Técnica | API: Categorías y filtros | Ciudades, habilidades populares | `GET /api/public/filters` | 2 |
| **HS-15** | Historia Técnica | Sistema de rate limiting | Controlar spam en formularios | Middleware | 3 |
| **HS-16** | Historia Técnica | Sistema de caché | Redis/memoria para performance | Middleware | 3 |

---

#### FEATURE 1.2: FRONTEND - Interfaz Pública

| ID | Tipo | Título | Descripción | Depende de | Story Points |
|----|------|--------|-------------|------------|--------------|
| **HS-17** | Historia Usuario | Landing Page con buscador | Como reclutador quiero una página principal con buscador para encontrar profesionales | HS-10 | 5 |
| **HS-18** | Historia Usuario | Búsqueda con autocompletado | Como reclutador quiero sugerencias al escribir para encontrar rápido | HS-10 | 3 |
| **HS-19** | Historia Usuario | Listado de CVs en tarjetas | Como reclutador quiero ver resultados paginados para revisar múltiples perfiles | HS-09 | 5 |
| **HS-20** | Historia Usuario | Filtros de búsqueda | Como reclutador quiero filtrar por ciudad y habilidades para acotar resultados | HS-14 | 3 |
| **HS-21** | Historia Usuario | Vista detalle de CV | Como reclutador quiero ver el CV completo para evaluar al profesional | HS-11 | 8 |
| **HS-22** | Historia Usuario | Estadísticas públicas | Como reclutador quiero ver métricas de visitas para medir popularidad | HS-12 | 5 |
| **HS-23** | Historia Usuario | Formulario de contacto | Como reclutador quiero contactar al profesional sin registrarme | HS-13 | 5 |
| **HS-24** | Historia Usuario | Compartir en redes | Como reclutador quiero compartir CVs interesantes con mi equipo | - | 2 |

---

### ÉPICA 2: AUTENTICACIÓN DE PUBLICADORES

**Prioridad:** MUST HAVE  
**Dependencia:** Épica 0 completada

---

#### FEATURE 2.1: BACKEND - Autenticación

| ID | Tipo | Título | Descripción | Endpoints | Story Points |
|----|------|--------|-------------|-----------|--------------|
| **HS-25** | Historia Técnica | API: Registro de publicadores | Crear usuario, enviar confirmación | `POST /api/auth/register` | 5 |
| **HS-26** | Historia Técnica | API: Confirmación de email | Validar token de confirmación | `GET /api/auth/confirm-email` | 3 |
| **HS-27** | Historia Técnica | API: Login con JWT | Autenticación y generación de tokens | `POST /api/auth/login` | 5 |
| **HS-28** | Historia Técnica | API: Refresh token | Renovar access token | `POST /api/auth/refresh` | 3 |
| **HS-29** | Historia Técnica | API: Recuperación de contraseña | Solicitar y restablecer | `POST /api/auth/forgot-password`<br>`POST /api/auth/reset-password` | 5 |

---

#### FEATURE 2.2: FRONTEND - Interfaz de Autenticación

| ID | Tipo | Título | Descripción | Depende de | Story Points |
|----|------|--------|-------------|------------|--------------|
| **HS-30** | Historia Usuario | Página de registro | Como profesional quiero registrarme para crear mi CV | HS-25 | 5 |
| **HS-31** | Historia Usuario | Página de login | Como publicador quiero iniciar sesión para gestionar mi CV | HS-27 | 3 |
| **HS-32** | Historia Usuario | Recuperación de contraseña | Como publicador quiero recuperar mi acceso si olvido la contraseña | HS-29 | 3 |

---

### ÉPICA 3: GESTIÓN DE CV

**Prioridad:** MUST HAVE  
**Dependencia:** Épica 0 + Épica 2 completadas

---

#### FEATURE 3.1: BACKEND - CRUDs de CV

| ID | Tipo | Título | Endpoints | Story Points |
|----|------|--------|-----------|--------------|
| **HS-33** | Historia Técnica | API: CRUD Datos Personales | `GET /api/personales`<br>`PUT /api/personales` | 5 |
| **HS-34** | Historia Técnica | API: CRUD Perfil Profesional | CRUD completo perfiles | 5 |
| **HS-35** | Historia Técnica | API: CRUD Experiencia Laboral | CRUD completo experiencias | 8 |
| **HS-36** | Historia Técnica | API: CRUD Formación Académica | CRUD completo formaciones | 5 |
| **HS-37** | Historia Técnica | API: CRUD Habilidades | CRUD completo habilidades | 5 |
| **HS-38** | Historia Técnica | API: CRUD Proyectos | CRUD completo proyectos | 5 |
| **HS-39** | Historia Técnica | API: CRUD Referencias | CRUD referencias (laborales y personales, tabla unificada) | 3 |
| **HS-40** | Historia Técnica | API: CRUD Redes Sociales | CRUD completo redes | 3 |
| **HS-40b** | Historia Técnica | API: CRUD Contactos familiares | `GET/POST/PUT/DELETE /api/familiares` (FamiliarContacto) | 2 |
| **HS-41** | Historia Técnica | Autorización y propiedad | Middleware que valida dueño del CV | 3 |

---

#### FEATURE 3.2: FRONTEND - Editor de CV

| ID | Tipo | Título | Depende de | Story Points |
|----|------|--------|------------|--------------|
| **HS-42** | Historia Usuario | Editor de datos personales | HS-33 | 8 |
| **HS-43** | Historia Usuario | Editor de perfil profesional | HS-34 | 5 |
| **HS-44** | Historia Usuario | Editor de experiencia laboral | HS-35 | 8 |
| **HS-45** | Historia Usuario | Editor de formación académica | HS-36 | 5 |
| **HS-46** | Historia Usuario | Editor de habilidades | HS-37 | 5 |
| **HS-47** | Historia Usuario | Editor de proyectos | HS-38 | 5 |
| **HS-48** | Historia Usuario | Editor de referencias | HS-39 | 3 |
| **HS-49** | Historia Usuario | Editor de redes sociales | HS-40 | 3 |
| **HS-49b** | Historia Usuario | Editor de contactos familiares | HS-40b | 2 |
| **HS-50** | Historia Usuario | Vista previa del CV | HS-11 | 5 |
| **HS-51** | Historia Usuario | Barra de progreso | - | 2 |

---

### ÉPICA 4: SEGUIMIENTO Y CONFIGURACIÓN

**Prioridad:** SHOULD HAVE  
**Dependencia:** Épica 3 completada

---

#### FEATURE 4.1: BACKEND - Dashboard y Alertas

| ID | Tipo | Título | Endpoints | Story Points |
|----|------|--------|-----------|--------------|
| **HS-52** | Historia Técnica | API: Dashboard estadísticas | `GET /api/dashboard/stats` | 5 |
| **HS-53** | Historia Técnica | API: Lista de contactos | `GET /api/contactos` | 3 |
| **HS-54** | Historia Técnica | API: Marcar contacto leído | `PUT /api/contactos/{id}/leer` | 2 |
| **HS-55** | Historia Técnica | API: Notificaciones | `GET /api/notificaciones` | 3 |
| **HS-56** | Historia Técnica | API: Visibilidad secciones | `GET /api/visibilidad`<br>`PUT /api/visibilidad` | 3 |

---

#### FEATURE 4.2: FRONTEND - Dashboard y Configuración

| ID | Tipo | Título | Depende de | Story Points |
|----|------|--------|------------|--------------|
| **HS-57** | Historia Usuario | Dashboard con gráficos | HS-52 | 8 |
| **HS-58** | Historia Usuario | Lista de contactos recibidos | HS-53, HS-54 | 5 |
| **HS-59** | Historia Usuario | Campanita de notificaciones | HS-55 | 3 |
| **HS-60** | Historia Usuario | Configuración de visibilidad | HS-56 | 5 |

---

### ÉPICA 5: ADMINISTRACIÓN

**Prioridad:** COULD HAVE  
**Dependencia:** Épica 3 completada

| ID | Tipo | Título | Descripción | Story Points |
|----|------|--------|-------------|--------------|
| **HS-61** | Historia Usuario | Gestión de usuarios (Admin) | Como admin quiero ver y gestionar publicadores | 8 |
| **HS-62** | Historia Usuario | Gestión de roles | Como admin quiero asignar permisos | 5 |

---

## 📊 TABLA RESUMEN POR ÉPICA

| Épica | Features | Historias | Story Points |
|-------|----------|-----------|--------------|
| **Épica 0: Fundación Técnica** | 2 | 8 | 45 |
| **Épica 1: Módulo Público** | 2 | 16 | 65 |
| **Épica 2: Autenticación** | 2 | 8 | 32 |
| **Épica 3: Gestión de CV** | 2 | 21 | 95 |
| **Épica 4: Seguimiento** | 2 | 9 | 37 |
| **Épica 5: Administración** | 1 | 2 | 13 |
| **TOTAL** | **11** | **64** | **287** |

---

## 🎯 PLAN DE SPRINTS (AHORA SÍ BIEN ESTRUCTURADO)

| Sprint | Enfoque | Historias a incluir |
|--------|---------|---------------------|
| **Sprint 1** | Épica 0 (parte 1) | HS-01, HS-02, HS-03 (Base de Datos) |
| **Sprint 2** | Épica 0 (parte 2) | HS-04, HS-05, HS-06, HS-07, HS-08 (Entornos) |
| **Sprint 3** | Épica 1 Backend | HS-09 a HS-16 (APIs Públicas) |
| **Sprint 4** | Épica 1 Frontend | HS-17 a HS-24 (UI Pública) |
| **Sprint 5** | Épica 2 Backend | HS-25 a HS-29 (APIs Auth) |
| **Sprint 6** | Épica 2 Frontend | HS-30 a HS-32 (UI Auth) |
| **Sprint 7** | Épica 3 Backend (parte 1) | HS-33 a HS-37 (APIs core) |
| **Sprint 8** | Épica 3 Backend (parte 2) | HS-38 a HS-41, HS-40b (APIs complementarias + familiares) |
| **Sprint 9** | Épica 3 Frontend (parte 1) | HS-42 a HS-46 (Editores core) |
| **Sprint 10** | Épica 3 Frontend (parte 2) | HS-47 a HS-51, HS-49b (Editores complementarios + familiares) |
| **Sprint 11** | Épica 4 Completa | HS-52 a HS-60 (Dashboard y Config) |
| **Sprint 12** | Épica 5 + Polishing | HS-61, HS-62 + bugs |

---

## ✅ CONCLUSIÓN

**Estructura correcta según jerarquía Azure DevOps:**

1. ✅ **Épicas** → Grandes áreas (Fundación, Público, Auth, Gestión, etc.)
2. ✅ **Features** → Agrupaciones lógicas dentro de cada épica
3. ✅ **Historias de Usuario/Técnicas** → Funcionalidades específicas
4. ✅ **Tareas** → Detalle dentro de cada historia (en el sprint planning)

---

## 💡 SUGERENCIAS Y MEJORAS OPCIONALES

| Sugerencia | Descripción |
|------------|-------------|
| **Criterios de aceptación** | Añadir 2-3 criterios de aceptación por historia al detallar en Azure DevOps (ej.: "Dado X, cuando Y, entonces Z"). |
| **Definition of Done** | Definir DoD del equipo (ej.: código en main/develop, pruebas pasando, sin deuda en Sonar, documentación actualizada). |
| **Épica 5 – Auditoría** | Documentacion.md incluye "Auditoría" en el módulo Admin; considerar añadir HS-63: "Vista de auditoría y logs del sistema" (5 SP). |
| **Dependencia HS-50** | Vista previa (HS-50) podría depender también de HS-33/34 para datos mínimos; opcional aclarar en la historia. |
| **Priorización** | Si el tiempo aprieta, Épica 4 (Seguimiento) y Épica 5 (Administración) son SHOULD/COULD HAVE; se puede lanzar MVP sin ellas. |

