# Plantilla de Herramientas por Ambiente

## Objetivo
Registrar, de forma ordenada, las herramientas que usa el proyecto por ambiente y su estado de configuracion.

## Instrucciones de uso
- Una fila por herramienta y ambiente.
- No colocar secretos reales.
- Completar owner, estado y enlace de acceso.

## Catalogo base

| ID | Herramienta | Categoria | Ambiente | Uso principal | Owner | Estado | Enlace/Ubicacion | Notas |
|---|---|---|---|---|---|---|---|---|
| TOOL-001 | GitHub | Repositorio/CI | Global | Codigo fuente, PR, Actions |  | Pendiente |  |  |
| TOOL-002 | SonarCloud | Calidad | Develop/Prod | Analisis de codigo y quality gate |  | Pendiente |  |  |
| TOOL-003 | SQL Server Local | Base de datos | Local | Desarrollo y pruebas locales |  | Pendiente |  |  |
| TOOL-004 | Azure SQL | Base de datos | Develop/Prod | Base de datos administrada |  | Pendiente |  |  |
| TOOL-005 | Azure Container Apps | Runtime backend | Develop/Prod | Hosting de API .NET |  | Pendiente |  |  |
| TOOL-006 | Azure Static Web Apps | Runtime frontend | Develop/Prod | Hosting de SPA Angular |  | Pendiente |  |  |
| TOOL-007 | Docker Desktop | Contenedores | Local | Opcional: construir/validar imagen backend (`backend/Dockerfile`) |  | Pendiente |  | No requerido para `dotnet run` + `ng serve` |
| TOOL-008 | Postman/Insomnia | API testing | Local/Develop | Pruebas manuales de endpoints |  | Pendiente |  |  |
| TOOL-009 | Azure Data Studio/SSMS | DB admin | Local/Develop/Prod | Gestion y consultas SQL |  | Pendiente |  |  |
| TOOL-010 | Node.js + npm | Frontend build/test | Local/CI | Build y tests Angular |  | Pendiente |  |  |
| TOOL-011 | .NET SDK | Backend build/test | Local/CI | Build y ejecucion API |  | Pendiente |  |  |

## Checklist minimo por ambiente

### Local
- [ ] GitHub operativo (clone, push, PR).
- [ ] SQL Server local operativo.
- [ ] .NET SDK instalado (backend: build, run y test de la API).
- [ ] Node.js + npm instalados (frontend Angular: build y test).
- [ ] Docker Desktop operativo (opcional: validar imagen backend localmente).
- [ ] Herramienta de pruebas API disponible.

### Develop
- [ ] GitHub Actions ejecuta build/test.
- [ ] SonarCloud configurado (`SONAR_TOKEN`, `SONAR_ORGANIZATION`, `SONAR_PROJECT_KEY`).
- [ ] Recursos Azure de develop accesibles.
- [ ] Variables/secrets de develop definidos.

### Production
- [ ] Recursos Azure productivos definidos.
- [ ] Secrets de produccion separados de develop.
- [ ] Monitoreo y alertas activos.
- [ ] Accesos con minimo privilegio y aprobaciones.

## Estados sugeridos
- `Pendiente`: no configurado.
- `En progreso`: parcialmente configurado.
- `Activo`: funcionando y validado.
- `Bloqueado`: requiere decision o acceso externo.
