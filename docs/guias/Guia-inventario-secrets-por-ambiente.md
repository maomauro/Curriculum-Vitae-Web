# Guia de Inventario de Secrets por Ambiente

## Objetivo
Mantener un inventario unico de credenciales y secretos requeridos por el proyecto `Curriculum-Vitae-Web`, sin exponer valores sensibles en el repositorio.

## Alcance
Esta guia cubre:
- Desarrollo local.
- Integracion (`develop`).
- Produccion (`main` / release).
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
**Ubicacion recomendada:** `dotnet user-secrets` y variables locales fuera de git.

| Nombre tecnico | Requerido | Owner | Estado |
|---|---|---|---|
| `ConnectionStrings__DefaultConnection` | Si |  |  |
| `Jwt__Key` | Si |  |  |
| `Auth__DemoUser__Email` | Opcional |  |  |
| `Auth__DemoUser__Password` | Opcional |  |  |

Checklist:
- [ ] `launchSettings.json` sin secretos reales.
- [ ] `.env` local excluido de git.
- [ ] User-secrets configurados en la maquina de cada dev.

## Develop
**Ubicacion recomendada:** GitHub Environment `develop` + runtime env vars.

| Nombre tecnico | Requerido | Owner | Estado |
|---|---|---|---|
| `ConnectionStrings__DefaultConnection` | Si |  |  |
| `Jwt__Key` | Si |  |  |
| `SONAR_TOKEN` | Si |  |  |
| `SONAR_ORGANIZATION` | Si |  |  |
| `SONAR_PROJECT_KEY` | Si |  |  |
| Credencial deploy Azure develop | Segun pipeline |  |  |

Checklist:
- [ ] Secretos separados de `production`.
- [ ] Permisos minimos en recursos de Azure.
- [ ] Logs y monitoreo sin exponer secretos.

## Production
**Ubicacion recomendada:** GitHub Environment `production` + Azure Key Vault/env vars.

| Nombre tecnico | Requerido | Owner | Estado |
|---|---|---|---|
| `ConnectionStrings__DefaultConnection` | Si |  |  |
| `Jwt__Key` | Si |  |  |
| Credenciales de servicios externos productivos | Segun uso |  |  |
| Credencial deploy Azure production | Segun pipeline |  |  |

Checklist:
- [ ] Secrets de produccion distintos a develop.
- [ ] Aprobacion para despliegues a `production`.
- [ ] Politica de rotacion activa.
- [ ] Plan de respuesta ante exposicion validado.

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

