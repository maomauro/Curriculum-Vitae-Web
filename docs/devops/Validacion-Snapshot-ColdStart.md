# Validación operativa - Snapshot JSON en cold start

## Objetivo

Validar en ambiente (idealmente staging) que:

1. Cuando la DB no está lista, frontend usa snapshot temporal.
2. Cuando la DB vuelve, frontend conmuta a datos oficiales.
3. El snapshot dinámico backend (`/api/public/snapshot`) se refresca automáticamente.

---

## Requisitos previos

- API desplegada con el commit que incluye `PublicSnapshotService`.
- Frontend desplegado con fallback dinámico + estático.
- Endpoint de readiness activo:
  - `GET /health/ready`
- Endpoint de snapshot activo:
  - `GET /api/public/snapshot`

---

## Comandos de verificación rápida (smoke)

> Reemplaza `<API_BASE_URL>` con tu URL real de API.

```bash
curl -i "<API_BASE_URL>/health"
curl -i "<API_BASE_URL>/health/ready"
curl -i "<API_BASE_URL>/api/public/snapshot"
curl -i "<API_BASE_URL>/api/public/cvs?page=1&pageSize=5"
```

Esperado:

- `/health` = `200 Healthy`.
- `/health/ready` = `200 Healthy` cuando DB está lista (de lo contrario status no-OK).
- `/api/public/snapshot` = `200` + JSON con:
  - `generatedAtUtc`
  - `sourceVersion`
  - `items[]`

---

## Escenario A - DB no lista (cold start)

## Pasos

1. Forzar estado de inactividad/cold start de DB (según política del plan).
2. Abrir frontend en modo incógnito.
3. Entrar a:
   - `/cvs`
   - `/cv/<slug-existente>`
4. Observar el comportamiento mientras readiness no está en `Healthy`.

## Resultado esperado

- Se muestra contenido temporal (snapshot) sin pantalla vacía.
- Aparece aviso:
  - "Mostrando datos temporales..." en listado
  - "Vista temporal..." en detalle
- No hay error fatal de UI.

---

## Escenario B - DB recupera disponibilidad

## Pasos

1. Con la página abierta del escenario A, esperar a que DB recupere.
2. Verificar con:
   - `GET /health/ready`
3. Disparar interacción de revalidación:
   - en `/cvs`: cambiar filtro o paginar
   - en `/cv/<slug>`: usar botón "Reintentar" o refrescar vista

## Resultado esperado

- Frontend reemplaza datos temporales por oficiales de API.
- Desaparece el estado/aviso de snapshot.
- Navegación continúa estable.

---

## Escenario C - refresco automático de snapshot backend

## Pasos

1. Llamar y guardar `generatedAtUtc` de `/api/public/snapshot`.
2. Esperar más de `PublicSnapshot:RefreshIntervalMinutes` (default 10 min).
3. Consultar de nuevo `/api/public/snapshot`.

## Resultado esperado

- `generatedAtUtc` cambia (más reciente) cuando DB estuvo lista.
- `itemsCount` (derivado de `items.length`) consistente con CVs publicados.
- Si DB estuvo caída en todo el intervalo, snapshot se conserva (no se corrompe).

---

## Checklist QA (aceptación funcional)

- [ ] `/cvs` muestra snapshot temporal en cold start.
- [ ] `/cv/:slug` muestra snapshot temporal en cold start (si slug existe en snapshot).
- [ ] En recuperación de DB, UI conmuta a datos oficiales.
- [ ] `/api/public/snapshot` responde JSON válido.
- [ ] No se exponen campos privados en snapshot.
- [ ] No hay errores JS bloqueantes en consola.

---

## Observaciones de operación

- El build local de backend puede fallar si `PortalCV.Api.exe` está corriendo y bloquea dlls; no es fallo funcional del código.
- Para diagnósticos, revisar logs del servicio de snapshot:
  - inicio de ciclo
  - DB no disponible
  - snapshot actualizado con N ítems

