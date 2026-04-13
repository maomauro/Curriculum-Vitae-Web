# Curriculum-Vitae-Web

Portal web para conectar profesionales (publicadores de CV) con reclutadores. Cada usuario controla si su CV está **publicado** (visible en búsqueda y detalle público) o en **borrador** (solo edición en el portal privado). Solo publicadores y administradores requieren registro y autenticación.

## Documentación

| Documento | Descripción |
|-----------|-------------|
| [docs/arquitectura/Documentacion.md](docs/arquitectura/Documentacion.md) | Visión del producto, componentes, seguridad, modelo de datos, arquitectura |
| [docs/arquitectura/Backlog.md](docs/arquitectura/Backlog.md) | Épicas, historias de usuario y plan de sprints |
| [docs/diseño/Diseño.md](docs/diseño/Diseño.md) | Vistas del proyecto, arquitectura de layouts, paleta de colores |
| [docs/arquitectura/Modelo.md](docs/arquitectura/Modelo.md) | Modelo de datos detallado (tablas y relaciones) |
| [docs/devops/Despliegue.md](docs/devops/Despliegue.md) | Guía CI/CD y despliegue — GitHub Actions, Azure Container Apps, Static Web Apps |
| [docs/devops/DevOps.md](docs/devops/DevOps.md) | Operación técnica, prácticas y lineamientos DevOps |
| [docs/devops/Plan-Backup-Mantenimiento.md](docs/devops/Plan-Backup-Mantenimiento.md) | Política básica de backups, retención e índices/estadísticas |
| [docs/devops/Politica-Proteccion-Ramas.md](docs/devops/Politica-Proteccion-Ramas.md) | Política obligatoria de protección de ramas y PR/MR |
| [docs/guias/Guia-git.md](docs/guias/Guia-git.md) | Buenas prácticas Git (ramas, commits, flujo) |
| [docs/devops/Checklist-Produccion.md](docs/devops/Checklist-Produccion.md) | Checklist antes de publicar en producción |
| [database/README.md](database/README.md) | Scripts SQL Server y creación de la base de datos |
| [database/01_CreateSchema.dbml](database/01_CreateSchema.dbml) | Modelo DBML del esquema de base de datos |
| [database/DiccionarioDeDatos.md](database/DiccionarioDeDatos.md) | Diccionario de datos completo (tablas, columnas, tipos y reglas) |

## Inicio rápido (desarrollo local)

1. **Clonar** el repositorio y copiar variables de entorno: `cp .env.example .env` (ajustar contraseñas y JWT).
2. **Base de datos**: con Docker, `docker-compose up -d db db-init` y luego el perfil `app` si usas contenedores para API y front; o bien SQL Server local y ejecutar los scripts en [scripts/](scripts/) según [database/README.md](database/README.md).
3. **Backend**: `cd backend/PortalCV.Backend/PortalCV.Api` → configurar `appsettings.Development.json` (no versionado) o variables → `dotnet run`.
4. **Frontend**: `cd frontend` → `npm ci` → `ng serve` (el proxy en `proxy.conf.json` reenvía `/api` al backend).

Antes de **producción**, revisar [docs/devops/Checklist-Produccion.md](docs/devops/Checklist-Produccion.md) (CORS, JWT, SQL, build del SPA).
