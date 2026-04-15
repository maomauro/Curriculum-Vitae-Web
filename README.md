# Curriculum-Vitae-Web

Portal web para conectar profesionales (publicadores de CV) con reclutadores. Los CVs son 100% públicos; solo publicadores y administradores requieren registro y autenticación.

## Documentación

| Documento | Descripción |
|-----------|-------------|
| [docs/produccion/Plan-Trabajo-Produccion.md](docs/produccion/Plan-Trabajo-Produccion.md) | Plan operativo para salida a producción (fases, criterios y riesgos) |
| [docs/produccion/Integracion-SonarCloud.md](docs/produccion/Integracion-SonarCloud.md) | Integración SonarCloud y configuración en GitHub Actions |
| [docs/guias/Guia-git.md](docs/guias/Guia-git.md) | Buenas prácticas Git (ramas, commits, flujo) |
| [database/README.md](database/README.md) | Scripts SQL Server y creación de la base de datos |
| [database/01_CreateSchema.dbml](database/01_CreateSchema.dbml) | Modelo DBML del esquema de base de datos |
| [database/DiccionarioDeDatos.md](database/DiccionarioDeDatos.md) | Diccionario de datos completo (tablas, columnas, tipos y reglas) |

## Inicio rápido (desarrollo local)

1. **Clonar** el repositorio y copiar variables de entorno:
   - Unix/macOS: `cp .env.example .env`
   - PowerShell: `Copy-Item .env.example .env`
   - Luego ajustar contraseñas y JWT.
2. **Base de datos**: con Docker, `docker-compose up -d db db-init` y luego el perfil `app` si usas contenedores para API y front; o bien SQL Server local y ejecutar los scripts en [scripts/](scripts/) según [database/README.md](database/README.md).
3. **Backend**: `cd backend/PortalCV.Backend/PortalCV.Api` → configurar `appsettings.Development.json` (no versionado) o variables → `dotnet run`.
4. **Frontend**: `cd frontend` → `npm ci` → `ng serve` (el proxy en `proxy.conf.json` reenvía `/api` al backend).

Antes de **producción**, revisar [docs/devops/Checklist-Produccion.md](docs/devops/Checklist-Produccion.md) (CORS, JWT, SQL, build del SPA).
