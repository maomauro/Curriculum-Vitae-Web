# Integracion SonarCloud en GitHub Actions

Esta guia explica como activar analisis de calidad con SonarCloud en este repositorio.

---

## 1) Lo que ya quedo implementado

Workflow actualizado: [.github/workflows/ci.yml](../../.github/workflows/ci.yml)

Incluye:

- Ajuste de tests frontend en CI:
  - `npm run test -- --configuration=ci`
- Job nuevo `sonarcloud`:
  - Corre despues de `backend` y `frontend`
  - Ejecuta scan y quality gate
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

## 4) Orden en el pipeline

El flujo CI queda:

1. Build backend
2. Build + tests frontend
3. Sonar scan
4. Quality gate

Recomendacion: proteger ramas `develop` y `main` para exigir CI en verde.

---

## 5) Recomendacion de politica inicial

Configurar quality gate para bloquear PR si hay:

- Nuevos bugs de severidad alta
- Nuevas vulnerabilidades altas
- Duplicacion elevada en codigo nuevo

Cobertura: iniciar con umbral moderado y subir gradualmente cuando exista suite de pruebas backend mas amplia.

---

## 6) Jenkins vs GitHub Actions (decision practica)

Para este proyecto se recomienda mantener GitHub Actions y sumar SonarCloud.

Jenkins es valido, pero agrega carga operativa (servidor, plugins, mantenimiento, credenciales, backup).

Cuando migrar a Jenkins:

- Multi-repo grande
- Runners propios complejos
- Necesidad de pipelines muy personalizados fuera del ecosistema GitHub
