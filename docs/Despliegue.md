# 📦 GUÍA COMPLETA DE INTEGRACIÓN Y DESPLIEGUE CONTINUO (CI/CD)

## Escenario Profesional Empresarial

---

## 📋 Referencias

- **Documentación del producto:** [Documentacion.md](Documentacion.md)  
- **Modelo de datos:** [modelo.md](modelo.md)  
- **Backlog y sprints:** [Backlog.md](Backlog.md)  
- **Script BD SQL Server:** [../database/01_CreateSchema.sql](../database/01_CreateSchema.sql) y [../database/README.md](../database/README.md)

---

## 🎯 OBJETIVO DE ESTE DOCUMENTO

Recrear un **escenario profesional completo** de CI/CD como se trabaja en empresas reales, utilizando herramientas modernas y gratuitas, con el objetivo de **aprender el flujo completo** desde el commit hasta la producción.

---

## 📊 MAPA MENTAL DEL PIPELINE CI/CD

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         PIPELINE CI/CD COMPLETO                             │
│                     (Flujo profesional empresarial)                         │
└─────────────────────────────────────────────────────────────────────────────┘

                                    │
                                    ▼
┌───────────────────────────────────────────────────────────────────────────┐
│                            1. CÓDIGO FUENTE                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │
│  │   GitHub    │  │   GitLab    │  │  Bitbucket  │  │   Azure     │       │
│  │  (Principal)│  │  (Backup)   │  │  (Opcional) │  │   DevOps    │       │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘       │
└───────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                        2. GIT PUSH / PULL REQUEST                          │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  feature/nueva-funcionalidad → develop → main (producción)          │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                        3. CI/CD PIPELINE (AUTOMATIZACIÓN)                │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌───────────────────────────────────────────────────────────────────┐   │
│  │                        ETAPA 1: BUILD                             │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │   │
│  │  │ Compilar     │  │  Restaurar   │  │  Instalar    │             │   │
│  │  │ Backend .NET │  │  Paquetes    │  │ Dependencias │             │   │
│  │  │              │  │  NuGet       │  │ Frontend     │             │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘             │   │
│  └───────────────────────────────────────────────────────────────────┘   │
│                                    │                                     │
│  ┌───────────────────────────────────────────────────────────────────┐   │
│  │                        ETAPA 2: TEST                              │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │   │
│  │  │ Pruebas      │  │ Pruebas de   │  │ Análisis de  │             │   │
│  │  │ Unitarias    │  │ Integración  │  │ Calidad      │             │   │
│  │  │ (Backend)    │  │              │  │ (SonarQube)  │             │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘             │   │
│  │  ┌──────────────┐  ┌──────────────┐                               │   │
│  │  │ Pruebas      │  │ Pruebas de   │                               │   │
│  │  │ Frontend     │  │ Seguridad    │                               │   │
│  │  │ (Karma/Jest) │  │ (SAST/DAST)  │                               │   │
│  │  └──────────────┘  └──────────────┘                               │   │
│  └───────────────────────────────────────────────────────────────────┘   │
│                                    │                                     │
│  ┌───────────────────────────────────────────────────────────────────┐   │
│  │                        ETAPA 3: PACKAGE                           │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │   │
│  │  │ Crear        │  │ Construir    │  │ Taggear      │             │   │
│  │  │ Artefactos   │  │ Imágenes     │  │ Versión      │             │   │
│  │  │              │  │ Docker       │  │ (v1.0.0)     │             │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘             │   │
│  └───────────────────────────────────────────────────────────────────┘   │
│                                    │                                     │
│  ┌───────────────────────────────────────────────────────────────────┐   │
│  │                        ETAPA 4: PUBLISH                           │   │
│  │  ┌────────────────────────────────────────────────────────────┐   │   │
│  │  │                    REGISTRO DE CONTENEDORES                │   │   │
│  │  │  ┌────────────┐  ┌─────────────┐  ┌────────────┐           │   │   │
│  │  │  │Docker Hub  │  │   Azure     │  │   Amazon   │           │   │   │
│  │  │  │            │  │Container Reg│  │   ECR      │           │   │   │
│  │  │  └────────────┘  └─────────────┘  └────────────┘           │   │   │
│  │  └────────────────────────────────────────────────────────────┘   │   │
│  └───────────────────────────────────────────────────────────────────┘   │
│                                    │                                     │
│  ┌───────────────────────────────────────────────────────────────────┐   │
│  │                        ETAPA 5: DEPLOY                            │   │
│  │  ┌───────────────────────────────────────────────────────────┐    │   │
│  │  │                    ENTORNOS                               │    │   │
│  │  │  ┌────────────┐  ┌────────────┐  ┌────────────┐           │    │   │
│  │  │  │ Desarrollo │  │   Staging  │  │ Producción │           │    │   │
│  │  │  │ (dev)      │  │   (test)   │  │  (prod)    │           │    │   │
│  │  │  └────────────┘  └────────────┘  └────────────┘           │    │   │
│  │  └───────────────────────────────────────────────────────────┘    │   │
│  │                                                                   │   │
│  │  ┌────────────────────────────────────────────────────────────┐   │   │
│  │  │                    PLATAFORMAS DE DESPLIEGUE               │   │   │
│  │  │  ┌────────────┐  ┌────────────┐  ┌────────────┐            │   │   │
│  │  │  │Azure AKS   │  │   AWS EKS  │  │   Google   │            │   │   │
│  │  │  │(Kubernetes)│  │(Kubernetes)│  │    GKE     │            │   │   │
│  │  │  └────────────┘  └────────────┘  └────────────┘            │   │   │
│  │  │  ┌────────────┐  ┌────────────┐                            │   │   │
│  │  │  │Azure App   │  │   Azure    │                            │   │   │
│  │  │  │  Service   │  │   SQL DB   │                            │   │   │
│  │  │  └────────────┘  └────────────┘                            │   │   │
│  │  └────────────────────────────────────────────────────────────┘   │   │
│  └───────────────────────────────────────────────────────────────────┘   │
│                                    │                                     │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │                        ETAPA 6: MONITOREO                          │  │
│  │  ┌────────────┐  ┌────────────┐  ┌─────────────┐  ┌─────────────┐  │  │
│  │  │Application │  │   Azure    │  │   Grafana   │  │   Logs      │  │  │
│  │  │ Insights   │  │  Monitor   │  │ + Prometheus│  │Centralizados│  │  │
│  │  └────────────┘  └────────────┘  └─────────────┘  └─────────────┘  │  │
│  └────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 🧰 HERRAMIENTAS PROFESIONALES POR CATEGORÍA

### 1. CONTROL DE VERSIONES (Repositorios)

| Herramienta | Uso Profesional | Plan Gratuito | Por qué usarla |
|-------------|-----------------|---------------|----------------|
| **GitHub** | Principal (más popular) | ✅ Repos públicos ilimitados<br>✅ Repos privados con hasta 3 colaboradores<br>✅ GitHub Actions (2000 min/mes) | Comunidad más grande, integraciones, Actions potente |
| **GitLab** | Alternativa/Backup | ✅ Repos ilimitados públicos/privados<br>✅ CI/CD incluido (400 min/mes)<br>✅ Todo en uno | CI/CD integrado nativamente, mejor para autogestionado |
| **Azure DevOps** | Empresas Microsoft | ✅ 5 usuarios gratis<br>✅ Repos ilimitados<br>✅ Pipelines (1800 min/mes) | Perfecto para stack .NET, integración con Azure |
| **Bitbucket** | Equipos pequeños | ✅ Hasta 5 usuarios gratis<br>✅ Pipelines (50 min/mes) | Integración con Jira |

**📌 RECOMENDACIÓN PROFESIONAL:** 
- Usa **GitHub** como principal (es el estándar de la industria)
- Configura **GitLab** como mirror/backup (aprendes dos plataformas)
- Usa **Azure DevOps** si tu stack es 100% Microsoft

---

### 2. CI/CD (Automatización)

| Herramienta | Tipo | Gratuito | Características |
|-------------|------|----------|-----------------|
| **GitHub Actions** | Integrado en GitHub | 2000 min/mes | YAML, ecosistema enorme, marketplace |
| **GitLab CI/CD** | Integrado en GitLab | 400 min/mes | YAML, todo en uno, mejor para autogestionado |
| **Azure Pipelines** | Independiente | 1800 min/mes | 10 jobs paralelos, muy potente |
| **Jenkins** | Self-hosted | ✅ Completamente gratis | Altamente configurable, requiere mantenimiento |
| **CircleCI** | Cloud | 2500 min/mes | Muy popular, fácil de usar |

**📌 RECOMENDACIÓN PROFESIONAL:**
- **GitHub Actions** para empezar (ya tienes el código ahí)
- **Jenkins** para aprender (es el estándar en empresas grandes con infraestructura propia)

---

### 3. REGISTRO DE CONTENEDORES (Container Registry)

| Herramienta | Gratuito | Límites | Uso |
|-------------|----------|---------|-----|
| **Docker Hub** | ✅ Sí | 1 repositorio privado gratis<br>Pull ilimitado público | Estándar de la industria |
| **GitHub Container Registry** | ✅ Sí | Incluido con GitHub | Integrado con GitHub Packages |
| **Azure Container Registry** | ✅ Sí (Básico) | 10 GB almacenamiento gratis | Para desplegar en Azure |
| **Amazon ECR** | ⚠️ Limitado | 500 MB/mes gratis | Solo para AWS |

**📌 RECOMENDACIÓN PROFESIONAL:**
- Usa **Docker Hub** + **GitHub Container Registry** en paralelo
- Aprende ambos: Docker Hub es estándar, GHCR está creciendo

---

### 4. NUBE GRATUITA PARA DESPLIEGUE

#### Opción 1: Microsoft Azure (RECOMENDADA PARA .NET)

| Servicio | Gratuito | Límites | Para qué |
|----------|----------|---------|----------|
| **Azure Free Account** | $200 crédito por 30 días | - | Probar servicios pagos |
| **Azure App Service** | ✅ Siempre gratis | 10 apps web, 1 GB almacenamiento | Frontend + Backend |
| **Azure SQL Database** | ✅ Siempre gratis | 250 GB, 1 DB | Base de datos SQL Server |
| **Azure Container Instances** | ✅ Siempre gratis | Cierto límite | Ejecutar contenedores |
| **Azure Kubernetes Service (AKS)** | ✅ Siempre gratis | Cluster gratis (pago solo por nodos) | Orquestación |
| **Azure DevOps** | ✅ Siempre gratis | 5 usuarios, pipelines incluidos | CI/CD |

#### Opción 2: Amazon Web Services (AWS)

| Servicio | Gratuito | Límites |
|----------|----------|---------|
| **AWS Free Tier** | 12 meses | 750 horas/mes de EC2, 5 GB S3 |
| **Amazon RDS** | 12 meses | 750 horas/mes, 20 GB |
| **Amazon ECR** | 12 meses | 500 MB/mes |

#### Opción 3: Google Cloud Platform (GCP)

| Servicio | Gratuito | Límites |
|----------|----------|---------|
| **GCP Free Tier** | $300 crédito por 90 días | - |
| **Cloud SQL** | ✅ Siempre gratis | 1 instancia, 10 GB |

**📌 RECOMENDACIÓN PROFESIONAL:**
- **Azure** para stack .NET (integración perfecta)
- Usa los **$200 crédito** para aprovisionar AKS y SQL Database
- Después de los créditos, usa los servicios "siempre gratis"

---

### 5. ORQUESTACIÓN DE CONTENEDORES

| Herramienta | Gratuito | Dónde | Descripción |
|-------------|----------|-------|-------------|
| **Azure Kubernetes Service (AKS)** | ✅ Cluster gratis | Azure | Kubernetes gestionado, pago solo por nodos |
| **Minikube** | ✅ Completamente gratis | Local | Kubernetes local para desarrollo |
| **Kind** | ✅ Completamente gratis | Local | Kubernetes en Docker |
| **K3s** | ✅ Completamente gratis | Local/Edge | Kubernetes liviano |

**📌 RECOMENDACIÓN PROFESIONAL:**
- **Minikube** para desarrollo local
- **AKS** para producción (usando créditos Azure)
- Aprende Kubernetes: es el estándar en la industria

---

### 6. BASE DE DATOS EN LA NUBE

| Opción | Gratuito | Tipo | Conexión |
|--------|----------|------|----------|
| **Azure SQL Database** | ✅ Siempre gratis | SQL Server | Cadena de conexión estándar |
| **Amazon RDS** | 12 meses | SQL Server/PostgreSQL/MySQL | VPC/complejo |
| **ElephantSQL** | ✅ Siempre gratis | PostgreSQL (20 MB) | Muy simple para empezar |
| **MongoDB Atlas** | ✅ Siempre gratis | MongoDB (512 MB) | NoSQL |

**📌 RECOMENDACIÓN PROFESIONAL:**
- **Azure SQL Database** (siempre gratis) + **Azure Data Studio** para administrar
- Aprende a configurar firewall y conexiones seguras

---

### 7. PRUEBAS Y CALIDAD DE CÓDIGO

| Herramienta | Gratuito | Tipo | Descripción |
|-------------|----------|------|-------------|
| **SonarQube** | ✅ Sí (Community) | Análisis estático | Calidad de código, bugs, vulnerabilidades |
| **SonarCloud** | ✅ Sí (público) | Análisis estático | Versión cloud, integración con GitHub |
| **Snyk** | ✅ Sí (limitado) | Seguridad | Encuentra vulnerabilidades en dependencias |
| **OWASP ZAP** | ✅ Completamente gratis | Seguridad | Pruebas de penetración |
| **Jest / Karma** | ✅ Gratis | Testing frontend | Pruebas unitarias Angular |
| **xUnit / NUnit** | ✅ Gratis | Testing backend | Pruebas unitarias .NET |
| **Postman / Insomnia** | ✅ Gratis | Testing APIs | Pruebas manuales y automatizadas |

**📌 RECOMENDACIÓN PROFESIONAL:**
- **SonarQube** auto-hosteado o **SonarCloud** en la nube
- **Snyk** para dependencias
- Automatizar en el pipeline

---

### 8. MONITOREO Y OBSERVABILIDAD

| Herramienta | Gratuito | Descripción |
|-------------|----------|-------------|
| **Azure Application Insights** | 5 GB/mes gratis | APM, métricas, logs |
| **Prometheus** | ✅ Completamente gratis | Métricas, alertas (self-hosted) |
| **Grafana** | ✅ Completamente gratis | Dashboards (self-hosted) |
| **ELK Stack** (Elasticsearch) | ✅ Gratis | Logs centralizados |
| **New Relic** | 100 GB/mes gratis | APM, infraestructura |

**📌 RECOMENDACIÓN PROFESIONAL:**
- **Azure Application Insights** (si estás en Azure)
- **Prometheus + Grafana** (estándar en Kubernetes)

---

## 🔄 FLUJO COMPLETO DE TRABAJO PROFESIONAL

### Escenario: Desarrollo de una nueva funcionalidad

```
DÍA 1: DESARROLLADOR
┌─────────────────────────────────────────────────────────────────┐
│ 1. git checkout -b feature/nueva-funcionalidad                  │
│ 2. Código, código, código...                                    │
│ 3. Pruebas locales: docker-compose up                           │
│ 4. git commit -m "feat: agregar nueva funcionalidad"            │
│ 5. git push origin feature/nueva-funcionalidad                  │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│ PIPELINE CI (Continous Integration) - AUTOMÁTICO                │
│                                                                 │
│ GITHUB ACTIONS / GITLAB CI                                      │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ ETAPA 1: BUILD                                              │ │
│ │ • Backend: dotnet restore → dotnet build                    │ │
│ │ • Frontend: npm install → npm run build                     │ │
│ └─────────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ ETAPA 2: TEST                                               │ │
│ │ • Backend: dotnet test /coverage                            │ │
│ │ • Frontend: npm run test                                    │ │
│ │ • Calidad: SonarQube analysis                               │ │
│ │ • Seguridad: Snyk check                                     │ │
│ └─────────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ ETAPA 3: PACKAGE                                            │ │
│ │ • docker build -t backend:feature-123                       │ │
│ │ • docker build -t frontend:feature-123                      │ │
│ │ • docker push a registro (Docker Hub/GHCR)                  │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│ PULL REQUEST CREADO                                             │
│                                                                 │
│ Título: "feat: nueva funcionalidad"                             │
│ Asignado a: Tech Lead                                           │
│ Labels: enhancement, ready-for-review                           │
│ Pipeline: ✅ Passed                                             │
│ Coverage: 85% (+2%)                                             │
│ SonarQube: ✅ No issues                                         │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│ REVISIÓN DE CÓDIGO (Code Review)                                │
│                                                                 │
│ Tech Lead:                                                      │
│ • Revisa código                                                 │
│ • Comentarios: "Mejor si usas async/await aquí"                 │
│ • Aprueba cambios                                               │
│                                                                 │
│ Desarrollador:                                                  │
│ • Ajusta según comentarios                                      │
│ • git push nuevamente (pipeline se ejecuta otra vez)            │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│ MERGE A DEVELOP (Integración)                                   │
│                                                                 │
│ git checkout develop                                            │
│ git merge feature/nueva-funcionalidad                           │
│ git push origin develop                                         │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│ PIPELINE CD (Continous Deployment) - AUTOMÁTICO A STAGING       │
│                                                                 │
│ GITLAB CI / GITHUB ACTIONS                                      │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ ETAPA 4: DEPLOY A STAGING                                   │ │
│ │ • Desplegar backend a Azure App Service (staging)           │ │
│ │ • Desplegar frontend a Azure Static Web App (staging)       │ │
│ │ • Aplicar esquema de BD (script SQL o migraciones EF)       │ │
│ │ • Smoke tests                                               │ │
│ │ • Pruebas de integración                                    │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│ PRUEBAS EN STAGING                                              │
│                                                                 │
│ QA Team:                                                        │
│ • Pruebas funcionales                                           │
│ • Pruebas de regresión                                          │
│ • Pruebas de carga (opcional)                                   │
│ • Reporte: ✅ Todo OK                                           │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│ MERGE A MAIN (Producción)                                       │
│                                                                 │
│ git checkout main                                               │
│ git merge develop                                               │
│ git tag -a v1.2.0 -m "Release v1.2.0"                           │
│ git push origin main --tags                                     │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│ PIPELINE CD A PRODUCCIÓN                                        │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ ETAPA 5: DEPLOY A PRODUCCIÓN                                │ │
│ │ • Desplegar backend a AKS (Kubernetes)                      │ │
│ │ • Desplegar frontend a CDN                                  │ │
│ │ • Aplicar esquema de BD (script/migraciones) con respaldo   │ │
│ │ • Health checks                                             │ │
│ │ • Canary deployment (10% tráfico)                           │ │
│ │ • 100% rollout si todo OK                                   │ │
│ └─────────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ ETAPA 6: MONITOREO                                          │ │
│ │ • Application Insights: todo OK                             │ │
│ │ • Azure Monitor: alertas configuradas                       │ │
│ │ • Grafana: dashboards actualizados                          │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ CONFIGURACIÓN PRÁCTICA PASO A PASO

### PASO 1: GitHub + GitHub Actions

El workflow asume estructura del repo con `backend/` y `frontend/` en la raíz. Los jobs **sonarqube** y **Upload coverage** (Codecov) son opcionales: configurar `SONAR_TOKEN` y `CODECOV_TOKEN` en secrets si se usan; si no, se pueden comentar o usar `continue-on-error: true` para no bloquear el pipeline.

**.github/workflows/ci.yml**
```yaml
name: CI Pipeline

on:
  push:
    branches: [ develop, main ]
  pull_request:
    branches: [ develop, main ]

jobs:
  build-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup .NET
        uses: actions/setup-dotnet@v3
        with:
          dotnet-version: '8.0.x'
      
      - name: Restore dependencies
        run: dotnet restore ./backend
        
      - name: Build
        run: dotnet build ./backend --no-restore
        
      - name: Test
        run: dotnet test ./backend --no-build --verbosity normal --collect:"XPlat Code Coverage"
        
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  build-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20.x'
          
      - name: Install dependencies
        run: npm ci --prefix ./frontend
        
      - name: Build
        run: npm run build --prefix ./frontend
        
      - name: Test
        run: npm test --prefix ./frontend -- --watch=false --browsers=ChromeHeadless

  sonarqube:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: SonarQube Scan
        uses: SonarSource/sonarcloud-github-action@master
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}

  docker-build:
    needs: [build-backend, build-frontend]
    runs-on: ubuntu-latest
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      
      - name: Login to Docker Hub
        uses: docker/login-action@v2
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_TOKEN }}
          
      - name: Build and push Backend
        uses: docker/build-push-action@v4
        with:
          context: ./backend
          push: true
          tags: |
            ${{ secrets.DOCKER_USERNAME }}/portalcv-backend:latest
            ${{ secrets.DOCKER_USERNAME }}/portalcv-backend:${{ github.sha }}
            
      - name: Build and push Frontend
        uses: docker/build-push-action@v4
        with:
          context: ./frontend
          push: true
          tags: |
            ${{ secrets.DOCKER_USERNAME }}/portalcv-frontend:latest
            ${{ secrets.DOCKER_USERNAME }}/portalcv-frontend:${{ github.sha }}
```

---

### PASO 2: Docker Compose Local (desarrollo)

**Estructura esperada del repo:** raíz con carpetas `backend/` (.NET) y `frontend/` (Angular). La base de datos **PortalCV** debe existir antes de que el backend arranque: créala en el contenedor SQL Server y ejecuta el script `database/01_CreateSchema.sql` (o descomenta el bloque `CREATE DATABASE` en ese script y ejecútalo una vez).

**docker-compose.yml**
```yaml
version: '3.8'

services:
  # Base de datos SQL Server
  sqlserver:
    image: mcr.microsoft.com/mssql/server:2022-latest
    container_name: portalcv-sqlserver
    environment:
      ACCEPT_EULA: Y
      SA_PASSWORD: "YourStrong!Password123"
      MSSQL_PID: Express
    ports:
      - "1433:1433"
    volumes:
      - sqlserver_data:/var/opt/mssql
    networks:
      - portalcv-network

  # Backend API
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: portalcv-backend
    environment:
      - ConnectionStrings__DefaultConnection=Server=sqlserver;Database=PortalCV;User Id=sa;Password=YourStrong!Password123;TrustServerCertificate=True
      - ASPNETCORE_ENVIRONMENT=Development
    ports:
      - "5000:8080"
    depends_on:
      - sqlserver
    networks:
      - portalcv-network
    volumes:
      - ./backend:/app
      - ~/.nuget/packages:/root/.nuget/packages

  # Frontend Angular
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: portalcv-frontend
    ports:
      - "4200:80"
    depends_on:
      - backend
    networks:
      - portalcv-network
    volumes:
      - ./frontend:/app
      - /app/node_modules

  # Opcional: cliente para administrar SQL Server (Azure Data Studio u otra imagen)
  # azure-data-studio:
  #   image: mcr.microsoft.com/mssql/server:2022-latest  # o usar Azure Data Studio en host
  #   ...

networks:
  portalcv-network:
    driver: bridge

volumes:
  sqlserver_data:
```

---

### PASO 3: Despliegue en Azure AKS

**azure-aks-deploy.yml** (para GitHub Actions)
```yaml
name: Deploy to AKS

on:
  push:
    tags:
      - 'v*'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Azure Login
        uses: azure/login@v1
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}
          
      - name: Set AKS Context
        uses: azure/aks-set-context@v3
        with:
          resource-group: ${{ secrets.AZURE_RESOURCE_GROUP }}
          cluster-name: ${{ secrets.AKS_CLUSTER_NAME }}
          
      - name: Deploy to Kubernetes
        run: |
          # Actualizar imágenes en los YAML
          sed -i "s|BACKEND_IMAGE|${{ secrets.DOCKER_USERNAME }}/portalcv-backend:${{ github.sha }}|g" k8s/backend-deployment.yaml
          sed -i "s|FRONTEND_IMAGE|${{ secrets.DOCKER_USERNAME }}/portalcv-frontend:${{ github.sha }}|g" k8s/frontend-deployment.yaml
          
          # Aplicar configuraciones
          kubectl apply -f k8s/namespace.yaml
          kubectl apply -f k8s/secrets.yaml
          kubectl apply -f k8s/configmap.yaml
          kubectl apply -f k8s/backend-deployment.yaml
          kubectl apply -f k8s/backend-service.yaml
          kubectl apply -f k8s/frontend-deployment.yaml
          kubectl apply -f k8s/frontend-service.yaml
          kubectl apply -f k8s/ingress.yaml
          
      - name: Verify Deployment
        run: |
          kubectl rollout status deployment/backend -n portalcv
          kubectl rollout status deployment/frontend -n portalcv
          
      - name: Smoke Tests
        run: |
          # Obtener IP del Ingress
          INGRESS_IP=$(kubectl get ingress portalcv-ingress -n portalcv -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
          curl -f http://$INGRESS_IP/api/health || exit 1
```

---

### PASO 4: Kubernetes Manifests

**k8s/backend-deployment.yaml**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
  namespace: portalcv
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
    spec:
      containers:
      - name: backend
        image: BACKEND_IMAGE  # Reemplazado por CI/CD
        ports:
        - containerPort: 8080
        env:
        - name: ConnectionStrings__DefaultConnection
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: connection-string
        - name: ASPNETCORE_ENVIRONMENT
          value: "Production"
        livenessProbe:
          httpGet:
            path: /api/health
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/ready
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 5
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
```

---

## 🎓 APRENDIZAJE PROGRESIVO (Roadmap de Estudio)

### Fase 1: Fundamentos (Semanas 1-2)
- [ ] Git avanzado (ramas, merge, rebase, tags)
- [ ] GitHub (repos, issues, pull requests)
- [ ] Docker básico (images, containers, docker-compose)
- [ ] Conceptos de CI/CD

### Fase 2: CI Básico (Semanas 3-4)
- [ ] GitHub Actions: workflows básicos
- [ ] Build y test automáticos
- [ ] Integración con SonarCloud
- [ ] Artefactos y caché

### Fase 3: Contenedores y Registros (Semanas 5-6)
- [ ] Docker avanzado (multi-stage builds)
- [ ] Docker Hub vs GitHub Container Registry
- [ ] Seguridad en imágenes
- [ ] Tags semánticos (v1.0.0)

### Fase 4: Despliegue en Nube (Semanas 7-8)
- [ ] Azure Free Account
- [ ] Azure App Service (PaaS)
- [ ] Azure SQL Database
- [ ] Conexiones seguras

### Fase 5: Kubernetes (Semanas 9-10)
- [ ] Minikube local
- [ ] Pods, Deployments, Services
- [ ] ConfigMaps y Secrets
- [ ] Health checks (liveness/readiness)

### Fase 6: CD Completo (Semanas 11-12)
- [ ] AKS cluster en Azure
- [ ] Despliegue automático a staging
- [ ] Estrategias: Rolling update, Blue/Green
- [ ] Rollback automático

### Fase 7: Monitoreo (Semanas 13-14)
- [ ] Application Insights
- [ ] Prometheus + Grafana
- [ ] Centralized logging (ELK)
- [ ] Alertas

---

## ✅ CHECKLIST DE HERRAMIENTAS A INSTALAR

```
📦 HERRAMIENTAS LOCALES
□ Git
□ Docker Desktop
□ VS Code + extensiones (GitHub, Docker, Kubernetes)
□ .NET SDK 8.0
□ Node.js 20.x + Angular CLI
□ Azure CLI
□ kubectl
□ Helm (opcional)
□ Postman / Insomnia
□ Azure Data Studio o SSMS (para administrar SQL Server)
```

---

## 🔐 SECRETS Y VARIABLES A CONFIGURAR

| Entorno | Secret / Variable | Uso |
|---------|-------------------|-----|
| **GitHub Actions** | `DOCKER_USERNAME` | Usuario Docker Hub (o GHCR) |
| **GitHub Actions** | `DOCKER_TOKEN` | Token de acceso para push de imágenes |
| **GitHub Actions** | `CODECOV_TOKEN` | Opcional; para subir cobertura (Codecov) |
| **GitHub Actions** | `SONAR_TOKEN` | Opcional; para SonarCloud |
| **Deploy AKS** | `AZURE_CREDENTIALS` | JSON con service principal de Azure |
| **Deploy AKS** | `AZURE_RESOURCE_GROUP` | Nombre del resource group |
| **Deploy AKS** | `AKS_CLUSTER_NAME` | Nombre del cluster AKS |
| **K8s** | `db-secret` (connection-string) | Cadena de conexión a SQL Server (producción) |

---

## 💡 SUGERENCIAS Y MEJORAS OPCIONALES

| Sugerencia | Descripción |
|------------|-------------|
| **Crear BD en primer arranque** | Añadir un servicio init en docker-compose que ejecute `database/01_CreateSchema.sql` contra SQL Server al levantar por primera vez (por ejemplo con `sqlcmd` o script que espere al puerto 1433 y ejecute el script). |
| **GitLab CI** | Si usas GitLab en lugar de GitHub, el Backlog referencia ambos; usa `.gitlab-ci.yml` con etapas equivalentes (build, test, docker build/push, deploy). Ver plantillas en GitLab. |
| **Redis para caché** | Documentacion.md menciona Redis para el módulo público; en producción añade un contenedor Redis y variable `Redis__ConnectionString` en backend. |
| **Health/Ready en backend** | Asegura que el backend exponga `/api/health` (liveness) y `/api/ready` (readiness, opcionalmente comprobando conexión a BD); los manifiestos K8s ya los referencian. |
| **Versiones de acciones** | Considera fijar versiones de GitHub Actions (ej. `actions/checkout@v4`) y actualizar periódicamente; `@v3` sigue siendo válido. |
| **SonarCloud opcional** | El job `sonarqube` puede fallar si no configuras `SONAR_TOKEN`; márcalo opcional con `continue-on-error: true` o condicional para no bloquear el pipeline. |
| **Codecov opcional** | El paso "Upload coverage" requiere `CODECOV_TOKEN` si el repo es privado; en público a veces basta con `GITHUB_TOKEN`. Si falla, desactivar o añadir el token. |