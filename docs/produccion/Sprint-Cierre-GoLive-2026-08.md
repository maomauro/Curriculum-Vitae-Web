# Sprint de cierre go-live (propuesta)

Horizonte sugerido: 1 sprint corto (5 a 7 dias habiles).

## Objetivo

Cerrar pendientes de salida a produccion con evidencia tecnica y operativa.

## Backlog del sprint

| Item | Tipo | Prioridad | Entregable | DoD |
|---|---|---|---|---|
| SG-01 | QA/Operacion | Alta | Smoke test ejecutado | `docs/devops/Smoke-Test-Produccion.md` completo con evidencia |
| SG-02 | Seguridad | Alta | JWT y demo user cerrados | Politica JWT documentada + decision demo user aplicada |
| SG-03 | Backend | Alta | Validaciones DTO criticos | Validaciones declarativas en endpoints criticos y pruebas basicas |
| SG-04 | Frontend | Alta | Hardening de errores | Manejo consistente de status 0/4xx/5xx y expiracion token |
| SG-05 | Operacion | Alta | Rollback probado | Procedimiento ejecutado en entorno controlado y documentado |
| SG-06 | Documentacion | Media | Estado unificado | Referencias alineadas entre plan/checklist/estado actual |

## Dependencias

- Acceso al entorno productivo.
- Ventana para prueba de rollback.
- Credenciales operativas de Azure/GitHub.

## Riesgos

- Falta de ventana de prueba para rollback.
- Hallazgos funcionales tardios durante smoke test.
- Desalineacion entre cambios y evidencia documental.

## Salida del sprint

- Aprobacion de go-live o lista corta de bloqueantes con responsable y fecha.
