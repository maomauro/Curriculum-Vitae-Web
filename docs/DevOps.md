## 📐 Arquitectura DevOps Completa para tu Proyecto

Te voy a presentar una visión consolidada, profesional y lista para implementar, con diagramas claros y la justificación técnica de cada elección.

---

## 1. MAPA DE HERRAMIENTAS POR ETAPA DE DevOps

### Ciclo de Vida DevOps Completo

```
┌───────────────────────────────────────────────────────────────────────────────────────┐
│                              CICLO DE VIDA DEVOPS                                     │
├───────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                       │
│  ┌──────────┐      ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐       │
│  │ PLAN     │ ───> | CODE     │───>│ BUILD    │───>│ TEST     │───>│ RELEASE  │       │
│  └──────────┘      └──────────┘    └──────────┘    └──────────┘    └──────────┘       │
│        │                │               │               │               │             │
│        ▼                ▼               ▼               ▼               ▼             │
│  Azure DevOps     GitHub          Azure DevOps      SonarCloud      Azure Pipelines   │
│     Boards        (Repos)         Pipelines         xUnit/NUnit         (CD)          │
│                   (Código)        (CI)              Cypress/         (Release)        │
│                                   (Build)           Playwright                        │
│                                                                                       │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐                                         │
│  │ DEPLOY   │───>│ OPERATE  │───>│ MONITOR  │                                         │
│  └──────────┘    └──────────┘    └──────────┘                                         │
│       │              │               │                                                │
│       ▼              ▼               ▼                                                │
│  Azure App     Application      Azure Monitor                                         │
│   Service      Insights         Log Analytics                                         │
│  Static Web    (Rendimiento)    (Alertas)                                             │
│   Apps         (Errores)                                                              │
│  Azure SQL                                                                            │
│  Database                                                                             │
│                                                                                       │
└───────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. TABLA CONSOLIDADA: HERRAMIENTAS POR ETAPA

| Etapa DevOps | Herramienta | Versión | Funcionalidad Específica | Costo |
|--------------|-------------|---------|--------------------------|-------|
| **📋 PLAN** | Azure DevOps Boards | Cloud Free | Gestión de Épicas, Features, Historias, Sprints, Backlog | ✅ Gratis |
| | Azure DevOps Wiki | Cloud Free | Documentación técnica, guías, decisiones arquitectónicas | ✅ Gratis |
| | Azure DevOps Test Plans | Cloud Free | Casos de prueba manuales, suites de prueba por historia | ✅ Gratis |
| **💻 CODE** | GitHub | Free | Repositorio de código fuente, control de versiones Git | ✅ Gratis |
| | VS Code / Visual Studio | Community | IDE de desarrollo, integración con Git y Azure DevOps | ✅ Gratis |
| | Git | Latest | Control de versiones local | ✅ Gratis |
| **🔨 BUILD (CI)** | Azure Pipelines | Cloud Free | Compilación .NET, empaquetado Angular, publicación artefactos | ✅ Gratis |
| | Node.js/NPM | Latest | Gestión de dependencias Angular | ✅ Gratis |
| | .NET SDK | Latest | Compilación y empaquetado backend | ✅ Gratis |
| **🧪 TEST** | SonarCloud | Free Tier | Análisis estático, calidad código, cobertura, seguridad | ✅ Gratis |
| | xUnit / NUnit | Latest | Pruebas unitarias .NET | ✅ Gratis |
| | Jest / Karma | Latest | Pruebas unitarias Angular | ✅ Gratis |
| | Cypress / Playwright | Open Source | Pruebas E2E (flujos completos) | ✅ Gratis |
| | Postman / Newman | Free | Pruebas de API automatizadas | ✅ Gratis |
| **📦 RELEASE (CD)** | Azure Pipelines | Cloud Free | Despliegue multi-ambiente, gates de aprobación | ✅ Gratis |
| | Azure Artifacts | 2 GiB Free | Almacenamiento de paquetes de despliegue | ✅ Gratis |
| **🚀 DEPLOY** | Azure App Service | F1 (Free) | Hosting API .NET (CPU 60min/día, 1GB RAM) | ✅ Gratis |
| | Azure Static Web Apps | Free | Hosting Angular SPA, CDN global, SSL gratis | ✅ Gratis |
| | Azure SQL Database | DTU Basic (Free) | Base de datos relacional (32GB max, 5 DTU) | ✅ Gratis |
| | Azure Blob Storage | Free Tier | Almacenamiento de archivos (5GB) | ✅ Gratis |
| **👁️ OPERATE** | Application Insights | Free Tier | Monitoreo rendimiento, errores, métricas personalizadas | ✅ Gratis |
| | Azure Monitor | Free | Alertas básicas, logs de actividad, dashboard | ✅ Gratis |
| | Log Analytics | Free (5GB/mes) | Consultas de logs, análisis de errores | ✅ Gratis |
| **🔄 CI/CD** | GitHub Actions | Free (2000 min/mes) | Alternativa complementaria para triggers | ✅ Gratis |

---

## 3. ARQUITECTURA DE INFRAESTRUCTURA EN AZURE

### 3.1 Estructura de Resource Groups

```
📦 AZURE SUBSCRIPTION (Free Tier)
│
├───📁 Resource Group: RG-CV-PORTAL-PROD
│    │   📍 Ubicación: East US 2 (o la más cercana a ti)
│    │   🎯 Propósito: Todos los recursos de PRODUCCIÓN
│    │
│    ├── 🖥️ App Service: app-cv-api-prod (F1 Free)
│    │   ├── Runtime: .NET 8
│    │   ├── HTTPS Only: Enabled
│    │   ├── Always On: Disabled (Free tier limit)
│    │   └── Health Check: /health (endpoint propio)
│    │
│    ├── 🌐 Static Web App: static-cv-frontend-prod (Free)
│    │   ├── Runtime: Angular 17
│    │   ├── Custom Domain: opcional
│    │   ├── SSL: Automático
│    │   └── CDN: Integrado
│    │
│    ├── 🗄️ SQL Server: sql-cv-prod.database.windows.net
│    │   ├── Admin Login: cvadmin
│    │   ├── Firewall Rules: Azure Services ON
│    │   └── Connection Policy: Proxy
│    │       │
│    │       └── 📀 Database: db-cv-prod (Basic DTU - Free)
│    │           ├── Max Size: 2GB
│    │           ├── DTUs: 5
│    │           └── Backup Retention: 7 días
│    │
│    └── 📦 Storage Account: stcvprodfiles (LRS - Free)
│        ├── Blob Containers:
│        │   ├── cv-files (documentos adjuntos)
│        │   └── temp-uploads (temporales)
│        └── Static Website: Disabled
│
├───📁 Resource Group: RG-CV-PORTAL-TEST
│    │   📍 Ubicación: East US 2
│    │   🎯 Propósito: Todos los recursos de PRUEBAS
│    │
│    ├── 🖥️ App Service: app-cv-api-test (F1 Free)
│    ├── 🌐 Static Web App: static-cv-frontend-test (Free)
│    ├── 🗄️ SQL Server: sql-cv-test.database.windows.net
│    │   └── 📀 Database: db-cv-test (Basic DTU - Free)
│    └── 📦 Storage Account: stcvtestfiles (LRS - Free)
│
└───📁 Resource Group: RG-CV-PORTAL-MONITORING
     │   📍 Ubicación: East US 2
     │   🎯 Propósito: Recursos compartidos de monitoreo
     │
     ├── 📊 Application Insights: appinsights-cv-portal (Free)
     │   ├── Daily Cap: 1GB
     │   ├── Sampling: 100% (producción)
     │   └── Retention: 90 días
     │
     └── 📈 Log Analytics Workspace: logs-cv-portal (Free)
         ├── Data Retention: 30 días
         ├── Daily Cap: 0.5GB
         └── Queries: Kusto Query Language (KQL)
```

### 3.2 Justificación de Resource Groups

| Resource Group | Justificación |
|----------------|---------------|
| **RG-CV-PORTAL-PROD** | Aislamiento total de producción. Si algo falla aquí, no afecta pruebas. Permite aplicar políticas de seguridad más estrictas. |
| **RG-CV-PORTAL-TEST** | Ambiente aislado para pruebas. Se puede destruir y recrear sin impacto. Ideal para pruebas de migraciones y scripts destructivos. |
| **RG-CV-PORTAL-MONITORING** | Centraliza logs y monitoreo de ambos ambientes. Facilita comparativas y dashboards unificados. |

---

## 4. DIAGRAMA DE ARQUITECTURA COMPLETA

### 4.1 Diagrama de Componentes y Flujo de Datos

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                     DESARROLLADOR                                           │
│                                    (Tu máquina local)                                       │
│  ┌─────────────────────────────────────────────────────────────────────────────────────┐    │
│  │  VS Code / Visual Studio                                                            │    │
│  │  ├── Backend .NET 8 (API)                                                           │    │
│  │  ├── Frontend Angular 17                                                            │    │
│  │  └── SQL Server Developer Edition (Local DB)                                        │    │
│  └─────────────────────────────────────────────────────────────────────────────────────┘    │
│                                          │                                                  │
│                              git push origin feature/*                                      │
│                                          ▼                                                  │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
                                           │
                                           ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                    GITHUB (Repositorio)                                     │
│  ┌─────────────────────────────────────────────────────────────────────────────────────┐    │
│  │  main (protección: PR obligatorio)                                                  │    │
│  │  develop (protección: PR obligatorio)                                               │    │
│  │  feature/* (sin protección)                                                         │    │
│  │  hotfix/* (sin protección)                                                          │    │
│  └─────────────────────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
                                           │
                        Webhook / Trigger automático
                                           ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                              AZURE DEVOPS PIPELINES (CI/CD)                                 │
│  ┌─────────────────────────────────────────────────────────────────────────────────────┐    │
│  │  STAGE 1: CONTINUOUS INTEGRATION (CI)                                               │    │
│  │  ┌─────────────────────────────────────────────────────────────────────────────┐    │    │
│  │  │  Agente: ubuntu-latest                                                      │    │    │
│  │  │  ├── 1. Checkout código desde GitHub                                        │    │    │
│  │  │  ├── 2. Setup .NET 8 SDK                                                    │    │    │
│  │  │  ├── 3. Setup Node.js 20 (Angular)                                          │    │    │
│  │  │  ├── 4. dotnet restore → dotnet build → dotnet test (xUnit)                 │    │    │
│  │  │  ├── 5. npm install → npm run build (Angular) → npm test (Jest)             │    │    │
│  │  │  ├── 6. SonarCloud Scan (análisis de código)                                │    │    │
│  │  │  └── 7. Publicar artefactos (backend: publish/, frontend: dist/)            │    │    │
│  │  └─────────────────────────────────────────────────────────────────────────────┘    │    │
│  │                                                                                     │    │
│  │  STAGE 2: DEPLOY TO TEST (Automático al merge a develop)                            │    │
│  │  ┌─────────────────────────────────────────────────────────────────────────────┐    │    │
│  │  │  Ambiente: TEST                                                             │    │    │
│  │  │  ├── Deploy Database: Ejecutar scripts SQL en db-cv-test                    │    │    │
│  │  │  ├── Deploy Backend: Publicar API en app-cv-api-test                        │    │    │
│  │  │  ├── Deploy Frontend: Publicar Angular en static-cv-frontend-test           │    │    │
│  │  │  └── Run Integration Tests: Postman/Newman vs API test                      │    │    │
│  │  └─────────────────────────────────────────────────────────────────────────────┘    │    │
│  │                                                                                     │    │
│  │  STAGE 3: DEPLOY TO PRODUCTION (Manual con aprobación)                              │    │
│  │  ┌─────────────────────────────────────────────────────────────────────────────┐    │    │
│  │  │  Ambiente: PRODUCTION (requiere aprobación manual)                          │    │    │
│  │  │  ├── Deploy Database: Migraciones en db-cv-prod (con backup previo)         │    │    │
│  │  │  ├── Deploy Backend: Slot staging → swap con producción                     │    │    │
│  │  │  ├── Deploy Frontend: Despliegue en static-cv-frontend-prod                 │    │    │
│  │  │  └── Smoke Tests: Validación de endpoints críticos                          │    │    │
│  │  └─────────────────────────────────────────────────────────────────────────────┘    │    │
│  └─────────────────────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
                                           │
                    ┌──────────────────────┼──────────────────────┐
                    ▼                      ▼                      ▼
┌─────────────────────────────┐ ┌─────────────────────────────┐ ┌─────────────────────────────┐
│     AMBIENTE TEST (QA)      │ │   AMBIENTE PRODUCCIÓN       │ │      MONITOREO              │
│   RG-CV-PORTAL-TEST         │ │   RG-CV-PORTAL-PROD         │ │   RG-CV-PORTAL-MONITORING   │
├─────────────────────────────┤ ├─────────────────────────────┤ ├─────────────────────────────┤
│                             │ │                             │ │                             │
│  ┌─────────────────────┐    │ │  ┌─────────────────────┐    │ │  ┌─────────────────────┐    │
│  │ Static Web App      │    │ │  │ Static Web App      │    │ │  │ Application         │    │
│  │ (Angular)           │    │ │  │ (Angular)           │    │ │  │ Insights            │    │
│  │ test-frontend...    │    │ │  │ prod-frontend...    │    │ │  │                     │    │
│  └──────────┬──────────┘    │ │  └──────────┬──────────┘    │ │  │ • Rendimiento       │    │
│             │               │ │             │               │ │  │ • Errores           │    │
│             ▼               │ │             ▼               │ │  │ • Métricas custom   │    │
│  ┌─────────────────────┐    │ │  ┌─────────────────────┐    │ │  │ • Dependencias      │    │
│  │ App Service         │    │ │  │ App Service         │    │ │  └──────────┬──────────┘    │
│  │ (.NET API)          │    │ │  │ (.NET API)          │    │ │             │               │
│  │ test-api...         │    │ │  │ prod-api...         │    │ │             ▼               │
│  └──────────┬──────────┘    │ │  └──────────┬──────────┘    │ │  ┌─────────────────────┐    │
│             │               │ │             │               │ │  │ Log Analytics       │    │
│             ▼               │ │             ▼               │ │  │ Workspace           │    │
│  ┌─────────────────────┐    │ │  ┌─────────────────────┐    │ │  │                     │    │
│  │ Azure SQL Database  │    │ │  │ Azure SQL Database  │    │ │  │ • Logs de App       │    │
│  │ db-cv-test          │    │ │  │ db-cv-prod          │    │ │  │ • Logs de sistema   │    │
│  │ • Datos ofuscados   │    │ │  │ • Datos reales      │    │ │  │ • Alertas           │    │
│  │ • 10+ CVs prueba    │    │ │  │ • Usuarios reales   │    │ │  │ • Dashboards        │    │
│  └─────────────────────┘    │ │  └─────────────────────┘    │ │  └─────────────────────┘    │
│                             │ │                             │ │                             │
│  ┌─────────────────────┐    │ │  ┌─────────────────────┐    │ │                             │
│  │ Storage Account     │    │ │  │ Storage Account     │    │ │                             │
│  │ (Archivos prueba)   │    │ │  │ (Archivos reales)   │    │ │                             │
│  └─────────────────────┘    │ │  └─────────────────────┘    │ │                             │
│                             │ │                             │ │                             │
└─────────────────────────────┘ └─────────────────────────────┘ └─────────────────────────────┘
```

---

## 5. REQUERIMIENTOS MÍNIMOS DE INFRAESTRUCTURA

### 5.1 Resumen de Recursos Azure

| Recurso | Ambiente TEST | Ambiente PROD | Total | Unidad |
|---------|---------------|---------------|-------|--------|
| **Resource Groups** | 1 | 1 | 2 | grupos |
| **App Services** | 1 | 1 | 2 | instancias |
| **Static Web Apps** | 1 | 1 | 2 | instancias |
| **SQL Servers** | 1 | 1 | 2 | servidores |
| **SQL Databases** | 1 | 1 | 2 | bases de datos |
| **Storage Accounts** | 1 | 1 | 2 | cuentas |
| **Application Insights** | 0 | 1 | 1 | recurso |
| **Log Analytics** | 1 (compartido) | 1 (compartido) | 1 | workspace |

### 5.2 Límites de Capa Gratuita a Considerar

| Servicio | Límite | Estrategia |
|----------|--------|------------|
| **App Service F1** | 60 min CPU/día | Usar slots staging para despliegues sin downtime |
| **Static Web Apps** | 100 GB ancho banda/mes | Optimizar assets (gzip, minificar, lazy loading) |
| **SQL Database Basic** | 2 GB/db | Mantener datos históricos en archivos (Blob Storage) |
| **Application Insights** | 1 GB/día | Configurar sampling (reducir datos en test) |
| **Log Analytics** | 0.5 GB/día | Filtrar logs no críticos en TEST |

### 5.3 Matriz de Conexiones y Endpoints

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FLUJO DE DATOS                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Usuario → Static Web App (CDN) → API (HTTPS) → SQL Database        │
│                │                         │                          │
│                │                         ▼                          │
│                │                 Storage Account                    │
│                │                 (archivos CV)                      │
│                │                                                    │
│                └──────────────→ Application Insights                │
│                                  (telemetría)                       │
│                                                                     │
│  CI/CD Pipeline:                                                    │
│  GitHub → Azure DevOps → App Service (deploy)                       │
│                       → SQL Database (migraciones)                  │
│                       → Static Web App (deploy)                     │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 6. ESTRATEGIA DE SEGURIDAD POR AMBIENTE

| Capa de Seguridad | TEST | PRODUCCIÓN |
|-------------------|------|------------|
| **Autenticación API** | JWT (mismo que prod) | JWT + Refresh Token + HttpOnly Cookies |
| **CORS** | `*` (para pruebas) | Solo dominios específicos (frontend) |
| **SQL Firewall** | Azure Services ON + IP desarrollador | Azure Services ON + IPs restringidas |
| **TLS/SSL** | Certificado automático | Certificado automático + HSTS |
| **Connection Strings** | Variables Azure DevOps | Variables Azure DevOps (secretas) |
| **Backup Automático** | No necesario | 7 días retención (incluido en Basic) |

---

## 7. FLUJO DE TRABAJO COMPLETO (DÍA A DÍA)

```
DÍA 1: DESARROLLO DE FEATURE
─────────────────────────────────────────────────────────────────
1. git checkout -b feature/agregar-buscador
2. Desarrollar en local con SQL Server Local
3. dotnet test / npm test (pruebas unitarias)
4. git push origin feature/agregar-buscador
5. Crear Pull Request a develop en GitHub

DÍA 2: VALIDACIÓN AUTOMÁTICA
─────────────────────────────────────────────────────────────────
6. GitHub → Webhook → Azure Pipeline (CI) se ejecuta
7. Build → Tests → SonarCloud (análisis calidad)
8. Si todo OK, se despliega automático a AMBIENTE TEST
9. Cypress ejecuta pruebas E2E contra ambiente TEST
10. Se notifica en Azure DevOps Boards: "Listo para revisión"

DÍA 3: REVISIÓN Y DESPLIEGUE A PRODUCCIÓN
─────────────────────────────────────────────────────────────────
11. Developer 2 revisa PR (aprueba)
12. Merge a develop → despliegue automático a TEST (confirmación)
13. QA manual valida en ambiente TEST (Azure Test Plans)
14. Crear PR de develop a main
15. Aprobación manual en Azure Pipeline para PRODUCCIÓN
16. Despliegue a PROD con slot staging (zero downtime)
17. Smoke tests automáticos validan endpoints críticos
18. Application Insights confirma que todo funciona
19. Se actualiza Board: "Historia Completada"
```

---

## 8. COMPARATIVA: TU SETUP VS SETUP EMPRESARIAL

| Aspecto | Setup Empresarial (Pagado) | Tu Setup (Gratuito) | Diferencia |
|---------|---------------------------|---------------------|------------|
| **Orquestación** | Azure DevOps (Enterprise) | Azure DevOps (Free) | Misma funcionalidad, límites en usuarios |
| **Repositorio** | GitHub Enterprise | GitHub Free | Misma funcionalidad, repos públicos o privados con límites |
| **CI/CD** | Self-hosted agents | Microsoft-hosted agents | Límite de 1800 min/mes (suficiente) |
| **Hosting** | App Service Premium | App Service F1 | Menor CPU, sin auto-escalado |
| **Base Datos** | SQL Managed Instance | SQL Basic | Menor DTU, 2GB vs terabytes |
| **Monitoreo** | Application Insights Enterprise | Application Insights Free | Límite 1GB/día vs 5GB/día |
| **Pruebas** | Sauce Labs / BrowserStack | Cypress + Postman | Sin pruebas en múltiples navegadores reales |
| **Contenedores** | AKS (Kubernetes) | No necesario | Mayor complejidad, no requerida |

---

## 9. CONCLUSIÓN: LO QUE LOGRAS CON ESTE SETUP

✅ **Gestión de proyecto profesional:** Azure DevOps Boards con épicas, features, historias, sprints  
✅ **Control de versiones estándar:** GitHub con protección de ramas, PRs obligatorios  
✅ **Integración continua:** Build automático, pruebas unitarias, análisis SonarCloud  
✅ **Calidad de código:** SonarCloud con métricas de deuda técnica, vulnerabilidades  
✅ **Despliegue continuo:** Multi-ambiente (TEST → PROD) con aprobaciones manuales  
✅ **Hosting en la nube:** App Service + Static Web Apps + SQL Database (todo gratis)  
✅ **Monitoreo:** Application Insights para rendimiento y errores  
✅ **Documentación:** Wiki de Azure DevOps con toda la arquitectura  

**Lo que NO tienes (y no necesitas para un proyecto personal):**
- Escalado automático
- Alta disponibilidad (99.95%)
- Backup automático avanzado
- Multi-región
- Soporte 24/7

---

## 10. PRÓXIMOS PASOS PARA IMPLEMENTAR

1. **Semana 1:** Crear Resource Groups en Azure siguiendo la estructura
2. **Semana 2:** Configurar Azure Pipelines con CI (build + tests)
3. **Semana 3:** Integrar SonarCloud y mejorar cobertura de pruebas
4. **Semana 4:** Configurar despliegue a ambiente TEST
5. **Semana 5:** Configurar ambiente PRODUCCIÓN con aprobaciones
6. **Semana 6:** Implementar Application Insights y monitoreo

Con esta arquitectura, estás replicando fielmente un entorno de desarrollo profesional, con todas las etapas de DevOps cubiertas, y lo mejor: **sin ningún costo mensual**.