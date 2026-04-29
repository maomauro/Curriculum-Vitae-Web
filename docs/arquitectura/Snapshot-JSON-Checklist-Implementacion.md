# Checklist de Implementacion - Snapshot JSON Automatico

## Objetivo operativo

Mostrar CVs publicas y dashboard publico desde un snapshot temporal cuando la DB este en cold start, y reemplazar automaticamente por datos oficiales cuando la API/DB este lista.

---

## Alcance v1

- Solo datos **publicos**.
- Un archivo snapshot unico (`public-cvs-snapshot.json`).
- Actualizacion **automatica** server-side.
- Frontend con estrategia **snapshot-first + revalidacion**.

---

## Fase 0 - Definiciones funcionales (bloqueante)

- [ ] Definir campos publicos incluidos por CV (listado + detalle + dashboard publico minimo).
- [ ] Definir tolerancia de frescura (`stale`) para negocio (ejemplo: 30 min, 60 min).
- [ ] Definir mensaje UX para estado temporal:
  - [ ] "Mostrando datos temporales"
  - [ ] "Ultima actualizacion: {fecha}"
- [ ] Definir regla cuando no exista snapshot para slug:
  - [ ] Skeleton + reintento
  - [ ] Mensaje de servicio despertando

---

## Fase 1 - Storage de snapshot

- [ ] Crear contenedor Blob para snapshots (lectura publica o via CDN/Front Door).
- [ ] Definir nombre estable del archivo:
  - [ ] `public-cvs-snapshot.json`
- [ ] Definir metadata adicional:
  - [ ] `generatedAtUtc`
  - [ ] `sourceVersion`
  - [ ] `itemsCount`
- [ ] Definir `Cache-Control` (ejemplo: `public, max-age=300`).

---

## Fase 2 - Generacion automatica (server-side)

- [ ] Crear proceso automatico (recomendado v1):
  - [ ] Azure Function Timer **o**
  - [ ] Worker en ACA con cron
- [ ] Flujo del proceso:
  - [ ] Consultar `/health/ready`
  - [ ] Si not ready -> terminar sin sobreescribir snapshot vigente
  - [ ] Si ready -> consultar datos publicos en API/DB
  - [ ] Serializar JSON con esquema definido
  - [ ] Subir blob atomico (replace completo)
- [ ] Agregar logs y metricas minimas:
  - [ ] Ultimo intento
  - [ ] Ultima actualizacion exitosa
  - [ ] Duracion de export
  - [ ] Errores de export/publicacion

---

## Fase 3 - Endpoint de export (si aplica en API)

- [ ] Definir mecanismo de export:
  - [ ] Query directa desde Function a DB, o
  - [ ] Endpoint interno de API para export snapshot
- [ ] Si es endpoint API:
  - [ ] Proteger con secreto/clave interna (no publico)
  - [ ] Limitar tasa y acceso por red/origen
  - [ ] Incluir contrato versionado del payload
- [ ] Validar que no salgan campos privados/sensibles.

---

## Fase 4 - Frontend (snapshot-first + revalidate)

- [ ] Crear servicio frontend para snapshot:
  - [ ] `getSnapshotList()`
  - [ ] `getSnapshotBySlug(slug)`
  - [ ] `isSnapshotStale(generatedAtUtc)`
- [ ] Integrar en vista de busqueda:
  - [ ] Cargar snapshot primero
  - [ ] Render inmediato de tarjetas
  - [ ] Revalidar contra API oficial en paralelo
  - [ ] Reemplazar datos al llegar API
- [ ] Integrar en vista publica de detalle CV (`/cv/:slug`):
  - [ ] Cargar snapshot por slug primero
  - [ ] Revalidar contra API
  - [ ] Si API falla y snapshot existe -> mantener snapshot + aviso
- [ ] Integrar en dashboard publico:
  - [ ] Mostrar dataset temporal si DB no lista
  - [ ] Reemplazar por oficial cuando API responda
- [ ] Mostrar badge/UI temporal consistente en las tres vistas.

---

## Fase 5 - Observabilidad y operacion

- [ ] Dashboard operativo con:
  - [ ] Timestamp ultimo snapshot exitoso
  - [ ] Edad actual del snapshot
  - [ ] Exitos/fallos de jobs por dia
- [ ] Alertas:
  - [ ] Si snapshot supera umbral de antiguedad (ejemplo 6h/12h)
  - [ ] Si N fallos consecutivos de export
- [ ] Runbook:
  - [ ] Como forzar un refresh automatico sin editar codigo
  - [ ] Como validar contenido publicado
  - [ ] Como rollbackear a ultimo snapshot valido

---

## Fase 6 - Seguridad y cumplimiento

- [ ] Revisar politica de datos publicos permitidos.
- [ ] Excluir PII o campos no destinados a publico.
- [ ] Validar CORS y origenes permitidos para consumo frontend.
- [ ] Guardar secretos de escritura en Key Vault / Managed Identity.

---

## Fase 7 - Pruebas y criterios de aceptacion

### Pruebas tecnicas
- [ ] Caso A: DB no lista -> frontend muestra snapshot sin pantalla vacia.
- [ ] Caso B: DB lista despues -> frontend reemplaza por datos oficiales.
- [ ] Caso C: sin snapshot para slug -> skeleton + mensaje de espera.
- [ ] Caso D: snapshot viejo -> badge visible + reintentos API.

### Criterios de aceptacion funcional
- [ ] Visitante abre `/buscar` sin esperar cold start para ver contenido base.
- [ ] Visitante abre `/cv/:slug` y recibe contenido temporal si existe snapshot.
- [ ] Dashboard publico muestra datos temporales mientras API no responde.
- [ ] Al recuperar DB, los datos oficiales reemplazan automaticamente los temporales.

---

## Orden recomendado de ejecucion

1. Fase 0 (definiciones)  
2. Fase 1 + 2 (snapshot en Blob y generacion automatica)  
3. Fase 4 (frontend snapshot-first)  
4. Fase 5 + 6 (operacion/seguridad)  
5. Fase 7 (validacion final)

---

## Nota de costos (objetivo gratuito)

Esta estrategia ayuda a reducir la friccion del cold start y puede operar en capas gratuitas con bajo volumen, pero "costo cero garantizado" depende de consumo real y limites de los servicios (Storage, ejecuciones del job, trafico).

