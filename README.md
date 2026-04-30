# Curriculum-Vitae-Web

Portal web para conectar profesionales (publicadores de CV) con reclutadores. Cada usuario controla si su CV está **publicado** (visible en búsqueda y detalle público) o en **borrador** (solo edición en el portal privado). Solo publicadores y administradores requieren registro y autenticación.

## Documentación

| Documento | Descripción |
|-----------|-------------|
| [docs/produccion/Plan-Trabajo-Produccion.md](docs/produccion/Plan-Trabajo-Produccion.md) | Plan operativo para salida a producción (fases, criterios y riesgos) |
| [docs/produccion/Integracion-SonarCloud.md](docs/produccion/Integracion-SonarCloud.md) | Integración SonarCloud y configuración en GitHub Actions |
| [docs/guias/Guia-git.md](docs/guias/Guia-git.md) | Buenas prácticas Git (ramas, commits, flujo) |
| [docs/devops/Checklist-Produccion.md](docs/devops/Checklist-Produccion.md) | Checklist antes de publicar en producción |
| [database/README.md](database/README.md) | Scripts SQL Server y creación de la base de datos |
| [database/01_CreateSchema.dbml](database/01_CreateSchema.dbml) | Modelo DBML del esquema de base de datos |
| [database/DiccionarioDeDatos.md](database/DiccionarioDeDatos.md) | Diccionario de datos completo (tablas, columnas, tipos y reglas) |

## Inicio rápido (desarrollo local)

1. **Clonar** el repositorio.
2. **Base de datos (SQL Server local)**: crear/apuntar la base y ejecutar los scripts en [scripts/](scripts/) según [database/README.md](database/README.md).
3. **Backend**: `cd backend/PortalCV.Backend/PortalCV.Api` → configurar secretos locales (`dotnet user-secrets`) y/o variables de entorno → `dotnet run`.
4. **Frontend**: `cd frontend` → `npm ci` → `ng serve` (el proxy en `proxy.conf.js` reenvía `/api` y `/health` al backend; ver comentario en ese archivo para otro puerto).

Antes de **producción**, revisar [docs/devops/Checklist-Produccion.md](docs/devops/Checklist-Produccion.md) (CORS, JWT, SQL, build del SPA).

### Docker (solo lo necesario para Azure Container Apps)

El despliegue de backend en **Azure Container Apps** usa una **imagen Docker** construida desde `backend/Dockerfile` y publicada en **GHCR**.
Para validar localmente la imagen (opcional):

```bash
docker build -f backend/Dockerfile -t portalcv-backend:local ./backend
```

Variables del contenedor (local): usa la plantilla `docker/backend.local.env.example` → copia a `docker/backend.local.env` (ignorado por git) y ejecuta:

```bash
docker run --rm -p 5005:8080 --add-host=host.docker.internal:host-gateway --env-file docker/backend.local.env --name portalcv-api-local portalcv-backend:local
```

> `dotnet user-secrets` aplica a `dotnet run` en tu PC; para Docker usa `--env-file` o `-e`.
