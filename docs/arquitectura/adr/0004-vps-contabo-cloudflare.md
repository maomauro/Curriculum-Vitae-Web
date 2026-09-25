# ADR-0004: Hosting de producción — VPS de Contabo + Cloudflare en vez de cloud gestionado

## Estado

Aceptada.

## Contexto

El proyecto necesita decidir dónde y cómo correr en producción: backend (.NET 10 en
contenedor Docker), frontend (build estático de Angular) y MariaDB. Las categorías de
hosting disponibles para un proyecto de este tamaño (un desarrollador, sin equipo de
plataforma dedicado) son, a grandes rasgos:

- **PaaS / cloud gestionado** (contenedores gestionados + hosting estático gestionado + base
  de datos gestionada de un proveedor cloud): autoscaling, alta disponibilidad y backups
  gestionados de fábrica, a cambio de costo variable atado al uso y menos control directo
  sobre el entorno de ejecución.
- **VPS propio** (una sola instancia de servidor, administrada a mano o con Docker Compose):
  costo fijo y predecible, control total del entorno, pero sin autoscaling ni alta
  disponibilidad de fábrica — hay que operarlo uno mismo (backups, parches, monitoreo).

Detalle real elegido: Contabo Cloud VPS 6 (Hub Europe) + Cloudflare como DNS/proxy del
dominio (`sitiosapps.com`) — ver `docs/produccion/Plan-Trabajo-Produccion.md` para el plan de
salida a producción completo.

## Decisión

Se usa un **VPS de Contabo** para correr el backend y MariaDB en contenedores Docker
(`docker-compose.yml` en producción), con el frontend servido como build estático detrás de
un reverse proxy Nginx en el mismo VPS, y **Cloudflare** como capa de DNS/proxy/TLS del
dominio.

La razón principal es de costo y tamaño de proyecto: un VPS de costo fijo y bajo es
suficiente para el tráfico esperado, y evita la complejidad operativa y el costo variable de
un stack de PaaS gestionado (varios servicios distintos: contenedores, hosting estático, base
de datos) para un proyecto sin equipo de plataforma. Cloudflare cubre gratis la parte que un
PaaS gestionado hubiera dado de fábrica (TLS, protección básica DDoS, DNS), reduciendo la
brecha de disponibilidad frente a una solución 100% gestionada.

## Alternativas consideradas

- **PaaS / cloud gestionado** (contenedores gestionados + hosting estático + base de datos
  gestionada, de cualquier proveedor cloud) — descartado para esta etapa del proyecto: el
  costo variable y la cantidad de servicios distintos a configurar y mantener no se justifican
  para el volumen de tráfico actual ni para un equipo de un solo desarrollador. Revisar esta
  decisión si el tráfico o el equipo crecen lo suficiente como para que el costo operativo de
  automatizar backups/monitoreo/alta disponibilidad en el VPS supere el costo de un PaaS
  gestionado.
- **Otro proveedor de VPS** (no evaluado a fondo) — Contabo se eligió directamente por costo;
  no hay una comparación formal documentada contra otros proveedores de VPS.

## Consecuencias

- La disponibilidad, los backups (`docs/devops/Plan-Backup-Mantenimiento.md`) y el
  mantenimiento de MariaDB (parches, `OPTIMIZE`/`ANALYZE TABLE`) son responsabilidad propia,
  no de un proveedor gestionado — no hay backups/PITR automáticos de fábrica.
- No hay autoscaling: un pico de tráfico por encima de la capacidad del VPS elegido requiere
  una migración manual a un plan mayor, no un ajuste automático.
- No hay infraestructura como código (Terraform o equivalente) todavía describiendo este VPS
  ni la configuración de Cloudflare — la topología de producción se documenta en
  `docs/produccion/Plan-Trabajo-Produccion.md`, pero se administra a mano. Evaluar IaC si el
  entorno de producción crece en complejidad o si hace falta reproducirlo rápido ante un
  incidente.

## Referencias

- `docs/produccion/Plan-Trabajo-Produccion.md`
- `docs/devops/Plan-Backup-Mantenimiento.md`
