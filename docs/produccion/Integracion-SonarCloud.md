# Integracion SonarCloud en GitHub Actions

Esta guia explica como activar analisis de calidad con SonarCloud en este repositorio.

---

## 1) Lo que ya está implementado

Workflow actualizado: [.github/workflows/ci.yml](../../.github/workflows/ci.yml)

Incluye:

- Ajuste de tests frontend en CI:
  - `npm run test -- --configuration=ci`
- Job nuevo `sonarcloud`:
  - Corre despues de `backend` y `frontend`
  - Ejecuta scan con `SonarSource/sonarqube-scan-action@v6`
  - Si faltan variables/secrets, no rompe el pipeline y deja mensaje de configuracion pendiente

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

1. Build backend
2. Build + tests frontend
3. Sonar scan

Nota: en la configuración actual no se usa un paso separado de `quality-gate-action`; el análisis se ejecuta en el paso de scan.

Recomendacion: proteger ramas `develop` y `main` para exigir CI en verde.

---

## 5) Recomendación de política inicial

Configurar quality gate en SonarCloud para controlar la calidad técnica en la rama principal:

- Nuevos bugs de severidad alta
- Nuevas vulnerabilidades altas
- Duplicacion elevada en codigo nuevo

Cobertura: iniciar con umbral moderado y subir gradualmente cuando exista suite de pruebas backend más amplia.

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
