# Checklist de Implementación - Snapshot JSON (estado actual)

## Objetivo operativo

Mostrar CVs públicos y detalle público desde snapshot temporal cuando la API/DB no responde, y reemplazar por datos oficiales cuando el backend esté disponible.

---

## Alcance vigente

- Solo datos **públicos**.
- Archivo estático en frontend: `public/snapshots/public-cvs-snapshot.json`.
- Export por CV en base de datos: `PublicCvSnapshotExport`.
- Estado global de sincronización: `PublicStaticSnapshotState`.
- Frontend con estrategia **snapshot-first + revalidación**.

---

## Checklist funcional

- [x] Definidos campos públicos para listado/detalle.
- [x] Mensaje UX discreto para estado temporal y en vivo.
- [x] Regla de fallback cuando no hay respuesta de API.

---

## Checklist backend / datos

- [x] Tabla `PublicCvSnapshotExport` creada.
- [x] Tabla `PublicStaticSnapshotState` creada.
- [x] Refresh del export por cambios del CV.
- [x] Consolidado público filtrado por `Publicado + Usuario activo`.
- [x] Endpoints admin:
  - [x] `GET /api/admin/public-cv-snapshot/pending`
  - [x] `GET /api/admin/public-cv-snapshot/preview`
  - [x] `GET /api/admin/public-cv-snapshot/download`
  - [x] `POST /api/admin/public-cv-snapshot/ack`

---

## Checklist frontend

- [x] Fallback estático desde `/snapshots/public-cvs-snapshot.json`.
- [x] Revalidación en paralelo contra `/api/public/snapshot` y endpoints públicos.
- [x] Indicador visual coherente:
  - [x] verde para datos en vivo;
  - [x] ámbar para snapshot temporal.

---

## Checklist operación

- [x] Banner admin de stale para gestionar actualización del archivo estático.
- [x] Preview del JSON consolidado antes de descargar.
- [x] Confirmación de ack tras publicar snapshot estático.

---

## Checklist local/dev

- [x] Proxy frontend reenvía `/api` y `/health`.
- [x] Auth muestra aviso de “servicio iniciando” cuando readiness no está listo.
- [x] Modal global de bienvenida desactivado para visitante público.

---

## Pendientes opcionales

- [ ] Automatizar commit/deploy del snapshot estático (actualmente el paso es manual via admin + repositorio).
- [ ] Métricas operativas de edad del snapshot y frecuencia de actualización.

---

## Seguridad y cumplimiento

- [x] Snapshot limitado a datos públicos.
- [x] Visibilidad final controlada por estado de curriculum + estado de usuario en consolidado.

---

## Pruebas clave (aceptación)

- [x] API caída/no lista -> frontend mantiene contenido temporal desde snapshot estático.
- [x] API disponible -> frontend muestra datos en vivo.
- [x] Publicado/Borrador no filtra por error en archivo público consolidado (solo se exporta publicado+activo).

