# Plan de Trabajo para Salida a Produccion — PortalCV

Estado del plan: En ejecucion
Fecha de corte: 23-04-2026
Rama de trabajo actual: `feat/backend` (operativo)

---

## Objetivo

Publicar PortalCV en Azure con riesgo controlado, validando seguridad minima, CI/CD, infraestructura y pruebas funcionales end-to-end.

---

## Estado actual (resumen)

- Completado:
  - Azure SQL Database Free Tier creado
  - Build backend Release OK
  - Build frontend produccion OK
  - Swagger y rutas principales alineadas
  - Secretos retirados de `launchSettings.json` (flujo con `dotnet user-secrets` y `docker/backend.local.env`)
  - Tests frontend en CI con `--configuration=ci` (headless) y cobertura LCOV subida a SonarCloud
  - SonarCloud Quality Gate en verde en `main`; 6 security hotspots resueltos
  - Docker Compose retirado del repo; Dockerfile del backend endurecido (usuario `app`, binarios read-only)
  - Runbook de despliegue en Azure con comandos `az` ejecutables (`docs/devops/Runbook-Azure.md`)
  - Workflow de publicacion a GHCR (`.github/workflows/publish-backend-image.yml`): publica `ghcr.io/<owner>/portalcv-backend:latest` + `sha-<short>` en cada merge a `main`
  - CD backend a Azure Container Apps en el workflow (`deploy-aca`) con login por service principal usando `AZURE_CREDENTIALS`
  - Proyecto de tests backend `PortalCV.Api.Tests` (xUnit + WebApplicationFactory + EF InMemory) ejecutandose en CI (job `backend`)
  - Endpoint `/health` habilitado y respondiendo `200` en produccion
  - ACA operativo en `CV-Mao`: `env-portalcv` + `portalcv-api` con ingress publico y variables/sensibles cargados
  - Conectividad SQL validada en runtime con `portalcv_app_prod` (incluye correccion de permisos `dbo` y prueba de endpoint publico)
- Pendiente critico:
  - Provision de Azure Static Web Apps (seguir Runbook §4)
  - Actualizar CORS con `defaultHostname` real del SWA (Runbook §5)
  - Cierre de checklist de despliegue

---

## Tablero de trabajo (checklist)

### Fase 1 — Hardening tecnico minimo (bloqueante)

- [x] Mover secretos hardcodeados de launchSettings a user-secrets o configuracion local no versionada
  - Criterio de cierre: launchSettings sin valores sensibles reales ✅
- [x] Corregir comando de tests frontend en CI
  - Criterio de cierre: job frontend ejecuta tests en modo CI de forma deterministica ✅ (`--configuration=ci` + cobertura hacia Sonar)
- [x] Definir puerta minima de pruebas backend ✅
  - Criterio de cierre: existe al menos 1 proyecto de test backend y CI lo ejecuta — `PortalCV.Api.Tests` con 5 tests de integracion (WebApplicationFactory + EF InMemory); ejecutado en job `backend` y con artifact `backend-test-results`
- [ ] Endurecer manejo de errores en frontend (status 0, 4xx, 5xx)
  - Criterio de cierre: notificacion centralizada y flujo de sesion coherente
- [ ] Validar expiracion de token antes de adjuntar Authorization
  - Criterio de cierre: interceptor evita enviar token expirado
- [ ] Agregar validaciones declarativas en contratos de entrada criticos
  - Criterio de cierre: DTO de registro validado en API

### Fase 2 — Preparacion CI/CD para despliegue

- [x] Definir estrategia de versionado de imagen backend (latest + sha) ✅
  - Criterio de cierre: tags claros y trazables → `latest` (solo en `main`) + `sha-<short>` (trazabilidad del commit)
- [x] Agregar job de package/deploy para main ✅ (parcial — fase build+push a GHCR)
  - Criterio de cierre: workflow listo para publicar imagen backend a GHCR (`.github/workflows/publish-backend-image.yml`)
  - Estado actual: incluye `az containerapp update` por digest en ACA; queda pendiente `staticwebapp deploy` al crear SWA
- [ ] Ajustar salida y rutas de artefactos frontend para SWA
  - Criterio de cierre: output_location validado en pipeline

### Fase 3 — Provision de Azure Container Apps

- [x] Crear Container Apps Environment
  - Criterio de cierre: entorno creado en el resource group correcto
- [x] Crear Container App portalcv-api
  - Criterio de cierre: ingress externo y puerto 8080 funcional
- [x] Configurar secretos y variables de entorno en Container App
  - Variables minimas esperadas:
    - ConnectionStrings__DefaultConnection
    - ASPNETCORE_ENVIRONMENT=Production
    - Jwt__Issuer
    - Jwt__Audience
    - Jwt__Key
    - Cors__AllowedOrigins__0
- [x] Publicar imagen backend en GHCR y desplegar en ACA
  - Criterio de cierre: API responde endpoints principales

### Fase 4 — Provision de Azure Static Web Apps

- [ ] Crear recurso portalcv-web conectado al repo (rama main)
  - Criterio de cierre: build/deploy inicial exitoso
- [ ] Validar configuracion SPA (navigation fallback)
  - Criterio de cierre: rutas directas como /auth/login no retornan 404
- [ ] Validar conectividad SWA -> ACA
  - Criterio de cierre: frontend consume /api sin errores CORS

### Fase 5 — Validacion de salida y go-live

- [ ] Smoke test funcional completo
  - Flujo minimo: login, dashboard, CV publico, contacto, alertas
- [ ] Verificar observabilidad operativa
  - Criterio de cierre: logs utiles en runtime cloud
- [ ] Definir rollback rapido
  - Criterio de cierre: version anterior identificada y procedimiento probado
- [ ] Corte de salida
  - Criterio de cierre: aprobacion final y despliegue en main

---

## Checklist operativo por recurso Azure

### Azure SQL Database (ya creado)

- [x] Recurso existente
- [x] Verificar conectividad desde ACA usando portalcv_app_prod
- [x] Verificar reglas de firewall necesarias para runtime
- [x] Verificar estado de esquema/scripts aplicados en produccion

### Azure Container Apps (operativo)

- [x] Crear env-portalcv
- [x] Crear portalcv-api
- [x] Configurar variables y secretos
- [x] Configurar escalado minimo/maximo
- [x] Probar endpoint base y endpoints de auth/public

### Azure Static Web Apps (pendiente)

- [ ] Crear portalcv-web
- [ ] Conectar repo y rama main
- [ ] Confirmar app_location y output_location
- [ ] Confirmar enrutamiento SPA
- [ ] Validar llamadas a API en dominio de produccion

### Corte actual (23-04-2026)

- Bloqueante actual: provisionar SWA y enlazar dominio real del frontend en `Cors__AllowedOrigins__0`.
- Verificacion final pendiente: smoke test E2E (frontend + backend) y rollback documentado/probado.

---

## Riesgos principales y mitigacion

- Riesgo: despliegue con secretos inseguros en repo
  - Mitigacion: limpiar launchSettings y usar secretos de entorno
- Riesgo: CI verde sin pruebas reales backend
  - Mitigacion: crear suite minima y ejecutar en pipeline
- Riesgo: falla de frontend en rutas directas en SWA
  - Mitigacion: navigation fallback validado antes de go-live
- Riesgo: CORS bloqueando consumo desde SWA
  - Mitigacion: configurar Cors__AllowedOrigins__0 con URL final del frontend

---

## Orden recomendado de ejecucion (secuencia corta)

1. Cerrar Fase 1
2. Cerrar Fase 2
3. Provisionar ACA (Fase 3)
4. Provisionar SWA (Fase 4)
5. Ejecutar Fase 5 y salir a produccion

---

## Criterio final de “Listo para produccion”

- Seguridad minima cerrada
- CI/CD reproducible para build, test y deploy
- ACA y SWA operativos y conectados
- Smoke test completo en entorno real
- Rollback definido
