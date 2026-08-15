# Estado actual del proyecto (corte 2026-08-07)

## Objetivo de este documento

Consolidar en un solo lugar el estado real del proyecto para retomar trabajo sin ambiguedades entre documentos historicos y estado actual del codigo.

---

## Evidencias revisadas

- Rama actual observada: `feat/frontend`.
- Historial reciente: commits orientados a frontend, cobertura, Sonar y flujo de auditoria/snapshot.
- Checklist de produccion: `docs/devops/Checklist-Produccion.md`.
- Plan historico de salida: `docs/produccion/Plan-Trabajo-Produccion.md`.
- Documentacion tecnica backend/frontend: `backend/README.md`, `frontend/README.md`.

---

## Estado consolidado

### Lo que esta avanzado

- API .NET por capas operativa con JWT, CORS por entorno, Swagger en Development y health checks.
- Frontend Angular con zonas publica, privada y admin ya integradas.
- CI con build/test y verificacion de calidad (SonarCloud) integrada.
- Flujo de snapshot publico/cold start con endpoints de admin y consumo en frontend.

### Lo que falta para cerrar salida a produccion

- Ejecutar smoke test funcional completo en entorno real.
- Confirmar estrategia operativa de rollback (pasos, responsables, validacion).
- Cerrar pendientes de seguridad/configuracion:
  - JWT productivo y politica de rotacion documentada.
  - Decision sobre usuario demo en produccion.
  - Politica de backup/retencion formalizada.
  - Revisión de `AllowedHosts` (si se requiere endurecimiento).
- Verificar observabilidad operativa (logs utiles durante incidencia real).

---

## Inconsistencias detectadas en documentacion

- Hay documentos DevOps con estados antiguos marcados como "pendiente" para recursos que luego aparecen como operativos en el plan de produccion.
- El plan de produccion mantiene fecha de corte anterior (2026-04-23), por lo que debe leerse como historico y no como corte vigente.

Accion aplicada:
- Se agrega este documento como referencia vigente de corte 2026-08-07.
- Se agregan referencias en checklist y plan para evitar interpretaciones conflictivas.

---

## Priorizacion sugerida para retomar hoy

1. Ejecutar smoke test de produccion con checklist reproducible.
2. Resolver hallazgos del smoke test y dejar evidencia.
3. Cerrar hardening minimo pendiente (errores frontend, expiracion de token, validaciones DTO criticos).
4. Probar rollback en ventana controlada.
5. Definir corte de salida final.

---

## Definicion de "listo para salir"

- Smoke test funcional completo en verde.
- Rollback probado en practica.
- Configuracion de seguridad minima cerrada.
- Evidencia de observabilidad disponible para operacion.
- Aprobacion final del equipo.
