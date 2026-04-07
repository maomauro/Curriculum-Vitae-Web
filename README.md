# Portal Currículum Vitae Web

[![CI](https://github.com/maomauro/Curriculum-Vitae-Web/actions/workflows/ci.yml/badge.svg)](https://github.com/maomauro/Curriculum-Vitae-Web/actions/workflows/ci.yml)

Portal web para conectar profesionales (publicadores de CV) con reclutadores. Los CVs son 100% públicos; solo publicadores y administradores requieren registro y autenticación.

## Inicio rápido

```bash
# 1. Clonar
git clone https://github.com/maomauro/Curriculum-Vitae-Web.git
cd Curriculum-Vitae-Web

# 2. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus contraseñas locales

# 3. Levantar todos los servicios
docker compose --profile app up -d

# Servicios disponibles:
#   Frontend  →  http://localhost:4200
#   Backend   →  http://localhost:5000
#   Swagger   →  http://localhost:5000/swagger
#   SQL Server →  localhost:1433
```

Ver [docs/QuickStart.md](docs/QuickStart.md) para instrucciones detalladas (desarrollo sin Docker, Azure SQL, etc.).

## Stack técnico

| Capa | Tecnología |
|------|-----------|
| Frontend | Angular 20, TypeScript, Karma/Jasmine |
| Backend | .NET 10, ASP.NET Core, EF Core 10 |
| Base de datos | SQL Server 2022 (local) / Azure SQL Free Tier (prod) |
| Contenedores | Docker, Docker Compose |
| CI/CD | GitHub Actions |

## Arquitectura

```
Curriculum-Vitae-Web/
├── frontend/          # Angular 20 — arquitectura modular con lazy loading
├── backend/           # .NET 10 — Clean Architecture (Api, Application, Domain, Infrastructure)
├── scripts/           # Scripts SQL (local y Azure SQL)
├── database/          # DBML, diccionario de datos, diagrama ER
├── docs/              # Documentación del proyecto
├── infra/             # (futuro) IaC — Terraform / Bicep
└── .github/workflows/ # GitHub Actions CI
```

## Documentación

| Documento | Descripción |
|-----------|-------------|
| [docs/QuickStart.md](docs/QuickStart.md) | Guía de inicio rápido (Docker, local, Azure) |
| [docs/arquitectura/Documentacion.md](docs/arquitectura/Documentacion.md) | Visión del producto, componentes, seguridad, modelo de datos, arquitectura |
| [docs/arquitectura/Backlog.md](docs/arquitectura/Backlog.md) | Épicas, historias de usuario y plan de sprints |
| [docs/diseño/Diseño.md](docs/diseño/Diseño.md) | Vistas del proyecto, arquitectura de layouts, paleta de colores |
| [docs/arquitectura/Modelo.md](docs/arquitectura/Modelo.md) | Modelo de datos detallado (tablas y relaciones) |
| [docs/devops/Despliegue.md](docs/devops/Despliegue.md) | Guía CI/CD y despliegue — GitHub Actions, Azure Container Apps, Static Web Apps |
| [docs/devops/DevOps.md](docs/devops/DevOps.md) | Operación técnica, prácticas y lineamientos DevOps |
| [docs/devops/Plan-Backup-Mantenimiento.md](docs/devops/Plan-Backup-Mantenimiento.md) | Política básica de backups, retención e índices/estadísticas |
| [docs/devops/Politica-Proteccion-Ramas.md](docs/devops/Politica-Proteccion-Ramas.md) | Política obligatoria de protección de ramas y PR/MR |
| [docs/guias/Guia-git.md](docs/guias/Guia-git.md) | Buenas prácticas Git (ramas, commits, flujo) |
| [database/README.md](database/README.md) | Scripts SQL Server y creación de la base de datos |
| [database/01_CreateSchema.dbml](database/01_CreateSchema.dbml) | Modelo DBML del esquema de base de datos |
| [database/DiccionarioDeDatos.md](database/DiccionarioDeDatos.md) | Diccionario de datos completo (tablas, columnas, tipos y reglas) |
