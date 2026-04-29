# Guia de CI/CD y Despliegue -- Portal CV Web

---

## Referencias

- [Documentacion.md](../arquitectura/Documentacion.md) -- Vision del producto y arquitectura
- [Backlog.md](../arquitectura/Backlog.md) -- Epicas, historias y plan de sprints
- [Runbook-Azure.md](./Runbook-Azure.md) -- Runbook ejecutable con comandos `az` para provisionar Azure
- [database/README.md](../../database/README.md) -- Scripts SQL Server

---

## 1. Decisiones de infraestructura

### Stack definitivo

| Capa | Herramienta | Justificacion |
|------|-------------|---------------|
| **Control de versiones** | GitHub | Estandar de la industria; integrado con Actions |
| **CI/CD** | GitHub Actions | Gratuito (2000 min/mes), integrado al repo |
| **Registro de contenedores** | GitHub Container Registry (GHCR) | Gratuito, integrado con el mismo repositorio |
| **Backend (runtime)** | Azure Container Apps | Free tier generoso; usa el Dockerfile existente; scale-to-zero |
| **Frontend (runtime)** | Azure Static Web Apps | Gratuito; servir Angular como SPA estatica con CDN global |
| **Base de datos** | Azure SQL Database Free Tier | Gratuito siempre; ya configurada y operativa |
| **Cache** | IMemoryCache (.NET in-process) | Integrado en .NET, $0; suficiente para la escala inicial |
| **Almacenamiento de archivos** | -- | Pospuesto a Epica 3 (adjuntos/soportes) |

### Docker: que aplica y que no (para evitar confusion)

- **Azure Static Web Apps (frontend)**: se publica el **build estatico** (`ng build`) como artefactos web (no hay contenedor Nginx del repo en este flujo).
- **Azure Container Apps (backend)**: SI usa **imagen Docker** construida desde `backend/Dockerfile`, publicada en **GHCR** y referenciada por el Container App.
- **Azure SQL Database**: NO corre en Docker; es un servicio administrado en Azure.
- **Desarrollo local en este repositorio**: el camino documentado es **SQL Server local + `dotnet run` + `ng serve`** (sin `docker-compose` en el repo). Docker queda como herramienta **opcional** para construir/validar la imagen del backend.
- **Si se ejecuta el backend en Docker contra el SQL Server del host**: el cliente de SQL en .NET puede intentar resolver `host.docker.internal` por IPv6 y fallar con `Network is unreachable`. Forzar IPv4 agregando `IPAddressPreference=IPv4First;` en la cadena de conexion (ver plantilla `docker/backend.local.env.example`) y arrancar el contenedor con `--add-host=host.docker.internal:host-gateway`.

### Por que no otras opciones

| Descartado | Motivo |
|------------|--------|
| Azure App Service F1 | CPU limitada a 60 min/dia -- se agota con .NET + EF Core |
| Azure App Service con Docker | Requiere tier B1 minimo (~$13/mes) para usar contenedores |
| Redis (Azure Cache) | Minimo $55/mes; IMemoryCache es suficiente para esta escala |
| AKS / Kubernetes | Sobredimensionado para este proyecto en fase inicial |
| AWS / GCP | Stack ya definido sobre Azure; no hay ventaja en dividir nube |

### Arquitectura de entornos

```
+-----------------------------------------------------+
|                  DESARROLLO LOCAL                   |
|  SQL Server (instalacion local)                    |
|  +-- scripts/manual (schema + datos de prueba)     |
|  Backend: dotnet run (PortalCV.Api)                 |
|  Frontend: ng serve (proxy /api -> backend)        |
+-----------------------------------------------------+
                        |  git push / PR
                        v
+-----------------------------------------------------+
|              CI -- GitHub Actions (actual)          |
|  +-- Job backend:  dotnet restore + build           |
|  +-- Job frontend: npm ci + ng build + ng test      |
|  |                 (sube artifact lcov.info)        |
|  +-- Job sonarcloud: descarga cobertura + scan      |
+-----------------------------------------------------+
                        |
                        v
+-----------------------------------------------------+
|        publish-backend-image.yml (activo)           |
|  (solo en push a main o workflow_dispatch)          |
|  +-- docker build + push --> GHCR (activo)          |
|      ghcr.io/<owner>/portalcv-backend:latest        |
|      ghcr.io/<owner>/portalcv-backend:sha-<short>   |
+-----------------------------------------------------+
                        |
                        v
+-----------------------------------------------------+
|       CD -- Deploy Azure (PENDIENTE)                |
|  +-- az containerapp update (backend)               |
|  +-- az staticwebapp deploy (frontend)              |
+-----------------------------------------------------+
                        |
                        v
+-----------------------------------------------------+
|                  PRODUCCION (Azure)                 |
|                                                     |
|  Azure Static Web Apps                              |
|  +-- Angular SPA con CDN global                     |
|       +-- llama a -->                               |
|                                                     |
|  Azure Container Apps                               |
|  +-- .NET 10 API (imagen desde GHCR)                |
|       +-- conecta a -->                             |
|                                                     |
|  Azure SQL Database Free Tier                       |
|  +-- sql-portalcv-mao.database.windows.net          |
|       +-- usuario: portalcv_app_prod                |
+-----------------------------------------------------+
```

> El bloque de deploy es un **diseño futuro**; el unico workflow real hoy es build + test + Sonar (`.github/workflows/ci.yml`). Ver seccion 2 para el YAML propuesto.

---

## 2. Pipeline CI/CD

### Flujo completo

```
feat/* --push--> CI (build + test + sonar)
                          |  aprobado
develop   --PR---> CI (build + test)
                          |  merge a develop
main      --PR---> CI (build + test + sonar)
                          |  merge a main
                   PROMOCION DE CODIGO ESTABLE
```

### Archivo .github/workflows/ci.yml (actual)

El pipeline de CI esta en [../../.github/workflows/ci.yml](../../.github/workflows/ci.yml).

**Jobs actuales (implementados):**

| Job | Trigger | Acciones |
|-----|---------|----------|
| `backend` | Todo push y PR | `dotnet restore` --> `dotnet build --configuration Release` --> `dotnet test` sobre `PortalCV.Api.Tests` (xUnit + WebApplicationFactory + EF InMemory); publica resultados `.trx` como artifact `backend-test-results` |
| `frontend` | Todo push y PR | `npm ci` --> `ng build --configuration production` --> `ng test --configuration ci` (con cobertura) --> sube artifact `frontend-coverage` (`lcov.info`) |
| `sonarcloud` | Todo push y PR | Descarga el artifact `frontend-coverage` y ejecuta `SonarSource/sonarqube-scan-action@v6` con `sonar.javascript.lcov.reportPaths` apuntando al `lcov.info` |

> Variables GitHub necesarias para que Sonar corra: secret `SONAR_TOKEN`; variables `SONAR_ORGANIZATION` y `SONAR_PROJECT_KEY`. Si faltan, el job de Sonar deja un mensaje informativo sin romper el pipeline.

**Jobs de despliegue (pendiente por implementar):**

```yaml
# Solo en push a main
package-and-deploy:
  needs: [backend, frontend]
  if: github.ref == 'refs/heads/main'
  steps:
    # 1. Build y push imagen backend a GHCR
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

    # 2. Actualizar Azure Container Apps con nueva imagen
    - uses: azure/login@v1
      with:
        creds: ${{ secrets.AZURE_CREDENTIALS }}

    - run: |
        az containerapp update \
          --name portalcv-api \
          --resource-group rg-portalcv \
          --image ghcr.io/maomauro/portalcv-backend:${{ github.sha }}

    # 3. Deploy frontend a Azure Static Web Apps
    - uses: Azure/static-web-apps-deploy@v1
      with:
        azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_TOKEN }}
        repo_token: ${{ secrets.GITHUB_TOKEN }}
        action: upload
        app_location: /frontend
        output_location: dist/portalcv-web/browser
```

---

## 3. Recursos Azure

### Recursos a crear (orden recomendado)

```
1. Resource Group:    rg-portalcv
2. Azure SQL DB:      sql-portalcv-mao.database.windows.net/PortalCV   <-- ya existe
3. Container Apps:    portalcv-api   (imagen: ghcr.io/maomauro/portalcv-backend)
   +-- Container Apps Environment: env-portalcv
4. Static Web App:    portalcv-web   (conectado al repo GitHub, rama main)
```

### Configuracion de Azure Container Apps (backend)

| Parametro | Valor |
|-----------|-------|
| Nombre | `portalcv-api` |
| Imagen | `ghcr.io/maomauro/portalcv-backend:latest` |
| CPU | 0.25 vCPU |
| Memoria | 0.5 Gi |
| Min replicas | 0 (scale-to-zero) |
| Max replicas | 1 |
| Puerto | 8080 |
| Ingress | Externo (HTTPS habilitado) |

**Variables de entorno requeridas en Container Apps:**

| Variable | Descripcion |
|----------|-------------|
| `ConnectionStrings__DefaultConnection` | Cadena a Azure SQL con `portalcv_app_prod` |
| `ASPNETCORE_ENVIRONMENT` | `Production` |
| `Jwt__Issuer` | `PortalCV.Api` |
| `Jwt__Audience` | `PortalCV.Client` |
| `Jwt__Key` | Clave JWT de produccion (secret) |
| `Auth__DemoUser__Email` | Email del usuario demo |
| `Auth__DemoUser__Password` | Password del usuario demo |

### Configuracion de Azure Static Web Apps (frontend)

| Parametro | Valor |
|-----------|-------|
| Nombre | `portalcv-web` |
| Repo | `maomauro/Curriculum-Vitae-Web` |
| Rama | `main` |
| App location | `/frontend` |
| Output location | `dist/portalcv-web/browser` |
| API location | -- (API separada en Container Apps) |

> Estado actual: el frontend usa rutas relativas `/api` en los servicios activos.
> Si se adopta una URL absoluta por entorno (`environment.prod.ts`), debe implementarse y versionarse
> explícitamente en la rama correspondiente antes de usar esta estrategia en producción.

**Archivo recomendado (si se usa Azure Static Web Apps): `frontend/public/staticwebapp.config.json`**

Este archivo le indica a Azure Static Web Apps que redirija todas las rutas a `index.html`
(necesario para que el router de Angular funcione correctamente):

```json
{
  "navigationFallback": {
    "rewrite": "/index.html",
    "exclude": ["/api/*", "/*.{css,js,png,jpg,jpeg,gif,ico,svg,woff,woff2}"]
  },
  "globalHeaders": {
    "X-Frame-Options": "SAMEORIGIN",
    "X-Content-Type-Options": "nosniff"
  }
}
```

> Sin este archivo, navegar directamente a rutas internas del SPA puede devolver 404 en Azure Static Web Apps.

**Archivos de environments (opcional, pendiente en este repo):**

| Archivo | Entorno | Estado |
|---------|---------|--------|
| `src/environments/environment.ts` | Desarrollo local | Pendiente (si se migra a URL absoluta) |
| `src/environments/environment.prod.ts` | Produccion | Pendiente (si se migra a URL absoluta) |

### Configuracion de Azure SQL (ya existente)

| Parametro | Valor |
|-----------|-------|
| Servidor | `sql-portalcv-mao.database.windows.net` |
| Base de datos | `PortalCV` |
| Admin | `sqladmin` |
| Usuario app (prod) | `portalcv_app_prod` |
| Permisos | SELECT, INSERT, UPDATE, DELETE, EXECUTE sobre `dbo` |
| Firewall | Permitir servicios Azure (`Allow Azure services: ON`) |

---

## 4. GitHub Secrets a configurar

Ir a **Settings --> Secrets and variables --> Actions** del repositorio y crear:

| Secret | Descripcion | Como obtener |
|--------|-------------|--------------|
| `AZURE_CREDENTIALS` | JSON del Service Principal de Azure | `az ad sp create-for-rbac --role contributor --scopes /subscriptions/.../resourceGroups/rg-portalcv --json-auth` |
| `AZURE_STATIC_WEB_APPS_TOKEN` | Token del Static Web App | Portal Azure --> Static Web App --> Manage token |
| `JWT_KEY_PROD` | Clave de firma JWT produccion | Generar string aleatorio >= 32 chars |
| `AZURE_SQL_CONN_PROD` | Cadena de conexion Azure SQL con `portalcv_app_prod` | Construir con: `Server=tcp:sql-portalcv-mao.database.windows.net,1433;Initial Catalog=PortalCV;User ID=portalcv_app_prod;Password=***;Encrypt=True;TrustServerCertificate=False;` |

> `GITHUB_TOKEN` es automatico -- no requiere creacion manual.

> **Nota frontend:** La URL de produccion del backend (`apiUrl` en `environment.prod.ts`)
> se define directamente en el codigo fuente -- no requiere secret adicional porque es
> una URL publica (el HTTPS del Container App es accesible sin autenticacion para el cliente).

---

## 5. Base de datos -- Scripts por entorno

| Entorno | Scripts | Como ejecutar |
|---------|---------|---------------|
| Local (SQL Server instalado) | `scripts/manual/01_CreateSchema.sql`, `scripts/manual/02_InsertTestData.sql` | Ejecutar desde SSMS contra `localhost\SQLEXPRESS` segun `database/README.md` |
| Azure SQL (prod) | `scripts/production/05_AzureSQL_CreateSchema.sql` | Ejecutar una sola vez desde Azure Data Studio o portal (incluye roles base al final) |

> El script `05_` NO incluye `USE [PortalCV]` -- conectar directamente a la BD destino.
> Los scripts de produccion son idempotentes y ya fueron ejecutados.

---

## 6. Flujo Git hacia Produccion

```
1. DESARROLLO
   git checkout -b feat/nombre-historia
   # ... commits de trabajo ...
   git push origin feat/nombre-historia
   # CI valida build + tests en la rama feat/*

2. INTEGRACION
   PR: feat/nombre-historia --> develop
   # CI vuelve a validar
   # merge aprobado --> develop actualizado

3. RELEASE
   PR: develop --> main
   # CI build + test + sonar
   # merge aprobado --> promoción de código estable
```

---

## 7. Cache en el backend

**Decision:** IMemoryCache (.NET in-process) en lugar de Redis.

| Aspecto | Detalle |
|---------|---------|
| Implementacion | `builder.Services.AddMemoryCache()` + `IMemoryCache` inyectado en servicios |
| Costo | $0 -- integrado en .NET sin dependencias externas |
| Limitacion | Cache local por instancia -- no compartido entre replicas |
| Escala actual | 1 replica en Container Apps -- no hay problema de consistencia |

**TTL recomendados por tipo de dato:**

| Dato | TTL sugerido |
|------|-------------|
| Roles y permisos | 15 minutos |
| Datos de perfil CV | 5 minutos |
| Listas de categorias | 30 minutos |

> Si el proyecto escala a multiples replicas, migrar a Azure Cache for Redis o SQL-backed cache.

---

## 8. Arquitectura del frontend Angular

### Estructura de modulos (diseno final)

```
src/app/
+-- core/                  Servicios singleton, interceptores, guards
|   +-- services/
|   |   +-- api.service.ts       Cliente HTTP base (usa environment.apiUrl)
|   |   +-- auth.service.ts      Gestion de sesion y token JWT
|   +-- interceptors/
|   |   +-- auth.interceptor.ts  Inyecta Bearer token en cada request
|   |   +-- error.interceptor.ts Manejo centralizado de errores HTTP
|   +-- guards/                  authGuard (rutas privadas), adminGuard (admin)
+-- features/              Modulos por area funcional (lazy loading)
|   +-- public/            Landing, busqueda de CVs, detalle CV (con pestana analitica)
|   +-- auth/              Login, registro, recuperacion de contrasena
|   +-- privado/           10 rutas planas protegidas (authGuard):
|   |                      /dashboard, /alertas, /mi-cv, /datos-personales, /perfil,
|   |                      /experiencia, /educacion, /habilidades, /proyectos, /configuracion
|   +-- admin/             Panel de administracion (adminGuard): /admin
+-- layout/                Shells de la app por contexto:
|                          PublicLayoutComponent, AuthLayoutComponent, AdminLayoutComponent
+-- shared/                Componentes y pipes reutilizables
```

### Como funciona la URL del backend segun entorno

Angular es codigo que se ejecuta en el navegador del usuario. A diferencia del backend (.NET),
NO puede leer variables de entorno del servidor en runtime. La URL del API se fija en BUILD TIME:

```
DESARROLLO LOCAL
  environment.ts           --> apiUrl = http://localhost:<puerto-backend>/api   (segun launchSettings / dotnet run)
  ng serve                 --> usa este archivo
  Angular DevServer        --> proxy al backend

PRODUCCION
  environment.prod.ts      --> apiUrl = https://portalcv-api.azurecontainerapps.io/api
  ng build --configuration production --> reemplaza environment.ts por environment.prod.ts
  Resultado: archivos JS estaticos con la URL de prod embebida
```

El mecanismo de reemplazo se configura en `angular.json` bajo `fileReplacements`:

```json
"configurations": {
  "production": {
    "fileReplacements": [
      {
        "replace": "src/environments/environment.ts",
        "with":    "src/environments/environment.prod.ts"
      }
    ]
  }
}
```

### Enrutamiento SPA en Azure Static Web Apps

Azure Static Web Apps sirve archivos estaticos. Cuando el usuario navega directamente a
`/auth/login` o recarga la pagina, el servidor busca ese archivo fisico -- que no existe.
Para que Angular maneje esas rutas se necesita `frontend/public/staticwebapp.config.json`:

```json
{
  "navigationFallback": {
    "rewrite": "/index.html",
    "exclude": ["/api/*", "/*.{css,js,png,jpg,jpeg,gif,ico,svg,woff,woff2}"]
  },
  "globalHeaders": {
    "X-Frame-Options": "SAMEORIGIN",
    "X-Content-Type-Options": "nosniff"
  }
}
```

### CORS: quien permite que el frontend llame al backend

El frontend (en `azurestaticapps.net`) llama al backend (en `azurecontainerapps.io`).
Son dominios distintos -- el backend necesita permitir ese origen en su configuracion CORS.
El backend .NET ya tiene CORS configurado; al crear el Container App hay que agregar el
dominio del Static Web App como origen permitido en las variables de entorno.

### Pendiente implementar (rama feat/hs-frontend-config)

| Tarea | Archivo | Detalle |
|-------|---------|---------|
| Crear environments | `src/environments/environment.ts` y `environment.prod.ts` | Con `apiUrl` por entorno |
| Conectar ApiService | `core/services/api.service.ts` | Usar `environment.apiUrl` en lugar de URL hardcodeada |
| Configurar fileReplacements | `angular.json` | Reemplazo automatico en build produccion |
| Crear config SPA | `public/staticwebapp.config.json` | Fallback al index.html para rutas Angular |

---

## 9. Checklist de despliegue inicial

```
AZURE
[ ] Crear Resource Group rg-portalcv
[ ] Verificar Azure SQL Database operativa (ya hecho)
[ ] Crear Container Apps Environment (env-portalcv)
[ ] Crear Container App portalcv-api
[ ] Configurar variables de entorno en Container App
[ ] Configurar firewall Azure SQL: Allow Azure services ON
[ ] Crear Azure Static Web App portalcv-web (conectar a repo)

GITHUB
[ ] Configurar secrets: AZURE_CREDENTIALS, AZURE_STATIC_WEB_APPS_TOKEN, JWT_KEY_PROD
[ ] Hacer merge de feat/hs08-cicd-docs --> develop --> main
[ ] Verificar que el pipeline CI pase en main
[ ] Confirmar que Container Apps recibe la imagen
[ ] Confirmar que Static Web Apps despliega el frontend

VALIDACION
[ ] https://portalcv-api.azurecontainerapps.io/swagger accesible
[ ] https://portalcv-web.azurestaticapps.net carga la app Angular
[ ] Frontend puede hacer login contra la API
[ ] API conecta correctamente a Azure SQL
```