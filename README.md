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
| [docs/Documentacion.md](docs/Documentacion.md) | Visión del producto, componentes, seguridad, arquitectura |
| [docs/Backlog.md](docs/Backlog.md) | Épicas, historias de usuario y plan de sprints |
| [docs/Modelo.md](docs/Modelo.md) | Modelo de datos detallado (tablas y relaciones) |
| [docs/Despliegue.md](docs/Despliegue.md) | Guía CI/CD, Docker, Azure |
| [docs/DevOps.md](docs/DevOps.md) | Operación técnica y lineamientos DevOps |
| [docs/Guia-git.md](docs/Guia-git.md) | Flujo Git (ramas, commits, PRs) |
| [database/DiccionarioDeDatos.md](database/DiccionarioDeDatos.md) | Diccionario de datos completo |
