# DevOps -- Portal CV Web

Practicas y lineamientos de operacion tecnica del proyecto. Complementa [Despliegue.md](Despliegue.md).

---

## 1. Stack tecnologico definido

| Capa | Herramienta | Version | Rol |
|------|-------------|---------|-----|
| Control de versiones | GitHub | SaaS | Repositorio central |
| CI/CD | GitHub Actions | 2000 min/mes gratis | Build, test y validación de calidad |
| Registro de contenedores | GHCR (GitHub Container Registry) | Gratuito | Almacena imagenes Docker |
| Backend | .NET 10 | LTS | API REST (Clean Architecture) |
| Frontend | Angular | 20.1.1 | SPA servida como estatico |
| ORM | Entity Framework Core | 10 | Acceso a datos |
| Base de datos | MariaDB (`mariadb:11`) | -- | Local vía `docker-compose.yml`; producción en VPS de Contabo (contenedor propio) |
| Contenedores (build) | Docker (opcional) | -- | Solo para construir/pushear imagen backend hacia GHCR |
| Hosting (backend + frontend) | VPS Contabo (Cloud VPS 6) | -- | Nginx enruta `/api/*` al backend (imagen GHCR), resto sirve el build de Angular |
| DNS / proxy / TLS | Cloudflare | Free | Subdominio sobre `sitiosapps.com` |
| Cache | IMemoryCache (.NET in-process) | -- | Sin dependencia externa; $0 |
| Logging | Serilog | -- | Structured logs en consola y archivo |
| Auth | JWT Bearer | -- | Tokens de acceso (15 min) |
| Pruebas backend | xUnit | -- | Tests de integracion sobre `PortalCV.Api.Tests` (WebApplicationFactory + EF InMemory). Se extenderan con tests unitarios de servicios en Fase 2. |
| Pruebas frontend | Karma + Jasmine | -- | Unit tests Angular con ChromeHeadless + cobertura LCOV hacia Sonar |

---

## 2. Flujo Git

```
feat/* --push--> CI passes
              |
              v PR aprobado
           develop ---> CI passes
              |
              v PR aprobado
             main ---> CI + calidad en verde
```

### Reglas de ramas

| Rama | Descripcion | Merge via | CI obligatorio |
|------|-------------|-----------|----------------|
| `main` | Codigo desplegado en produccion | PR desde develop | Si |
| `develop` | Integracion de features aprobados | PR desde feat/* | Si |
| `feat/*` | Nueva historia de usuario o tecnica | push directo | Si |
| `bugfix/*` | Correccion de error en develop | push directo | Si |
| `hotfix/*` | Parche critico de produccion | PR a main y develop | Si |

> Proteccion configurada en GitHub: push directo bloqueado en main y develop.
> Ver [Politica-Proteccion-Ramas.md](Politica-Proteccion-Ramas.md) para detalles.

---

## 3. Pipeline CI/CD

### Archivo: .github/workflows/ci.yml

Existen dos workflows:

- `.github/workflows/ci.yml` — validación continua (build + test + Sonar) en **todo push y PR**.
- `.github/workflows/publish-backend-image.yml` — publicación de imagen Docker del backend a GHCR en **merge a `main`** (o disparo manual).

#### ci.yml

| Job | Trigger | Pasos |
|-----|---------|-------|
| `backend` | Todo push y PR | `dotnet restore`, `dotnet build --configuration Release`, `dotnet test` sobre `PortalCV.Api.Tests` (xUnit) y subida del `.trx` como artifact. |
| `frontend` | Todo push y PR | `npm ci`, `ng build --configuration production`, `ng test --configuration ci` (con cobertura). Sube artifact `frontend-coverage` con `lcov.info`. |
| `sonarcloud` | Todo push y PR (depende de `backend` y `frontend`) | Descarga el artifact `frontend-coverage` y corre `SonarSource/sonarqube-scan-action@v6` pasando `sonar.javascript.lcov.reportPaths`, `sonar.tests`, `sonar.test.inclusions` y exclusiones de cobertura. |

#### publish-backend-image.yml

| Job | Trigger | Pasos |
|-----|---------|-------|
| `publish` | `push` a `main` con cambios en `backend/**` o en el propio workflow, y `workflow_dispatch` | Login a GHCR con `GITHUB_TOKEN`, extrae tags con `docker/metadata-action` (`latest` solo en `main` + `sha-<short>`), `docker/build-push-action` con cache GHA, publica `ghcr.io/<owner>/portalcv-backend:<tags>` |

Esta imagen es la que se despliega en el VPS de Contabo según [../produccion/Plan-Trabajo-Produccion.md](../produccion/Plan-Trabajo-Produccion.md).

### Variables / secretos de CI requeridos

| Tipo | Nombre | Proposito |
|------|--------|-----------|
| Secret | `SONAR_TOKEN` | Token de analisis de SonarCloud. |
| Variable | `SONAR_ORGANIZATION` | Organization key en SonarCloud. |
| Variable | `SONAR_PROJECT_KEY` | Project key en SonarCloud. |

> Si alguno falta, el job `sonarcloud` emite un warning informativo pero **no rompe** el pipeline.

### Configuracion del job deploy (pendiente implementar)

Publica la imagen a GHCR (ya activo) y luego conecta por SSH al VPS de
Contabo para actualizar los contenedores en produccion — ver
[../produccion/Plan-Trabajo-Produccion.md](../produccion/Plan-Trabajo-Produccion.md) Fase 6:

```yaml
package-and-deploy:
  needs: [backend, frontend]
  if: github.ref == 'refs/heads/main'
  runs-on: ubuntu-latest
  steps:
    - uses: docker/login-action@v3
      with:
        registry: ghcr.io
        username: ${{ github.actor }}
        password: ${{ secrets.GITHUB_TOKEN }}

    - uses: docker/build-push-action@v5
      with:
        context: ./backend
        push: true
        tags: ghcr.io/maomauro/portalcv-backend:${{ github.sha }}

    - uses: appleboy/ssh-action@v1
      with:
        host: ${{ secrets.CONTABO_SSH_HOST }}
        username: ${{ secrets.CONTABO_SSH_USER }}
        key: ${{ secrets.CONTABO_SSH_KEY }}
        script: |
          cd /opt/portalcv
          docker compose -f docker-compose.prod.yml pull
          docker compose -f docker-compose.prod.yml up -d
```

---

## 4. Entorno local (sin Docker obligatorio)

### Flujo recomendado

1. **Base de datos**: MariaDB local (`docker compose up --build` o instancia propia) + `database/01_CreateSchema.sql` (ver `database/README.md`).
2. **Backend**: `dotnet run` desde `backend/PortalCV.Backend/PortalCV.Api` con secretos locales (`dotnet user-secrets`).
3. **Frontend**: `npm ci` + `ng serve` desde `frontend/` (proxy `/api` y `/health` hacia el backend local).

### Docker (imagen de produccion del backend)

El runtime productivo del backend en el VPS de Contabo se basa en **imagen Docker** desde `backend/Dockerfile`.
Para validar localmente la imagen (opcional):

```bash
docker build -f backend/Dockerfile -t portalcv-backend:local ./backend
```

### Docker Compose (entorno local completo, MariaDB)

Para desarrollo con MariaDB (ver `database/README.md`), `docker-compose.yml`
en la raíz levanta MariaDB + backend + frontend juntos con hot-reload (`dotnet watch` /
`ng serve`). Mapa completo de qué archivo Docker vive dónde y por qué: `docker/README.md`.

```bash
docker compose up --build
```

---

## 5. Recursos de produccion (Contabo + Cloudflare)

| Recurso | Detalle | Estado |
|---------|---------|--------|
| VPS Contabo | Cloud VPS 6, IP `13.140.188.159`, Hub Europe | Contratado, sin configurar |
| Subdominio Cloudflare | Sobre `sitiosapps.com`, a elegir | Pendiente crear |
| `docker-compose.prod.yml` | MariaDB + backend (imagen GHCR) + Nginx | Pendiente crear |

> Ver [../produccion/Plan-Trabajo-Produccion.md](../produccion/Plan-Trabajo-Produccion.md) para las fases y comandos de puesta en marcha.

---

## 6. Secretos GitHub Actions requeridos

| Secret | Descripcion |
|--------|-------------|
| `CONTABO_SSH_HOST` | IP o hostname del VPS de Contabo |
| `CONTABO_SSH_USER` | Usuario no-root usado para el deploy |
| `CONTABO_SSH_KEY` | Llave privada SSH para conectar al VPS |
| `JWT_KEY_PROD` | Clave de firma JWT (>= 32 caracteres) |
| `DB_CONNECTION_PROD` | Cadena de conexion a MariaDB en produccion |

> `GITHUB_TOKEN` es automatico -- no requiere configuracion.

---

## 7. Monitoreo y observabilidad

### Local

- Logs de Serilog en consola (salida del proceso `dotnet run`)
- Swagger UI: revisar `backend/PortalCV.Backend/PortalCV.Api/Properties/launchSettings.json` (típico `http://localhost:5005/swagger`)

### Produccion (VPS Contabo)

| Herramienta | Tipo | Como acceder |
|-------------|------|--------------|
| Logs de contenedores | Logs de aplicacion | `docker compose -f docker-compose.prod.yml logs -f` en el VPS |
| Serilog stdout | Logs estructurados | Capturados por Docker (`docker logs`) |
| Cloudflare Analytics | Trafico y errores de borde | Dashboard de Cloudflare del dominio |
| Uptime | Disponibilidad externa | Cloudflare Health Checks o UptimeRobot (no hay un equivalente al "log stream" de un PaaS en un VPS propio) |

---

## 8. Pruebas

### Backend

```bash
cd backend/PortalCV.Backend
dotnet test
```

### Frontend

```bash
cd frontend
npm test                         # modo watch (desarrollo)
npm run test -- --configuration ci  # modo CI (headless, una sola ejecucion)
```

El modo CI usa `ChromeHeadless` y está configurado en `frontend/angular.json` (`architect.test.configurations.ci`).

También puede ejecutarse directamente con:

```bash
npx ng test --configuration ci
```

---

## 9. Convenciones de commits

Seguir Conventional Commits (ver [Guia-git.md](../guias/Guia-git.md)):

| Tipo | Cuando usarlo |
|------|--------------|
| `feat` | Nueva funcionalidad |
| `fix` | Correccion de error |
| `docs` | Solo cambios de documentacion |
| `refactor` | Cambio sin impacto funcional |
| `test` | Agregar o corregir tests |
| `chore` | Actualizacion de dependencias, config |
| `ci` | Cambios en el pipeline |

---

## 10. Scripts de base de datos

| Script | Entorno | Descripcion |
|--------|---------|-------------|
| `database/01_CreateSchema.sql` | Local / cualquier entorno | Esquema completo MariaDB (tablas, indices, triggers y roles base). Fuente de verdad -- ver `database/README.md`. |

> Lo monta `docker-compose.yml` (servicio `db`) como script de inicializacion de MariaDB; corre solo la primera vez, con el volumen de datos vacio.