# Checklist de Auditoría del Repositorio — PortalCV

> Generado el 2026-08-18 tras una auditoría completa del repositorio en 4 frentes: limpieza, estructura, alineación documentación-vs-código y hallazgos sueltos. Resuelto el mismo día.

**Stack confirmado**: .NET 10 (Clean Architecture: Domain/Application/Infrastructure/Api + Api.Tests) · Angular 20 (NgModules) · SQL Server/Azure SQL vía DDL manual (sin migraciones EF) · Docker → GHCR → Azure Container Apps (backend) · Azure Static Web Apps (frontend) · GitHub Actions + SonarCloud.

---

## 1. Limpieza

- [x] **1.1** — Eliminado el bloque `"PublicSnapshot": {...}` de `backend/PortalCV.Backend/PortalCV.Api/appsettings.json`. Config muerta: la feature de snapshot cold-start se retiró del código, cero referencias en `.cs`.

- [x] **1.2** — Resuelto `Auth:DemoUser` (config sin ningún `.cs` que la lea). Eliminadas las 3 referencias: `appsettings.json`, `.env.example`, `docker/backend.local.env.example` (y también en `backend/README.md`, ver **3.1**).

- [x] **1.3** — Eliminados los 8 archivos `.gitkeep` sobrantes (carpetas ya tenían contenido real): `Domain/Entities`, `Domain/Exceptions`, `Infrastructure/Data`, `Infrastructure/Repositories`, `core/guards`, `core/interceptors`, `core/services`, `layout/containers`.

- [x] **1.4** — Eliminada `backend/PortalCV.Backend/PortalCV.Application/Services/` (carpeta vacía sin rol claro en la arquitectura documentada).

- [x] **1.5** — Movido `AuditoriaCv.cs` de `Entities/` a `Entities/Privada/` (namespace plano, sin impacto en el código — solo reubicación física), consistente con el resto de entidades del área privada.

- [x] **1.6** — Eliminada la dependencia npm `overlayscrollbars` de `frontend/package.json` + las 2 líneas de su CSS en `frontend/angular.json` (build y test) + `package-lock.json` actualizado con `npm install`.

- [x] **1.7** — Recortado el boilerplate genérico de `ng new` en `frontend/README.md` ("Code scaffolding", "Running end-to-end tests", "Additional Resources"), redundante con la sección ya personalizada del proyecto.

- [x] **1.8** (opcional, bajo impacto) — Evaluado renombrar `docs/diseño/` → `docs/diseno/`. **Decisión: no aplicar** (bajo impacto, se descarta para no tocar ~40 archivos y sus referencias cruzadas sin necesidad real).

---

## 2. Estructura

- [x] **2.1** — Movida la documentación histórica/retirada a `docs/archivo/`:
  - `docs/arquitectura/Snapshot-JSON-ColdStart.md` → `docs/archivo/Snapshot-JSON-ColdStart.md`
  - `docs/arquitectura/Snapshot-JSON-Checklist-Implementacion.md` → `docs/archivo/Snapshot-JSON-Checklist-Implementacion.md`
  - `docs/devops/Validacion-Snapshot-ColdStart.md` → `docs/archivo/Validacion-Snapshot-ColdStart.md`
  - `docs/produccion/Estado-Actual-2026-08-07.md` → `docs/archivo/Estado-Actual-2026-08-07.md`
  - `docs/produccion/Sprint-Cierre-GoLive-2026-08.md` → `docs/archivo/Sprint-Cierre-GoLive-2026-08.md`
  - Referencias cruzadas actualizadas en `Checklist-Produccion.md`, `Runbook-Azure.md`, `Plan-Trabajo-Produccion.md` y `docs/README.md`.

- [x] **2.2** — Ver **1.5** (también era hallazgo estructural, no solo de limpieza).

- [x] **2.3** — Ver **1.4** (carpeta vacía sin rol claro en la arquitectura documentada).

- [x] **2.4** — Resto de la estructura revisada: sigue convenciones claras y coherentes. Sin acción.

---

## 3. Documentación vs. código real

- [x] **3.1** — Actualizado `backend/README.md`: agregadas 3 entidades (`AuditoriaAdmin`, `AuditoriaAuth`, `AuditoriaCv`), 5 interfaces (`IAuthAuditoriaService`, `IPublicCvVisitaRegistroService`, `IAdminAuditoriaService`, `ICvAuditoriaService`), 4 servicios (`AdminAuditoriaService`, `AuthAuditoriaService`, `CvAuditoriaService`, `PublicCvVisitaRegistroService`), 2 archivos de test, los endpoints de auditoría del `AdminController`; corregida la nota de `Exceptions/`; limpiado el bloque de `appsettings.json` y las menciones a `Auth__DemoUser__*`.

- [x] **3.2** — Agregadas las tablas `AuditoriaAdmin`, `AuditoriaAuth`, `AuditoriaCv` a `database/01_CreateSchema.dbml`, `database/DiccionarioDeDatos.md` y `database/README.md` (lista de categorías + nota). *(Pendiente de quien tenga acceso a la herramienta: regenerar `database/Diagrama ER.jpeg` desde el `.dbml` actualizado — no se puede regenerar una imagen desde este entorno.)*

- [x] **3.3** — Actualizado `scripts/README_ProductionScripts.md`: aclarado que el snapshot está retirado del código (tablas sin uso), y documentado `production/07_AddIpOrigenAuditoriaAuth.sql`.

- [x] **3.4** — Completado el índice `docs/README.md`: agregados `Smoke-Test-Produccion.md`, `postman/`, y nueva sección `🗄️ archivo/` con los 5 documentos históricos movidos en **2.1**.

- [x] **3.5** — README raíz, `frontend/README.md` (parte custom) y `database/README.md` revisados: alineados con el código real. Sin acción.

---

## 4. Hallazgos pendientes

- [x] **4.1** — Sin `TODO`/`FIXME`/`HACK` olvidados en código fuente. Repo limpio en ese frente.

- [x] **4.2** — `.env.example` alineado tras resolver **1.2**.

- [x] **4.3** — No hay `appsettings.Production.json` en el repo (correcto: producción se configura 100% por variables de entorno de Container Apps). Sin hallazgo.

- [x] **4.4** — Scripts incrementales de BD ya indexados tras resolver **3.3**.

---

## Hallazgos adicionales detectados durante la ejecución (fuera del alcance original)

Notados al pasar, no forman parte de la auditoría original ni se aplicaron cambios — quedan para una futura revisión si se quiere:

- `IAdminAuditoriaService.cs` e `ICvAuditoriaService.cs` viven sueltos en `Interfaces/` en vez de en una subcarpeta (`Auth/`/`Privada/`), igual patrón que el resuelto en **1.5** para la entidad `AuditoriaCv`. Sus implementaciones (`AdminAuditoriaService.cs`, `CvAuditoriaService.cs`) tienen la misma situación en `Services/`.

---

## Resultado de la validación

- `dotnet build`: 0 advertencias, 0 errores.
- `dotnet test`: 40/40 OK.
- `ng lint`: 0 errores (mismos 18 warnings preexistentes).
- `ng test`: 621/621 OK.
- `ng build --configuration production`: OK.
