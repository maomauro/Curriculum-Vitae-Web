# Documentación — Portal CV

Índice general de toda la documentación del proyecto.

---

## 📁 arquitectura/
Descripción general del sistema, modelo de datos y backlog.

| Archivo | Contenido |
|---|---|
| [Documentacion.md](./arquitectura/Documentacion.md) | Descripción general del proyecto, stack tecnológico |
| [Modelo.md](./arquitectura/Modelo.md) | Modelo de datos, diagrama de base de datos |
| [Backlog.md](./arquitectura/Backlog.md) | Historias de usuario, tareas pendientes |

---

## 🎨 diseño/
Arquitectura visual, layouts y especificaciones de cada pantalla.

| Archivo | Contenido |
|---|---|
| [Diseño.md](./diseño/Diseño.md) | Índice de vistas, arquitectura de layouts, paleta de colores |
| [vistas/publica/Home.md](./diseño/vistas/publica/Home.md) | Página principal (`/`) |
| [vistas/publica/Buscar-CVs.md](./diseño/vistas/publica/Buscar-CVs.md) | Listado de CVs (`/cvs`) |
| [vistas/publica/Detalle-CV.md](./diseño/vistas/publica/Detalle-CV.md) | Vista detallada de un CV (`/cv/:id`) |
| [vistas/publica/Dashboard-Candidato.md](./diseño/vistas/publica/Dashboard-Candidato.md) | Dashboard analítico público (`/cv/:id/dashboard`) |
| [vistas/auth/Login.md](./diseño/vistas/auth/Login.md) | Inicio de sesión (`/auth/login`) |
| [vistas/auth/Register.md](./diseño/vistas/auth/Register.md) | Registro (`/auth/register`) |
| [vistas/auth/Recuperar-Contrasena.md](./diseño/vistas/auth/Recuperar-Contrasena.md) | Recuperar contraseña (`/auth/forgot-password`) |
| [vistas/privada/Dashboard.md](./diseño/vistas/privada/Dashboard.md) | Panel privado (`/dashboard`) |
| [vistas/privada/Alertas.md](./diseño/vistas/privada/Alertas.md) | Alertas de visitas (`/alertas`) |
| [vistas/privada/Mi-CV.md](./diseño/vistas/privada/Mi-CV.md) | Vista previa del CV (`/mi-cv`) |
| [vistas/privada/Datos-Personales.md](./diseño/vistas/privada/Datos-Personales.md) | Datos personales (`/datos-personales`) |
| [vistas/privada/Perfil.md](./diseño/vistas/privada/Perfil.md) | Perfil profesional (`/perfil`) |
| [vistas/privada/Experiencia.md](./diseño/vistas/privada/Experiencia.md) | Experiencia laboral (`/experiencia`) |
| [vistas/privada/Educacion.md](./diseño/vistas/privada/Educacion.md) | Formación académica (`/educacion`) |
| [vistas/privada/Habilidades.md](./diseño/vistas/privada/Habilidades.md) | Habilidades (`/habilidades`) |
| [vistas/privada/Proyectos.md](./diseño/vistas/privada/Proyectos.md) | Proyectos (`/proyectos`) |
| [vistas/privada/Configuracion.md](./diseño/vistas/privada/Configuracion.md) | Configuración (`/configuracion`) |
| [vistas/admin/Admin-Panel.md](./diseño/vistas/admin/Admin-Panel.md) | Panel de administración (`/admin`) |

---

## ⚙️ devops/
Infraestructura, despliegue y políticas de mantenimiento.

| Archivo | Contenido |
|---|---|
| [DevOps.md](./devops/DevOps.md) | Pipelines, CI/CD, configuración Docker |
| [Despliegue.md](./devops/Despliegue.md) | Decisiones de infraestructura y arquitectura de despliegue |
| [Runbook-Azure.md](./devops/Runbook-Azure.md) | Runbook ejecutable con comandos `az` para provisionar Azure desde cero |
| [Plan-Backup-Mantenimiento.md](./devops/Plan-Backup-Mantenimiento.md) | Plan de backup y mantenimiento |
| [Politica-Proteccion-Ramas.md](./devops/Politica-Proteccion-Ramas.md) | Reglas de protección de ramas Git |
| [Checklist-Produccion.md](./devops/Checklist-Produccion.md) | Verificación previa a publicar en producción |

---

## 📖 guias/
Guías de trabajo, convenciones del equipo y gestión de secretos.

| Archivo | Contenido |
|---|---|
| [Guia-git.md](./guias/Guia-git.md) | Convenciones de ramas, commits y flujo de trabajo Git |
| [Guia-secrets-y-credenciales.md](./guias/Guia-secrets-y-credenciales.md) | Política de secretos: dónde viven según entorno (local / CI / Azure) |
| [Guia-inventario-secrets-por-ambiente.md](./guias/Guia-inventario-secrets-por-ambiente.md) | Plantilla de inventario de secretos por entorno (sin valores reales) |
| [Inventario-minimo-local.md](./guias/Inventario-minimo-local.md) | Identidades y secretos mínimos para arrancar el proyecto localmente |
| [Plantilla-herramientas-por-ambiente.md](./guias/Plantilla-herramientas-por-ambiente.md) | Catálogo de herramientas por ambiente (SDK, Node, Docker, Azure) |

---

## 🚀 produccion/
Plan de salida a producción y configuración de calidad continua.

| Archivo | Contenido |
|---|---|
| [Plan-Trabajo-Produccion.md](./produccion/Plan-Trabajo-Produccion.md) | Tablero de fases hasta el go-live en Azure (ACA + SWA + Azure SQL) |
| [Integracion-SonarCloud.md](./produccion/Integracion-SonarCloud.md) | Configuración de SonarCloud en CI, cobertura LCOV y variables requeridas |

---

## 📦 README de componentes (fuera de `docs/`)
Documentación específica de cada carpeta del monorepo. Se mantienen junto al código para que sean el primer punto de entrada de quien trabaja en ese componente.

| Archivo | Contenido |
|---|---|
| [../README.md](../README.md) | README raíz del repositorio: visión general, inicio rápido y estructura |
| [../backend/README.md](../backend/README.md) | Build/run de la API .NET, configuración de secretos locales (user-secrets / Docker) |
| [../frontend/README.md](../frontend/README.md) | Build/run del frontend Angular, scripts de test y cobertura |
| [../database/README.md](../database/README.md) | Scripts SQL Server locales (`scripts/manual/`) y su orden de ejecución |
| [../scripts/README_ProductionScripts.md](../scripts/README_ProductionScripts.md) | Scripts SQL para Azure SQL (`scripts/production/`) |
| [../.github/PULL_REQUEST_TEMPLATE/README.md](../.github/PULL_REQUEST_TEMPLATE/README.md) | Plantillas de descripción para Pull Requests |
