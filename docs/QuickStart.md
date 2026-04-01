# Guía de Inicio Rápido — Portal CV Web

## Prerrequisitos

| Herramienta | Versión mínima | Verificar |
|-------------|---------------|-----------|
| Git | 2.x | `git --version` |
| Docker Desktop | 4.x | `docker --version` |
| .NET SDK | 10.0 | `dotnet --version` |
| Node.js | 22.x | `node --version` |
| npm | 10.x | `npm --version` |

---

## Opción A — Docker (recomendado)

Levanta backend, frontend y base de datos en un solo comando.

```bash
# 1. Clonar el repositorio
git clone https://github.com/maomauro/Curriculum-Vitae-Web.git
cd Curriculum-Vitae-Web

# 2. Crear archivo de entorno local
cp .env.example .env
# Editar .env: cambia SA_PASSWORD, APP_DB_PASSWORD, Jwt__Key, etc.

# 3. Levantar servicios (primera vez: descarga imágenes y crea la BD)
docker compose --profile app up -d

# 4. Verificar que todo esté corriendo
docker compose ps
```

**URLs disponibles:**

| Servicio | URL |
|----------|-----|
| Frontend (Angular) | http://localhost:4200 |
| Backend API | http://localhost:5000 |
| Swagger / OpenAPI | http://localhost:5000/swagger |
| SQL Server | `localhost:1433` (usuario: `portalcv_app`) |

```bash
# Detener servicios
docker compose --profile app down

# Ver logs del backend
docker compose logs backend --tail 50 -f
```

---

## Opción B — Desarrollo local (sin Docker)

### Base de datos

Requiere SQL Server local o Docker solo para la BD:

```bash
# Solo la BD con Docker
docker compose up db db-init -d
```

O conectar a Azure SQL — ver sección [Azure SQL](#azure-sql) más abajo.

### Backend (.NET 10)

```bash
cd backend/PortalCV.Backend/PortalCV.Api

# Configurar variables de entorno (copiar del .env)
# O crear appsettings.Development.json con los mismos valores

dotnet restore
dotnet run
# API disponible en http://localhost:5000
# Swagger en http://localhost:5000/swagger
```

### Frontend (Angular 20)

```bash
cd frontend
npm install
npm start
# App disponible en http://localhost:4200
```

---

## Azure SQL

Para conectar el backend a Azure SQL en lugar del Docker local:

1. Ejecutar scripts en Azure Data Studio (conectado a la BD `PortalCV`):
   ```
   scripts/05_AzureSQL_CreateSchema.sql  ← DDL completo
   scripts/06_AzureSQL_SeedRoles.sql     ← Roles base
   ```

2. Editar en `.env` la cadena de conexión:
   ```dotenv
   # Comentar la línea local y descomentar la de Azure:
   # ConnectionStrings__DefaultConnection=Server=db,1433;...
   ConnectionStrings__DefaultConnection=Server=sql-<servidor>.database.windows.net,1433;Database=PortalCV;User Id=portalcv_app_prod;Password=<tu-password>;Encrypt=True;TrustServerCertificate=False;
   ```

---

## Ejecutar tests

### Frontend (unitarios)

```bash
cd frontend

# Modo watch (desarrollo)
npm test

# Modo headless — igual que CI
npm test -- --configuration ci
```

### Backend

> Los tests de backend están pendientes (ver HS-XX en el backlog). El pipeline CI ya tiene el bloque preparado para activarlos.

---

## CI/CD

El pipeline se ejecuta automáticamente en cada push y PR hacia `develop` o `main`.

**Archivo:** [.github/workflows/ci.yml](../.github/workflows/ci.yml)

| Job | Qué hace |
|-----|----------|
| `backend` | `dotnet restore` → `dotnet build --configuration Release` |
| `frontend` | `npm ci` → `ng build --configuration production` → `ng test --configuration ci` |

**Badge de estado:**
```
[![CI](https://github.com/maomauro/Curriculum-Vitae-Web/actions/workflows/ci.yml/badge.svg)](https://github.com/maomauro/Curriculum-Vitae-Web/actions/workflows/ci.yml)
```

---

## Estructura del proyecto

```
Curriculum-Vitae-Web/
├── .github/
│   └── workflows/
│       └── ci.yml              ← GitHub Actions CI
├── backend/
│   └── PortalCV.Backend/
│       ├── PortalCV.Api/       ← Entrada HTTP, controllers, Program.cs
│       ├── PortalCV.Application/
│       ├── PortalCV.Domain/
│       └── PortalCV.Infrastructure/ ← EF Core, repositorios
├── frontend/
│   └── src/app/
│       ├── core/               ← Servicios globales, interceptores
│       ├── shared/
│       ├── layout/             ← Header, Footer, MainLayout
│       └── features/           ← public, auth, editor, dashboard
├── scripts/
│   ├── 01_CreateSchema.sql     ← DDL para Docker local
│   ├── 02_InsertTestData.sql
│   ├── 05_AzureSQL_CreateSchema.sql ← DDL para Azure SQL
│   └── 06_AzureSQL_SeedRoles.sql
├── database/                   ← DBML, diccionario de datos, ER
├── docs/                       ← Documentación del proyecto
├── docker-compose.yml
├── .env.example                ← Plantilla de variables de entorno
└── README.md
```
