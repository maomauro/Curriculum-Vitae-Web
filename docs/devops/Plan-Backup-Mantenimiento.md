# Plan Basico de Backup y Mantenimiento

## Objetivo

Definir una politica minima para proteger la base de datos `PortalCV` y mantener un rendimiento estable, diferenciando claramente produccion (servicio administrado en Azure) de desarrollo local (instancia propia).

## Alcance

| Aspecto | Produccion | Desarrollo local |
|---------|------------|------------------|
| **Motor** | Azure SQL Database Free Tier (`sql-portalcv-mao.database.windows.net`) | SQL Server instalado nativo (instancia `SQLEXPRESS`) |
| **Backups** | Automaticos (PITR administrado por Azure) | Manual u opcional |
| **Mantenimiento** | Aplicado por el equipo via T-SQL | Aplicado por el equipo via T-SQL |

> Produccion es un servicio administrado: Azure gestiona los backups automaticamente y permite restaurar a un punto en el tiempo (PITR). En local el respaldo es responsabilidad del desarrollador y solo es critico si existe informacion que no se pueda regenerar.

---

## 1. Backups

### Produccion (Azure SQL)

- **Backups automaticos:** Azure SQL realiza backups completos, diferenciales y de log de forma continua.
- **Point-in-Time Restore (PITR):** retencion minima de 7 dias en el tier Free.
- **Restore geografico:** depende del tier; verificar en portal Azure antes de asumirlo.
- **Responsable de restauracion:** el lider tecnico es quien autoriza una restauracion.
- **No se requiere ejecutar jobs manuales de backup.**

### Desarrollo local (SQL Server instalado)

- Backups solo son necesarios si se almacenan datos valiosos que no se regeneren con `scripts/manual/02_InsertTestData.sql`.
- Si se requieren, ejecutar manualmente con SSMS o `BACKUP DATABASE PortalCV TO DISK = '...'`.
- **Retencion sugerida:** los ultimos 3 backups manuales, si es que se crean.

---

## 2. Mantenimiento de indices

Aplica tanto a produccion como a local.

- **Frecuencia:** semanal (domingo 03:00 AM en produccion; en local, cuando se observe degradacion).
- **Regla simple:**
  - Fragmentacion entre 5% y 30%: `ALTER INDEX ... REORGANIZE`.
  - Fragmentacion mayor a 30%: `ALTER INDEX ... REBUILD`.
- **Como ejecutar en Azure SQL:** script T-SQL planificado con Elastic Jobs o una ejecucion manual desde Azure Data Studio/Portal.
- **Como ejecutar en local:** ejecutar el mismo script en SSMS.

---

## 3. Mantenimiento de estadisticas

- **Frecuencia:** semanal (domingo 04:00 AM en produccion).
- **Alcance:** actualizar estadisticas de las tablas con mayor rotacion:
  - `Curriculum`
  - `Personales`
  - `Perfil`
  - `Experiencia`
  - `Formacion`
  - `Habilidad`
  - `Proyecto`
  - `AlertaVisita`
  - `EstadisticasPublicas`
- **Comando:** `UPDATE STATISTICS <tabla>` o `EXEC sp_updatestats`.

---

## 4. Validacion de recuperacion

### Produccion

- **Una vez al mes** realizar una prueba de PITR a una base temporal (`PortalCV-restore-test`) y verificar que las consultas principales respondan.
- **Eliminar** la base de prueba despues de validar.

### Local

- Opcional. Si se mantienen backups manuales, restaurar al menos 1 vez al trimestre para verificar integridad del archivo `.bak`.

---

## 5. Calendario sugerido (produccion)

| Tarea | Frecuencia | Ventana |
|-------|------------|---------|
| PITR automatico | Continuo | Administrado por Azure |
| Mantenimiento de indices | Semanal | Domingo 03:00 AM |
| Actualizacion de estadisticas | Semanal | Domingo 04:00 AM |
| Prueba de restauracion | Mensual | Primer lunes del mes |

---

## 6. Responsables

- **Ejecucion tecnica** (scripts de mantenimiento, pruebas de restauracion): lider tecnico / DBA.
- **Revision mensual**: lider tecnico del proyecto.
- **Definicion y revision del plan**: lider tecnico.

---

## 7. Checklist minimo

### Produccion

- [ ] PITR activo en Azure SQL (por defecto lo esta; verificar en el portal).
- [ ] Retencion de PITR configurada segun el tier.
- [ ] Script de mantenimiento de indices documentado.
- [ ] Script de actualizacion de estadisticas documentado.
- [ ] Evidencia de prueba de restauracion mensual registrada.

### Local

- [ ] Script de backup manual conocido por el desarrollador (si aplica).
- [ ] Repoblacion desde `scripts/manual/` validada como alternativa rapida a restaurar.
