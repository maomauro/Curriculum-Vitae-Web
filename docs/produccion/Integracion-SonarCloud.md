# Integracion SonarCloud en GitHub Actions

Esta guia explica como activar analisis de calidad con SonarCloud en este repositorio.

---

## 1) Lo que ya está implementado

Workflow actualizado: [.github/workflows/ci.yml](../../.github/workflows/ci.yml)

Incluye:

- **Tests backend en CI con cobertura**:
  - `dotnet test PortalCV.Api.Tests` (253 tests de integración, xUnit + WebApplicationFactory + EF InMemory) con `--collect:"XPlat Code Coverage"` en formato `opencover`.
  - El job `backend` sube el reporte como artifact `backend-coverage` y el `.trx` como `backend-test-results`.
- **Tests frontend en CI con cobertura**:
  - `npm run lint` + `npm run lint:pilots` (lint estricto por zonas) antes del build.
  - `npm run test -- --configuration=ci` ejecuta Karma en modo headless con `codeCoverage: true`.
  - `frontend/karma.conf.js` genera el reporte `lcov.info` bajo `frontend/coverage/portalcv-web/`.
  - El job `frontend` sube ese archivo como artifact `frontend-coverage` via `actions/upload-artifact@v4`.
- **Job `sonarcloud`**:
  - Corre despues de `backend` y `frontend` (`needs: [backend, frontend]`).
  - **Descarga** los artifacts `frontend-coverage` y `backend-coverage` con `actions/download-artifact@v4`.
  - Ejecuta `SonarSource/sonarqube-scan-action@v6` pasando:
    - `sonar.javascript.lcov.reportPaths=frontend/coverage/portalcv-web/lcov.info`
    - `sonar.cs.opencover.reportsPaths=backend/TestResults/**/coverage.opencover.xml`
    - `sonar.sources=backend,frontend`
    - `sonar.tests=frontend/src`
    - `sonar.test.inclusions=**/*.spec.ts`
    - `sonar.coverage.exclusions` excluye specs, `main.ts`, `environments/`, `*.module.ts`, `*.routes.ts`, `polyfills.ts`, `eslint.config.js`, `proxy.conf.js`, `styles/**`, y del lado backend `**/*.Tests/**` y `**/Program.cs`
  - Si faltan variables/secrets (`SONAR_TOKEN`, `SONAR_ORGANIZATION`, `SONAR_PROJECT_KEY`), no rompe el pipeline y deja un warning informativo.

---

## 2) Requisitos en SonarCloud

- Crear cuenta/organizacion en SonarCloud
- Importar este repositorio en SonarCloud
- Identificar:
  - Organization key
  - Project key
- Crear token de analisis (user token)

---

## 3) Configurar GitHub Secrets y Variables

En el repositorio GitHub:

Settings -> Secrets and variables -> Actions

### Secrets (Repository secrets)

- `SONAR_TOKEN`

### Variables (Repository variables)

- `SONAR_ORGANIZATION`
- `SONAR_PROJECT_KEY`

---

## 4) Orden en el pipeline (actual)

El flujo CI queda:

1. **Job `backend`**: build .NET Release + `dotnet test` sobre `PortalCV.Api.Tests` con cobertura → sube artifacts `backend-coverage` y `backend-test-results`.
2. **Job `frontend`**: lint + build Angular production + tests Karma en headless con cobertura → sube artifact `frontend-coverage`.
3. **Job `sonarcloud`**: descarga `frontend-coverage` y `backend-coverage` → Sonar scan (quality gate visible en dashboard).

Nota: en la configuración actual no se usa un paso separado de `quality-gate-action`; el análisis se ejecuta en el paso de scan y el resultado se consulta en el dashboard de SonarCloud.

Recomendacion: proteger ramas `develop` y `main` para exigir CI en verde.

---

## 5) Recomendación de política inicial

Configurar quality gate en SonarCloud para controlar la calidad técnica en la rama principal:

- Nuevos bugs de severidad alta
- Nuevas vulnerabilidades altas
- Duplicacion elevada en codigo nuevo

Cobertura: iniciar con umbral moderado y subir gradualmente — ya existe suite de pruebas backend (`PortalCV.Api.Tests`, 253 tests de integración) y frontend con cobertura, ambas reportadas a Sonar.

## 6) Alcance del plan gratuito

- En plan free, SonarCloud puede limitar análisis completo a la rama principal.
- El flujo recomendado es mantener CI obligatorio en `develop` y `main`, y usar SonarCloud como referencia principal en `main`.
- Aunque una rama auxiliar no se vea completa en SonarCloud, el merge debe seguir bloqueado por checks de GitHub Actions.

---

## 7) Jenkins vs GitHub Actions (decision practica)

Para este proyecto se recomienda mantener GitHub Actions y sumar SonarCloud.

Jenkins es valido, pero agrega carga operativa (servidor, plugins, mantenimiento, credenciales, backup).

Cuando migrar a Jenkins:

- Multi-repo grande
- Runners propios complejos
- Necesidad de pipelines muy personalizados fuera del ecosistema GitHub
