# Plan de Trabajo para Salida a Produccion — PortalCV

Estado del plan: En ejecucion
Fecha de corte: 20-04-2026
Rama de trabajo actual: `feat/docs` (documentacion); operativo en `feat/frontend` y `feat/backend`

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
  - Proyecto de tests backend `PortalCV.Api.Tests` (xUnit + WebApplicationFactory + EF InMemory) ejecutandose en CI (job `backend`)
- Pendiente critico:
  - Provision de Azure Container Apps (seguir Runbook §3)
  - Provision de Azure Static Web Apps (seguir Runbook §4)
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
  - Pendiente: pasos `az containerapp update` y `az staticwebapp deploy` — se implementan cuando existan los recursos Azure (Fases 3 y 4)
- [ ] Ajustar salida y rutas de artefactos frontend para SWA
  - Criterio de cierre: output_location validado en pipeline

### Fase 3 — Provision de Azure Container Apps

- [ ] Crear Container Apps Environment
  - Criterio de cierre: entorno creado en el resource group correcto
- [ ] Crear Container App portalcv-api
  - Criterio de cierre: ingress externo y puerto 8080 funcional
- [ ] Configurar secretos y variables de entorno en Container App
  - Variables minimas esperadas:
    - ConnectionStrings__DefaultConnection
    - ASPNETCORE_ENVIRONMENT=Production
    - Jwt__Issuer
    - Jwt__Audience
    - Jwt__Key
    - Cors__AllowedOrigins__0
- [ ] Publicar imagen backend en GHCR y desplegar en ACA
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
- [ ] Verificar conectividad desde ACA usando portalcv_app_prod
- [ ] Verificar reglas de firewall necesarias para runtime
- [ ] Verificar estado de esquema/scripts aplicados en produccion

### Azure Container Apps (pendiente)

- [ ] Crear env-portalcv
- [ ] Crear portalcv-api
- [ ] Configurar variables y secretos
- [ ] Configurar escalado minimo/maximo
- [ ] Probar endpoint base y endpoints de auth/public

### Azure Static Web Apps (pendiente)

- [ ] Crear portalcv-web
- [ ] Conectar repo y rama main
- [ ] Confirmar app_location y output_location
- [ ] Confirmar enrutamiento SPA
- [ ] Validar llamadas a API en dominio de produccion

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
