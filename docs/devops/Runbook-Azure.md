# Runbook de Despliegue en Azure — PortalCV

Runbook operativo con los comandos `az` en orden, para provisionar desde cero la infraestructura descrita en [Despliegue.md](./Despliegue.md).

> Este documento es **ejecutable**: cada bloque se puede copiar tal cual en PowerShell (o bash) una vez autenticado en Azure. Los valores entre `{}` son placeholders que debes reemplazar.

---

## Referencias
- [Despliegue.md](./Despliegue.md) — decisiones de infraestructura y arquitectura
- [Plan-Trabajo-Produccion.md](../produccion/Plan-Trabajo-Produccion.md) — fases de salida a producción
- [Checklist-Produccion.md](./Checklist-Produccion.md) — verificación previa a publicar

---

## 0. Prerequisitos

### Herramientas
```powershell
az --version          # Azure CLI >= 2.60
az extension add --name containerapp --upgrade
az extension add --name staticwebapp --upgrade
```

### Autenticación y suscripción
```powershell
az login
az account set --subscription "{nombre-o-id-de-la-suscripcion}"
az account show --query "{name:name, id:id}" -o table
```

### Variables del runbook
```powershell
# Globales
$RG            = "rg-portalcv"
$LOCATION      = "eastus2"            # Ajustar si la suscripcion exige otra region

# Azure SQL (ya existe, no se crea en este runbook)
$SQL_SERVER    = "sql-portalcv-mao"
$SQL_DB        = "PortalCV"
$SQL_APP_USER  = "portalcv_app_prod"
# $SQL_APP_PASS debe cargarse desde un secret manager, NO hardcodearse en PowerShell

# Container Apps (backend)
$ACA_ENV       = "env-portalcv"
$ACA_APP       = "portalcv-api"
$GHCR_IMAGE    = "ghcr.io/maomauro/portalcv-backend:latest"

# Static Web Apps (frontend)
$SWA_APP       = "portalcv-web"
$REPO_URL      = "https://github.com/maomauro/Curriculum-Vitae-Web"
$REPO_BRANCH   = "main"

# JWT produccion (cargar desde GitHub Secrets o Key Vault al ejecutar)
# $JWT_KEY_PROD debe ser un string >= 32 caracteres aleatorio
```

---

## 1. Resource Group

```powershell
az group create --name $RG --location $LOCATION
az group show --name $RG -o table
```

**Criterio de éxito:** el RG aparece listado con `provisioningState = Succeeded`.

---

## 2. Azure SQL Database (solo verificación)

El servidor y la base de datos ya existen (`sql-portalcv-mao.database.windows.net/PortalCV`). Este paso solo valida conectividad y firewall.

```powershell
# Verificar que el servidor responde
az sql server show --name $SQL_SERVER --resource-group $RG -o table

# Verificar que la base existe
az sql db show --name $SQL_DB --server $SQL_SERVER --resource-group $RG -o table

# Firewall: permitir servicios Azure (requerido para que ACA conecte)
az sql server firewall-rule create `
  --server $SQL_SERVER `
  --resource-group $RG `
  --name AllowAzureServices `
  --start-ip-address 0.0.0.0 `
  --end-ip-address 0.0.0.0
```

**Criterio de éxito:**
- El schema ya está aplicado (`scripts/production/05_AzureSQL_CreateSchema.sql`).
- El usuario `portalcv_app_prod` existe con permisos `SELECT/INSERT/UPDATE/DELETE/EXECUTE` sobre `dbo`.
- Conexión probada desde SSMS o Azure Data Studio con credenciales de app.

---

## 3. Azure Container Apps (backend)

### 3.1 Crear el Environment
```powershell
az containerapp env create `
  --name $ACA_ENV `
  --resource-group $RG `
  --location $LOCATION
```

### 3.2 Crear la Container App apuntando a GHCR

> Requisito previo: la imagen `ghcr.io/maomauro/portalcv-backend:latest` debe existir en GHCR. Si la imagen es **privada**, hay que darle acceso al Container App (ver paso 3.4).

```powershell
az containerapp create `
  --name $ACA_APP `
  --resource-group $RG `
  --environment $ACA_ENV `
  --image $GHCR_IMAGE `
  --target-port 8080 `
  --ingress external `
  --cpu 0.25 --memory 0.5Gi `
  --min-replicas 0 --max-replicas 1 `
  --env-vars `
    ASPNETCORE_ENVIRONMENT=Production `
    Jwt__Issuer=PortalCV.Api `
    Jwt__Audience=PortalCV.Client `
    Cors__AllowedOrigins__0=https://placeholder.invalid
```

> **Nota sobre CORS**: `Program.cs` valida en arranque que `Cors:AllowedOrigins` tenga al menos un origen cuando `ASPNETCORE_ENVIRONMENT=Production`. Por eso se pasa `https://placeholder.invalid` como valor temporal: permite que la API arranque y el endpoint `/health` responda, aunque el SPA todavía no pueda consumirla. En el **paso 5** se reemplaza por el `defaultHostname` del Static Web App real.

### 3.3 Configurar secretos y variables sensibles

```powershell
# Cargar las variables sensibles desde GitHub Secrets o Key Vault antes de ejecutar.
# Ejemplo usando variables de PowerShell ya pobladas fuera de este archivo:

az containerapp secret set `
  --name $ACA_APP `
  --resource-group $RG `
  --secrets `
    jwt-key=$JWT_KEY_PROD `
    sql-conn="Server=tcp:$SQL_SERVER.database.windows.net,1433;Initial Catalog=$SQL_DB;User ID=$SQL_APP_USER;Password=$SQL_APP_PASS;Encrypt=True;TrustServerCertificate=False;"

az containerapp update `
  --name $ACA_APP `
  --resource-group $RG `
  --set-env-vars `
    ConnectionStrings__DefaultConnection=secretref:sql-conn `
    Jwt__Key=secretref:jwt-key
```

### 3.4 (Opcional) GHCR como registro privado

Si la imagen en GHCR es privada, registrar credenciales de pull:

```powershell
# Se requiere un PAT de GitHub con scope `read:packages`
az containerapp registry set `
  --name $ACA_APP `
  --resource-group $RG `
  --server ghcr.io `
  --username {github-user} `
  --password {github-pat-read-packages}
```

### 3.5 Obtener la URL pública del backend

```powershell
az containerapp show `
  --name $ACA_APP `
  --resource-group $RG `
  --query "properties.configuration.ingress.fqdn" -o tsv
```

**Criterio de éxito:** `curl https://{fqdn}/health` responde `200 OK` con body `Healthy` (endpoint provisto por `Microsoft.Extensions.Diagnostics.HealthChecks` desde la versión actual del backend).

---

## 4. Azure Static Web Apps (frontend)

### 4.0 `staticwebapp.config.json` (ya versionado)

El archivo `frontend/public/staticwebapp.config.json` ya está versionado en el repo y se copia automáticamente a la raíz del bundle gracias al glob `public` configurado en `angular.json`. Define:

- `navigationFallback` → cualquier ruta que no sea un asset se reescribe a `/index.html` (Angular controla la ruta). Esto evita 404 al refrescar en `/auth/login`, `/public/cvs/{slug}`, etc.
- Exclusiones explícitas para `/api/*` y assets típicos.
- `globalHeaders` con `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy` y `Permissions-Policy`.

No requiere acción manual; solo verificar que tras el primer deploy de SWA una ruta directa responde 200 (ver §4.3).

### 4.1 Crear el recurso conectado al repo

```powershell
# Requiere un PAT de GitHub con scope `repo` para que Azure pueda crear el workflow.
az staticwebapp create `
  --name $SWA_APP `
  --resource-group $RG `
  --location $LOCATION `
  --source $REPO_URL `
  --branch $REPO_BRANCH `
  --app-location "/frontend" `
  --output-location "dist/portalcv-web/browser" `
  --login-with-github
```

Esto crea automáticamente un workflow en `.github/workflows/azure-static-web-apps-*.yml` que hace build + deploy en cada push a `main`.

### 4.2 Configurar variables de entorno (si el frontend usa URL absoluta)

Hoy el frontend usa rutas relativas `/api`. Si se migra a URL absoluta (`environment.prod.ts`), la URL del backend (fqdn del paso 3.5) puede inyectarse al build:

```powershell
az staticwebapp appsettings set `
  --name $SWA_APP `
  --resource-group $RG `
  --setting-names `
    API_URL=https://{fqdn-del-container-app}
```

### 4.3 Obtener la URL pública del frontend

```powershell
az staticwebapp show `
  --name $SWA_APP `
  --resource-group $RG `
  --query "defaultHostname" -o tsv
```

**Criterio de éxito:** el SPA carga en `https://{defaultHostname}` y navegar directo a `/auth/login` **no** devuelve 404 (requiere `frontend/public/staticwebapp.config.json` con `navigationFallback`).

---

## 5. CORS: habilitar el frontend en el backend

Una vez se tiene la URL del SWA, configurarla como origen permitido en el Container App:

```powershell
az containerapp update `
  --name $ACA_APP `
  --resource-group $RG `
  --set-env-vars Cors__AllowedOrigins__0=https://{defaultHostname-swa}
```

**Criterio de éxito:** el frontend consume `/api/...` sin errores CORS en la consola del navegador.

---

## 6. GitHub Secrets requeridos para CI/CD

Ir a **Settings → Secrets and variables → Actions** del repo:

| Tipo | Nombre | Cómo obtenerlo |
|---|---|---|
| Secret | `AZURE_CREDENTIALS` | `az ad sp create-for-rbac --role contributor --scopes /subscriptions/{sub-id}/resourceGroups/rg-portalcv --json-auth` |
| Secret | `AZURE_STATIC_WEB_APPS_TOKEN` | Portal Azure → Static Web App → Manage deployment token |
| Secret | `JWT_KEY_PROD` | Generar aleatorio ≥ 32 chars (ver comando en `docs/guias/Inventario-minimo-local.md`) |
| Secret | `AZURE_SQL_CONN_PROD` | Cadena completa con `portalcv_app_prod` |

> Evaluar migrar `AZURE_CREDENTIALS` a **OIDC federado** (sin password estático) cuando se consolide el flujo. Ver `docs/guias/Guia-secrets-y-credenciales.md`.

---

## 7. Smoke test end-to-end

Después de que backend y frontend estén desplegados:

```powershell
$BACKEND = "https://{fqdn-del-container-app}"
$FRONTEND = "https://{defaultHostname-swa}"

# Health del backend
curl.exe "$BACKEND/health"

# Endpoints publicos (sin auth)
curl.exe "$BACKEND/api/public/cvs"
curl.exe "$BACKEND/api/public/filters"

# Frontend carga
curl.exe -I "$FRONTEND"

# Ruta directa no-raiz (valida navigationFallback)
curl.exe -I "$FRONTEND/auth/login"
```

**Criterio de éxito:** todos los status `200 OK`; navegación manual del SPA funciona y logs del Container App se ven con:

```powershell
az containerapp logs show --name $ACA_APP --resource-group $RG --follow
```

---

## 8. Rollback rápido

Estrategia mínima: reapuntar el Container App a una imagen previa de GHCR.

```powershell
# Listar revisiones disponibles
az containerapp revision list `
  --name $ACA_APP `
  --resource-group $RG `
  -o table

# Activar una revision previa
az containerapp revision activate `
  --name $ACA_APP `
  --resource-group $RG `
  --revision {nombre-revision-anterior}
```

Para el frontend, SWA mantiene deploys históricos en el portal: se puede reactivar un deployment anterior desde **Environments → Production → History**.

---

## 9. Limpieza (solo si se decide desmontar el entorno)

> **Irreversible.** Destruye todos los recursos del RG excepto Azure SQL si se decide conservar la base.

```powershell
# Opcion A: destruir RG completo (incluye Azure SQL si esta ahi)
az group delete --name $RG --yes --no-wait

# Opcion B: destruir solo ACA y SWA, conservar Azure SQL
az containerapp delete --name $ACA_APP --resource-group $RG --yes
az containerapp env delete --name $ACA_ENV --resource-group $RG --yes
az staticwebapp delete --name $SWA_APP --resource-group $RG --yes
```

---

## Checklist final

- [ ] RG `rg-portalcv` creado.
- [ ] Firewall Azure SQL con "Allow Azure services" activo.
- [ ] Container App Environment `env-portalcv` creado.
- [ ] Container App `portalcv-api` desplegado con imagen de GHCR.
- [ ] Secrets `jwt-key` y `sql-conn` cargados en el Container App.
- [ ] Static Web App `portalcv-web` conectado al repo.
- [ ] `frontend/public/staticwebapp.config.json` versionado con `navigationFallback`.
- [ ] CORS del backend apuntando al `defaultHostname` del SWA.
- [ ] GitHub Secrets (`AZURE_CREDENTIALS`, `AZURE_STATIC_WEB_APPS_TOKEN`, `JWT_KEY_PROD`, `AZURE_SQL_CONN_PROD`) creados.
- [ ] Smoke test end-to-end OK.
- [ ] Procedimiento de rollback probado al menos una vez.
