# Guia de Inventario de Secrets por Ambiente

## Objetivo
Mantener un inventario unico de credenciales y secretos requeridos por el proyecto `Curriculum-Vitae-Web`, sin exponer valores sensibles en el repositorio.

## Alcance
Esta guia cubre:
- Desarrollo local (maquina del dev: `dotnet user-secrets` o `docker/backend.local.env`).
- CI (GitHub Actions a nivel de repositorio; no hay GitHub Environment separado hoy).
- Produccion (`main` / release en Azure Container Apps + Azure Static Web Apps + Azure SQL).
- Herramientas: GitHub, SonarCloud, Azure, base de datos, servicios externos.

## Reglas obligatorias
- No guardar secretos reales en archivos `.md`, `appsettings*.json`, `launchSettings.json`, `.env` versionado o issues.
- En este inventario solo se registra metadata: nombre, uso, owner, ambiente, ubicacion, estado de rotacion.
- Todo secreto debe tener owner y fecha de ultima rotacion.

---

## 1) Catalogo maestro (sin valores)

Usar esta plantilla por cada secreto:

| Campo | Valor |
|---|---|
| ID | SEC-XXX |
| Nombre tecnico | (ej: `Jwt__Key`) |
| Categoria | DB / Auth / API / CI-CD / Observabilidad / Infra |
| Ambientes | Local / Develop / Production |
| Ubicacion | User-Secrets / GitHub Environment / Azure Key Vault / Runtime Env |
| Owner | Persona o rol responsable |
| Consumido por | Backend / Frontend / Pipeline / Recurso Azure |
| Rotacion | Mensual / Trimestral / Semestral / Evento |
| Ultima rotacion | YYYY-MM-DD |
| Proxima rotacion | YYYY-MM-DD |
| Estado | Activo / Pendiente / Deprecado |
| Notas | Riesgos, dependencias, ticket relacionado |

---

## 2) Inventario minimo por componente

### 2.1 Backend (.NET)
- [ ] `ConnectionStrings__DefaultConnection`
- [ ] `Jwt__Key`
- [ ] `Jwt__Issuer` (puede ser variable no sensible)
- [ ] `Jwt__Audience` (puede ser variable no sensible)
- [ ] `Auth__DemoUser__Email` (si se usa usuario demo)
- [ ] `Auth__DemoUser__Password` (si se usa usuario demo)

### 2.2 Base de datos (SQL Server / Azure SQL)
- [ ] Credencial admin de base de datos (uso restringido)
- [ ] Credencial de aplicacion (runtime) con minimo privilegio
- [ ] Credencial de migraciones (si aplica, separada de runtime)
- [ ] Credencial read-only para reportes (si aplica)

### 2.3 GitHub Actions / CI-CD
- [ ] `SONAR_TOKEN` (Secret)
- [ ] `SONAR_ORGANIZATION` (Variable)
- [ ] `SONAR_PROJECT_KEY` (Variable)
- [ ] Credenciales Azure para despliegue (preferir OIDC)
- [ ] Tokens de integraciones externas usadas por pipeline

### 2.4 Azure (runtime)
- [ ] Secrets de app en entorno `develop`
- [ ] Secrets de app en entorno `production`
- [ ] Cadenas de conexion por ambiente (nunca compartidas)
- [ ] Cuentas tecnicas/identidades de servicio con minimo privilegio

### 2.5 Frontend
- [ ] Variables publicas de configuracion (no secretas)
- [ ] Confirmar que no hay secrets en bundle final
- [ ] Si usa API keys sensibles, moverlas al backend/proxy

### 2.6 Testing / QA
- [ ] Cuentas de prueba por rol (sin datos reales)
- [ ] Secretos de pruebas de integracion (si aplica)
- [ ] Regla de reseteo/rotacion de credenciales de test

---

## 3) Matriz por ambiente

## Local (Developer)
**Ubicacion recomendada:** `dotnet user-secrets` (flujo nativo) o `docker/backend.local.env` (flujo Docker). Ambos fuera de git.

| Nombre tecnico | Requerido | Owner | Estado |
|---|---|---|---|
| `ConnectionStrings__DefaultConnection` | Si | maomauro | Activo — nativo via `Trusted_Connection=true` (ver `launchSettings.json`); Docker via `docker/backend.local.env` con `portalcv_app` |
| `Jwt__Key` | Si | maomauro | Activo en `docker/backend.local.env`; Pendiente en `dotnet user-secrets` |
| `Jwt__Issuer` | Si (no sensible) | maomauro | Activo (`PortalCV.Api`) |
| `Jwt__Audience` | Si (no sensible) | maomauro | Activo (`PortalCV.Client`) |
| `Auth__DemoUser__Email` | Opcional | maomauro | No configurado |
| `Auth__DemoUser__Password` | Opcional | maomauro | No configurado |

Checklist:
- [x] `launchSettings.json` sin secretos reales (solo cadena a `SQLEXPRESS` con `Trusted_Connection`).
- [x] `docker/backend.local.env` excluido de git (`.gitignore`).
- [x] Plantilla `docker/backend.local.env.example` versionada con placeholders.
- [ ] User-secrets configurados para el flujo nativo `dotnet run`.

## CI (GitHub Actions a nivel de repositorio)
**Ubicacion recomendada:** `Settings -> Secrets and variables -> Actions` del repositorio.

> Nota: actualmente no existe GitHub Environment `develop` separado; los secrets/vars del CI viven a nivel de repositorio y aplican a todos los jobs del pipeline.

| Nombre tecnico | Tipo | Requerido | Owner | Estado |
|---|---|---|---|---|
| `SONAR_TOKEN` | Secret | Si | maomauro | Activo |
| `SONAR_ORGANIZATION` | Variable | Si | maomauro | Activo |
| `SONAR_PROJECT_KEY` | Variable | Si | maomauro | Activo |
| `AZURE_CREDENTIALS` | Secret | Para deploy | maomauro | Pendiente (workflow de deploy aun no existe) |
| `AZURE_STATIC_WEB_APPS_TOKEN` | Secret | Para deploy SWA | maomauro | Pendiente |
| `JWT_KEY_PROD` | Secret | Para deploy ACA | maomauro | Pendiente |
| `AZURE_SQL_CONN_PROD` | Secret | Para deploy ACA | maomauro | Pendiente |

Checklist:
- [x] Secret `SONAR_TOKEN` y variables `SONAR_*` cargados.
- [x] Quality Gate de SonarCloud "Passed" en `main`.
- [ ] Secrets de Azure creados cuando se implemente el job de deploy.
- [ ] Evaluar migracion a OIDC (sin password estatico) para `AZURE_CREDENTIALS`.

## Production (Azure)
**Ubicacion recomendada:** variables de entorno de Azure Container Apps (y Azure Key Vault si se decide centralizar).

| Nombre tecnico | Requerido | Owner | Estado |
|---|---|---|---|
| `ConnectionStrings__DefaultConnection` | Si | maomauro | Pendiente — cadena a `sql-portalcv-mao.database.windows.net` con `portalcv_app_prod` |
| `Jwt__Key` | Si | maomauro | Pendiente — clave distinta a la de local/develop (≥ 32 chars) |
| `Jwt__Issuer` | Si (no sensible) | maomauro | Pendiente — valor: `PortalCV.Api` |
| `Jwt__Audience` | Si (no sensible) | maomauro | Pendiente — valor: `PortalCV.Client` |
| `ASPNETCORE_ENVIRONMENT` | Si (no sensible) | maomauro | Pendiente — valor: `Production` |
| `Cors__AllowedOrigins__0` | Si (no sensible) | maomauro | Pendiente — URL final del Static Web App |

Checklist:
- [ ] Secrets de produccion distintos a los de local y CI.
- [ ] Aprobacion para despliegues a `production` (GitHub Environment con reviewers).
- [ ] Politica de rotacion activa (90 dias para criticos).
- [ ] Plan de respuesta ante exposicion validado.
- [ ] Firewall Azure SQL: `Allow Azure services ON`.
- [ ] `portalcv_app_prod` con permisos minimos (SELECT/INSERT/UPDATE/DELETE/EXECUTE sobre `dbo`).

---

## 4) Duenos y responsabilidades (RACI simplificado)

| Actividad | Responsable principal | Apoyo |
|---|---|---|
| Alta de secreto nuevo | Tech Lead / DevOps | Desarrollador solicitante |
| Asignar permisos minimos | DevOps | Tech Lead |
| Rotacion programada | DevOps | Security Champion |
| Baja/revocacion de secreto | DevOps | Owner del sistema |
| Auditoria mensual | Tech Lead | Todo el equipo |

---

## 5) Politica de rotacion sugerida

- **Criticos (DB prod, JWT prod, tokens despliegue):** cada 90 dias.
- **Medios (servicios internos no criticos):** cada 180 dias.
- **Evento de seguridad (fuga sospechada):** rotacion inmediata.
- **Salida de colaborador con acceso:** rotacion inmediata de secretos compartidos.

---

## 6) Procedimiento si Sonar detecta hardcoded credentials

1. Identificar archivo y secreto reportado.
2. Remover valor real del codigo y usar placeholder.
3. Mover secreto a fuente segura (user-secrets / GitHub / Azure).
4. Rotar el secreto comprometido.
5. Commit + PR + reanalizar Sonar.
6. Registrar incidente en backlog tecnico.

---

## 7) Evidencia minima por sprint
- [ ] Export o captura de secretos por ambiente (sin valores).
- [ ] Registro de rotaciones realizadas.
- [ ] Resultado Sonar sin nuevos hardcoded credentials.
- [ ] Validacion de accesos de excolaboradores revocados.

---

## 8) Notas para este proyecto
- El repo ya integra SonarCloud en CI (`.github/workflows/ci.yml`) condicionado a secrets/variables.
- Evitar credenciales en `backend/.../Properties/launchSettings.json`.
- Mantener coherencia con `docs/guias/Guia-secrets-y-credenciales.md`.

