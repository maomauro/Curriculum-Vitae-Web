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
| TOOL-003 | MariaDB (Docker) | Base de datos | Local | Desarrollo y pruebas locales | maomauro | Activo | Contenedor `db` (`mariadb:11`) vía `docker-compose.yml`, puerto 3306 | Esquema inicial `database/01_CreateSchema.sql` montado en `/docker-entrypoint-initdb.d/` |
| TOOL-004 | MariaDB (Docker, produccion) | Base de datos | Produccion | Contenedor en el VPS de Contabo, volumen persistente | maomauro | Pendiente crear | VPS Contabo `13.140.188.159` | Ver `docs/produccion/Plan-Trabajo-Produccion.md` Fase 4 |
| TOOL-005 | VPS Contabo (Cloud VPS 6) | Runtime backend + frontend | Produccion | Hosting de API .NET 10 (imagen GHCR) + build de Angular, ambos detras del mismo Nginx | maomauro | Contratado, sin configurar | IP `13.140.188.159`, Hub Europe | Ver `docs/produccion/Plan-Trabajo-Produccion.md` Fases 1 y 3 |
| TOOL-006 | Cloudflare | DNS / proxy / TLS | Produccion | Subdominio publico sobre `sitiosapps.com`, proxy y terminacion TLS de borde | maomauro | Pendiente crear registro | https://dash.cloudflare.com | Ver `docs/produccion/Plan-Trabajo-Produccion.md` Fase 2 |
| TOOL-007 | GitHub Container Registry (GHCR) | Registro de imagenes | CI/Produccion | Almacenar imagen Docker del backend | maomauro | Pendiente | https://github.com/maomauro?tab=packages | El workflow de publicacion (`docker build + push`) aun no existe en `ci.yml` |
| TOOL-008 | Docker Desktop | Contenedores | Local | Opcional: construir/validar imagen backend (`backend/Dockerfile`) | maomauro | Activo | Docker Desktop (Windows) | No requerido para `dotnet run` + `ng serve`; usar `--add-host=host.docker.internal:host-gateway` |
| TOOL-009 | Swagger UI | API testing | Local/Produccion | Probar endpoints REST desde el navegador | maomauro | Activo | http://localhost:5005/swagger (local) | Expuesto solo en `ASPNETCORE_ENVIRONMENT=Development` (ver `Program.cs`) |
| TOOL-010 | Postman/Insomnia | API testing | Local/CI manual | Pruebas de endpoints con colecciones | maomauro | Opcional | — | Alternativa a Swagger para flujos complejos |
| TOOL-011 | Cliente MariaDB (CLI / DBeaver / HeidiSQL) | DB admin | Local/Produccion | Gestion y consultas SQL | maomauro | Activo | `docker exec -i <contenedor_mariadb> mariadb -uroot -p"$PASSWORD"` o cliente GUI conectado a `localhost:3306` | Ver `database/README.md` para aplicar `01_CreateSchema.sql` a mano |
| TOOL-012 | Node.js + npm | Frontend build/test | Local/CI | Build y tests Angular 20 | maomauro | Activo | https://nodejs.org/ | Node 22+ recomendado; CI usa `actions/setup-node@v4` con LTS |
| TOOL-013 | .NET SDK | Backend build/test | Local/CI | Build y ejecucion API .NET 10 | maomauro | Activo | https://dotnet.microsoft.com/download | .NET 10 (LTS); CI usa `actions/setup-dotnet@v4` |
| TOOL-014 | Cursor / VS Code / Rider | IDE | Local | Edicion del codigo fuente | maomauro | Activo | — | Solucion `.slnx` en `backend/PortalCV.Backend/` |

## Checklist minimo por ambiente

### Local
- [x] GitHub operativo (clone, push, PR).
- [x] MariaDB local operativa (contenedor `db` vía `docker-compose.yml`, puerto 3306).
- [x] .NET SDK instalado (backend: build, run y test de la API).
- [x] Node.js + npm instalados (frontend Angular: build y test).
- [x] Docker Desktop operativo (opcional: validar imagen backend localmente).
- [x] Swagger UI accesible en `http://localhost:5005/swagger` al correr la API.
- [x] Cliente MariaDB (CLI / DBeaver / HeidiSQL) operativo para consultas/admin.

### CI (GitHub Actions)
- [x] Workflow `ci.yml` corriendo en push y PR hacia `develop`/`main`.
- [x] SonarCloud configurado (`SONAR_TOKEN` secret; `SONAR_ORGANIZATION` y `SONAR_PROJECT_KEY` variables).
- [x] Cobertura frontend reportada a Sonar via artifact `frontend-coverage` (`lcov.info`).
- [x] Workflow de build + push de imagen backend a GHCR (`.github/workflows/publish-backend-image.yml`).
- [x] Proyecto de tests backend (`PortalCV.Api.Tests` con xUnit) y su paso en CI (job `backend`).

### Produccion (Contabo + Cloudflare — ver `docs/produccion/Plan-Trabajo-Produccion.md`)
- [ ] VPS Contabo endurecido (SSH, firewall, Docker instalado).
- [ ] Subdominio creado y proxied en Cloudflare, con TLS configurado.
- [ ] Instancia MariaDB de produccion provisionada (contenedor con volumen persistente).
- [ ] Secretos de produccion configurados (connection string a MariaDB, `Jwt__Key`, etc.).
- [ ] Monitoreo y alertas activos.

## Estados sugeridos
- `Pendiente`: no configurado.
- `En progreso`: parcialmente configurado.
- `Activo`: funcionando y validado.
- `Bloqueado`: requiere decision o acceso externo.
- `Opcional`: util pero no obligatorio para operar el proyecto.
