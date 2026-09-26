# Plan Basico de Backup y Mantenimiento

> El hosting de produccion es un VPS de Contabo (ver
> `docs/produccion/Plan-Trabajo-Produccion.md`), asi que las tareas de
> "Produccion" de abajo asumen una instancia MariaDB propia (self-managed,
> contenedor Docker en el mismo VPS) — no hay backups/PITR automaticos de
> un proveedor administrado.

## Objetivo

Definir una politica minima para proteger la base de datos `portalcv` (MariaDB) y mantener un rendimiento estable, diferenciando produccion de desarrollo local (contenedor `db` de `docker-compose.yml`).

## Alcance

| Aspecto | Produccion | Desarrollo local |
|---------|------------|------------------|
| **Motor** | MariaDB (contenedor propio en el VPS de Contabo) | MariaDB (`mariadb:11` via `docker-compose.yml`) |
| **Backups** | Programado por cron (`mariadb-dump` o `mariabackup`) — no hay backup automatico de proveedor | Manual u opcional |
| **Mantenimiento** | `OPTIMIZE TABLE` / `ANALYZE TABLE` | `OPTIMIZE TABLE` / `ANALYZE TABLE` |

---

## 1. Backups

### Produccion

- **Backup logico:** `mariadb-dump -u<usuario> -p portalcv > backup_$(date +%F).sql` (o `mariabackup` para un backup fisico/incremental en instancias mas grandes).
- **Point-in-time recovery:** requiere binary logging (`log_bin`) habilitado en el servidor; sin eso, solo se puede restaurar al ultimo backup completo.
- **Responsable de restauracion:** el lider tecnico es quien autoriza una restauracion.
- **Frecuencia sugerida:** diaria, retencion minima de 7 dias.

### Desarrollo local

- Backups solo son necesarios si se almacenan datos valiosos que no se regeneren con `database/01_CreateSchema.sql`.
- Si se requieren: `docker exec <contenedor_mariadb> mariadb-dump -uroot -p"$PASSWORD" portalcv > backup_local.sql`.
- **Retencion sugerida:** los ultimos 3 backups manuales, si es que se crean.

---

## 2. Mantenimiento de indices y tablas

Aplica tanto a produccion como a local.

- **Frecuencia:** mensual, o cuando se observe degradacion de consultas.
- **Comando:** `OPTIMIZE TABLE <tabla>;` (reconstruye la tabla InnoDB y sus indices, recupera espacio fragmentado).
- `OPTIMIZE TABLE` es seguro de correr periodicamente sobre las tablas con mas escritura/borrado (`AlertaVisita`, `AuditoriaCv`, `AuditoriaAuth`, `AuditoriaAdmin`).

---

## 3. Mantenimiento de estadisticas

- **Frecuencia:** mensual, junto con el mantenimiento de indices.
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
- **Comando:** `ANALYZE TABLE <tabla>;`

---

## 4. Validacion de recuperacion

### Produccion

- **Una vez al mes** restaurar el ultimo backup en una base temporal (`portalcv_restore_test`) y verificar que las consultas principales respondan.
- **Eliminar** la base de prueba despues de validar.

### Local

- Opcional. Si se mantienen backups manuales, restaurar al menos 1 vez al trimestre para verificar integridad del archivo `.sql`.

---

## 5. Calendario sugerido (produccion)

| Tarea | Frecuencia | Ventana |
|-------|------------|---------|
| Backup logico/fisico | Diario | Fuera de horario pico |
| Mantenimiento de indices y tablas | Mensual | Fin de semana |
| Actualizacion de estadisticas | Mensual | Junto al mantenimiento de indices |
| Prueba de restauracion | Mensual | Primer lunes del mes |

---

## 6. Responsables

- **Ejecucion tecnica** (scripts de mantenimiento, pruebas de restauracion): lider tecnico / DBA.
- **Revision mensual**: lider tecnico del proyecto.
- **Definicion y revision del plan**: lider tecnico.

---

## 7. Checklist minimo

### Produccion

- [ ] Backup automatizado (cron / job del hosting elegido) configurado y probado.
- [ ] Retencion de backups definida y documentada.
- [ ] Comando de mantenimiento de indices/tablas documentado.
- [ ] Comando de actualizacion de estadisticas documentado.
- [ ] Evidencia de prueba de restauracion mensual registrada.

### Local

- [ ] Script de backup manual conocido por el desarrollador (si aplica).
- [ ] Repoblacion desde `database/01_CreateSchema.sql` validada como alternativa rapida a restaurar.
