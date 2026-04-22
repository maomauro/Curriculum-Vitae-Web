# Plantilla de Herramientas por Ambiente

## Objetivo
Registrar, de forma ordenada, las herramientas que usa el proyecto por ambiente y su estado de configuracion.

## Instrucciones de uso
- Una fila por herramienta y ambiente.
- No colocar secretos reales.
- Completar owner, estado y enlace de acceso.

## Catalogo base

| ID | Herramienta | Categoria | Ambiente | Uso principal | Owner | Estado | Enlace/Ubicacion | Notas |
|---|---|---|---|---|---|---|---|---|
| TOOL-001 | GitHub | Repositorio/CI | Global | Codigo fuente, PR, Actions | maomauro | Activo | https://github.com/maomauro/Curriculum-Vitae-Web | Workflow: `.github/workflows/ci.yml` |
| TOOL-002 | SonarCloud | Calidad | CI (main + ramas) | Analisis de codigo y quality gate | maomauro | Activo | https://sonarcloud.io/ | QG "Passed" en `main`; requiere `SONAR_TOKEN`, `SONAR_ORGANIZATION`, `SONAR_PROJECT_KEY` |
| TOOL-003 | SQL Server Local | Base de datos | Local | Desarrollo y pruebas locales | maomauro | Activo | `localhost\SQLEXPRESS,1433` (base `PortalCV`) | TCP/IP habilitado, puerto fijo 1433; scripts en `scripts/manual/` |
| TOOL-004 | Azure SQL Database | Base de datos | Produccion | Base de datos administrada Free Tier | maomauro | Activo | `sql-portalcv-mao.database.windows.net` / `PortalCV` | Usuario app: `portalcv_app_prod`; script `scripts/production/05_AzureSQL_CreateSchema.sql` |
| TOOL-005 | Azure Container Apps | Runtime backend | Produccion | Hosting de API .NET 10 desde imagen GHCR | maomauro | Pendiente crear | Azure Portal (recurso futuro `portalcv-api` en `rg-portalcv`) | Scale-to-zero, puerto 8080, ingress externo HTTPS |
| TOOL-006 | Azure Static Web Apps | Runtime frontend | Produccion | Hosting de SPA Angular con CDN | maomauro | Pendiente crear | Azure Portal (recurso futuro `portalcv-web`) | Conectar al repo en `main`; `output_location: dist/portalcv-web/browser` |
| TOOL-007 | GitHub Container Registry (GHCR) | Registro de imagenes | CI/Produccion | Almacenar imagen Docker del backend | maomauro | Pendiente | https://github.com/maomauro?tab=packages | El workflow de publicacion (`docker build + push`) aun no existe en `ci.yml` |
| TOOL-008 | Docker Desktop | Contenedores | Local | Opcional: construir/validar imagen backend (`backend/Dockerfile`) | maomauro | Activo | Docker Desktop (Windows) | No requerido para `dotnet run` + `ng serve`; usar `--add-host=host.docker.internal:host-gateway` |
| TOOL-009 | Swagger UI | API testing | Local/Produccion | Probar endpoints REST desde el navegador | maomauro | Activo | http://localhost:5005/swagger (local) | Expuesto solo en `ASPNETCORE_ENVIRONMENT=Development` (ver `Program.cs`) |
| TOOL-010 | Postman/Insomnia | API testing | Local/CI manual | Pruebas de endpoints con colecciones | maomauro | Opcional | — | Alternativa a Swagger para flujos complejos |
| TOOL-011 | SSMS / Azure Data Studio | DB admin | Local/Produccion | Gestion y consultas SQL | maomauro | Activo | SSMS (Windows) | Usado para crear `portalcv_app` y aplicar scripts en local |
| TOOL-012 | Node.js + npm | Frontend build/test | Local/CI | Build y tests Angular 20 | maomauro | Activo | https://nodejs.org/ | Node 22+ recomendado; CI usa `actions/setup-node@v4` con LTS |
| TOOL-013 | .NET SDK | Backend build/test | Local/CI | Build y ejecucion API .NET 10 | maomauro | Activo | https://dotnet.microsoft.com/download | .NET 10 (LTS); CI usa `actions/setup-dotnet@v4` |
| TOOL-014 | Cursor / VS Code / Rider | IDE | Local | Edicion del codigo fuente | maomauro | Activo | — | Solucion `.slnx` en `backend/PortalCV.Backend/` |

## Checklist minimo por ambiente

### Local
- [x] GitHub operativo (clone, push, PR).
- [x] SQL Server local operativo (`SQLEXPRESS` con TCP/IP y puerto 1433).
- [x] .NET SDK instalado (backend: build, run y test de la API).
- [x] Node.js + npm instalados (frontend Angular: build y test).
- [x] Docker Desktop operativo (opcional: validar imagen backend localmente).
- [x] Swagger UI accesible en `http://localhost:5005/swagger` al correr la API.
- [x] SSMS o Azure Data Studio operativo para consultas/admin.

### CI (GitHub Actions)
- [x] Workflow `ci.yml` corriendo en push y PR hacia `develop`/`main`.
- [x] SonarCloud configurado (`SONAR_TOKEN` secret; `SONAR_ORGANIZATION` y `SONAR_PROJECT_KEY` variables).
- [x] Cobertura frontend reportada a Sonar via artifact `frontend-coverage` (`lcov.info`).
- [x] Workflow de build + push de imagen backend a GHCR (`.github/workflows/publish-backend-image.yml`).
- [x] Proyecto de tests backend (`PortalCV.Api.Tests` con xUnit) y su paso en CI (job `backend`).

### Produccion (Azure)
- [x] Azure SQL Database Free Tier operativa (`sql-portalcv-mao.database.windows.net/PortalCV`).
- [ ] Resource Group `rg-portalcv` creado.
- [ ] Azure Container Apps Environment (`env-portalcv`) creado.
- [ ] Container App `portalcv-api` creado y apuntando a la imagen en GHCR.
- [ ] Azure Static Web App `portalcv-web` creado y conectado al repo.
- [ ] Secretos de produccion configurados en ACA (connection string, `Jwt__Key`, etc.).
- [ ] Firewall Azure SQL: `Allow Azure services ON` activado.
- [ ] Monitoreo y alertas activos.

## Estados sugeridos
- `Pendiente`: no configurado.
- `En progreso`: parcialmente configurado.
- `Activo`: funcionando y validado.
- `Bloqueado`: requiere decision o acceso externo.
- `Opcional`: util pero no obligatorio para operar el proyecto.
