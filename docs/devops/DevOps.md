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
| Base de datos (local) | SQL Server (instalación local) | según entorno | Desarrollo |
| Base de datos (prod) | Azure SQL Database Free Tier | -- | Produccion |
| Contenedores (build) | Docker (opcional) | -- | Solo para construir/pushear imagen backend hacia GHCR |
| Hosting backend | Azure Container Apps | Free tier | scale-to-zero, imagen GHCR |
| Hosting frontend | Azure Static Web Apps | Free | CDN global, Angular SPA |
| Cache | IMemoryCache (.NET in-process) | -- | Sin dependencia externa; $0 |
| Logging | Serilog | -- | Structured logs en consola y archivo |
| Auth | JWT Bearer | -- | Tokens de acceso (15 min) |
| Pruebas backend | xUnit | -- | Unitarias e integracion |
| Pruebas frontend | Karma + Jasmine | -- | Unit tests Angular con ChromeHeadlessCI |

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

| Job | Trigger | Pasos |
|-----|---------|-------|
| `backend` | Todo push y PR | dotnet restore, dotnet build Release |
| `frontend` | Todo push y PR | npm ci, ng build production, ng test --configuration ci |
| `sonarcloud` | Todo push y PR | Sonar scan (si hay configuración disponible) |

### Configuracion del job deploy (pendiente implementar)

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

    - uses: azure/login@v1
      with:
        creds: ${{ secrets.AZURE_CREDENTIALS }}

    - run: |
        az containerapp update \
          --name portalcv-api \
          --resource-group rg-portalcv \
          --image ghcr.io/maomauro/portalcv-backend:${{ github.sha }}

    - uses: Azure/static-web-apps-deploy@v1
      with:
        azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_TOKEN }}
        repo_token: ${{ secrets.GITHUB_TOKEN }}
        action: upload
        app_location: /frontend
        output_location: dist/portalcv-web/browser
```

---

## 4. Entorno local (sin Docker obligatorio)

### Flujo recomendado

1. **Base de datos**: SQL Server local + scripts en `scripts/manual/` (ver `database/README.md`).
2. **Backend**: `dotnet run` desde `backend/PortalCV.Backend/PortalCV.Api` con secretos locales (`dotnet user-secrets`).
3. **Frontend**: `npm ci` + `ng serve` desde `frontend/` (proxy `/api` hacia el backend local).

### Docker (solo para imagen backend / paridad con ACA)

El runtime productivo del backend en Azure Container Apps se basa en **imagen Docker** desde `backend/Dockerfile`.
Para validar localmente la imagen (opcional):

```bash
docker build -f backend/Dockerfile -t portalcv-backend:local ./backend
```

---

## 5. Recursos Azure (produccion)

| Recurso | Nombre | Tipo | Estado |
|---------|--------|------|--------|
| Resource Group | `rg-portalcv` | Contenedor de recursos | Pendiente crear |
| Azure SQL Database | `sql-portalcv-mao.database.windows.net / PortalCV` | Free Tier | OPERATIVA |
| Container Apps Environment | `env-portalcv` | Entorno ACA | Pendiente crear |
| Container App | `portalcv-api` | Backend .NET 10 | Pendiente crear |
| Static Web App | `portalcv-web` | Frontend Angular | Pendiente crear |

> Ver [Despliegue.md](Despliegue.md) para parametros de configuracion y comandos de creacion.

---

## 6. Secretos GitHub Actions requeridos

| Secret | Descripcion |
|--------|-------------|
| `AZURE_CREDENTIALS` | JSON del Service Principal (rol Contributor en rg-portalcv) |
| `AZURE_STATIC_WEB_APPS_TOKEN` | Token de deploy del Static Web App |
| `JWT_KEY_PROD` | Clave de firma JWT (>= 32 caracteres) |
| `AZURE_SQL_CONN_PROD` | Cadena de conexion a Azure SQL con portalcv_app_prod |

> `GITHUB_TOKEN` es automatico -- no requiere configuracion.

---

## 7. Monitoreo y observabilidad

### Local

- Logs de Serilog en consola (salida del proceso `dotnet run`)
- Swagger UI: revisar `backend/PortalCV.Backend/PortalCV.Api/Properties/launchSettings.json` (típico `http://localhost:5005/swagger`)

### Produccion (Azure)

| Herramienta | Tipo | Como acceder |
|-------------|------|--------------|
| Container Apps logs | Logs de aplicacion | Portal Azure -> Container App -> Log stream |
| Azure Monitor | Metricas de recursos | Portal Azure -> Monitor |
| Serilog stdout | Logs estructurados | Capturados automaticamente por Container Apps |

> Application Insights puede agregarse como mejora futura sin coste en capa gratuita.

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
| `scripts/manual/01_CreateSchema.sql` | Local | Esquema completo SQL Server |
| `scripts/manual/02_InsertTestData.sql` | Local | Datos de prueba |
| `scripts/production/05_AzureSQL_CreateSchema.sql` | Azure SQL | DDL sin USE [DB] + roles base al final -- ejecutar 1 vez |

> Los scripts de Azure SQL ya fueron ejecutados en el servidor de produccion.