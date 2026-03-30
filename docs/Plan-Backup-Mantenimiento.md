# Plan Basico de Backup y Mantenimiento

## Objetivo
Definir una politica minima para proteger la base de datos PortalCV y mantener un rendimiento estable.

## Alcance
- Base de datos: PortalCV
- Motor: SQL Server 2016+
- Entorno: aplicar en desarrollo y produccion con la misma logica

## Frecuencia de Backups
1. Backup Full: diario a las 02:00 AM.
2. Backup Log: cada 30 minutos (solo si la base esta en Recovery Model FULL).

## Retencion
1. Conservar backups por 14 dias.
2. Eliminar automaticamente archivos mas antiguos a 14 dias.

## Mantenimiento de Indices
1. Ejecutar 1 vez por semana (domingo 03:00 AM).
2. Regla simple:
   - Fragmentacion entre 5% y 30%: REORGANIZE.
   - Fragmentacion mayor a 30%: REBUILD.

## Mantenimiento de Estadisticas
1. Ejecutar 1 vez por semana (domingo 04:00 AM).
2. Actualizar estadisticas de tablas principales:
   - Curriculum
   - Personales
   - Habilidad
   - Experiencia
   - Formacion

## Validacion de Recuperacion
1. Realizar una prueba de restauracion 1 vez al mes en ambiente no productivo.
2. Verificar que la base restaura y que las consultas principales responden.

## Calendario Sugerido
- Diario 02:00 AM: Backup Full.
- Cada 30 min: Backup Log (si FULL).
- Domingo 03:00 AM: Mantenimiento de indices.
- Domingo 04:00 AM: Actualizacion de estadisticas.
- Primer lunes de cada mes: prueba de restauracion.

## Responsables
- Ejecucion tecnica: DevOps / DBA.
- Revision mensual: lider tecnico del proyecto.

## Checklist Minimo
- Job de backup full creado.
- Job de backup log creado (si aplica).
- Politica de retencion configurada.
- Job de indices creado.
- Job de estadisticas creado.
- Evidencia de restauracion mensual registrada.
