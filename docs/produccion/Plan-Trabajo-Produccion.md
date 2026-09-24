# Plan de Trabajo para Salida a Produccion — PortalCV

Estado del plan: En definicion de infraestructura
Fecha de este corte: 2026-09-23
Rama de trabajo actual: `feature/portal-cv-mejoras-adjuntos-ia` (PR abierto hacia `main`)

---

## Objetivo

Publicar PortalCV en un VPS de Contabo, con Cloudflare administrando el DNS
y el subdominio publico, con riesgo controlado: seguridad minima, CI/CD
reproducible, base de datos persistente con backups, y validacion funcional
completa antes de exponerlo a usuarios reales.

---

## Infraestructura decidida

| Componente | Decision |
|---|---|
| **Hosting (backend + frontend + BD)** | VPS de Contabo — Cloud VPS 6 (2026), ubicacion Hub Europe, IP `13.140.188.159`, acceso root vía SSH |
| **DNS / proxy / TLS de borde** | Cloudflare, dominio `sitiosapps.com` (gestionado en `dash.cloudflare.com`) |
| **Subdominio publico** | Pendiente de elegir (ej. `portalcv.sitiosapps.com` o `cv.sitiosapps.com`) — un unico subdominio para frontend + API (ver "Decision de arquitectura" abajo) |
| **Motor de base de datos** | MariaDB (`mariadb:11`), contenedor Docker en el mismo VPS, volumen persistente |
| **Imagen del backend** | Publicada a GHCR por CI (`.github/workflows/publish-backend-image.yml`, ya activo) |
| **Reverse proxy / TLS de origen** | Nginx (o Caddy) en el VPS, delante de backend + build estatico del frontend |

### Decision de arquitectura: un solo origen (subdominio unico)

Frontend y backend quedan detras del **mismo subdominio**: el reverse proxy
del VPS enruta por path — `/api/*` (y `/health`) hacia el contenedor del
backend, todo lo demas hacia los archivos estaticos de Angular. Es el mismo
esquema que ya usa `ng serve` en local (proxy a `/api`), solo que en
produccion lo hace Nginx en vez del dev-server de Angular.

Esta decision resuelve de una vez varios puntos que quedarian abiertos con
dos subdominios separados (`api.` / `app.`):
- El frontend sigue usando las rutas relativas `/api` que ya tiene hoy — no
  hace falta crear `src/environments/environment.prod.ts` ni bakear una URL
  absoluta del backend en el build.
- La cookie JWT (`portalcv_auth`) puede usar `SameSite=Lax` en vez de
  `SameSite=None` (mismo origen), mas simple y mas segura.
- No hay CORS cross-origin que configurar entre frontend y backend (si sigue
  existiendo `Cors:AllowedOrigins`, pero apuntando al mismo dominio).

No se necesita `appsettings.Production.json`: toda la configuracion de
produccion (`Cors:AllowedOrigins`, `Jwt:Key`, `Encryption:Key`,
`ConnectionStrings:DefaultConnection`) se inyecta por variables de entorno,
que ASP.NET Core lee automaticamente con `ASPNETCORE_ENVIRONMENT=Production`.

---

## Tablero de trabajo (checklist por fases)

### Fase 0 — Decisiones a cerrar antes de tocar el servidor

- [ ] Elegir el subdominio exacto en Cloudflare (ej. `portalcv.sitiosapps.com`)
- [ ] Elegir el modo SSL/TLS de Cloudflare: **Full (strict)** recomendado —
  requiere certificado valido en el origen (Let's Encrypt en el VPS, o el
  certificado de origen que emite el propio Cloudflare)
- [ ] Confirmar el sistema operativo del VPS entregado por Contabo (para
  saber el gestor de paquetes al instalar Docker)

### Fase 1 — Preparacion del servidor (Contabo VPS)

- [ ] Hardening SSH: crear usuario no-root para operar; deshabilitar login
  de `root` por password; acceso solo por llave SSH
  - Criterio de cierre: `ssh root@<ip>` con password ya no funciona
- [ ] Firewall (`ufw` o equivalente): permitir SSH (puerto propio si se
  cambia el 22 por defecto) y 80/443; si se usa el proxy naranja de
  Cloudflare, restringir 80/443 solo a los rangos de IP de Cloudflare
  - Criterio de cierre: `ufw status` muestra solo los puertos necesarios
- [ ] Instalar `fail2ban` (mitiga fuerza bruta sobre SSH)
- [ ] Instalar Docker Engine + Docker Compose plugin
  - Criterio de cierre: `docker compose version` funciona sin `sudo`
    (usuario en el grupo `docker`)

### Fase 2 — DNS y Cloudflare

- [ ] Crear el registro `A` del subdominio elegido apuntando a
  `13.140.188.159`
- [ ] Activar el proxy de Cloudflare (nube naranja) sobre ese registro
- [ ] Configurar el modo SSL/TLS elegido en Fase 0
- [ ] Si es Full (strict): generar el certificado de origen de Cloudflare
  (o emitir uno con Let's Encrypt/`certbot` en el VPS) e instalarlo en Nginx

### Fase 3 — Contenerizacion de produccion (falta crear, hoy no existe)

- [ ] Crear `frontend/Dockerfile` de produccion (build multi-stage: `ng
  build --configuration production` -> imagen Nginx sirviendo `dist/`
  con fallback SPA a `index.html`)
  - Hoy solo existe `frontend/Dockerfile.dev`, pensado unicamente para
    desarrollo local con `ng serve`
- [ ] Crear un `docker-compose` de produccion (archivo nuevo, ej.
  `docker-compose.prod.yml`) con 3 servicios:
  - `db`: `mariadb:11` con volumen nombrado persistente (mismo patron que
    el compose de desarrollo, pero sin exponer el puerto 3306 al exterior)
  - `backend`: imagen publicada en GHCR (no build local) +
    `backend/Dockerfile` de produccion (ya existe, multi-stage, ya endurecido)
  - `nginx`: sirve el build de Angular y hace proxy de `/api`+`/health`
    hacia `backend`
- [ ] Una vez que el Nginx de produccion exista: restringir
  `KnownProxies`/`KnownIPNetworks` de `ForwardedHeadersOptions` en
  `Program.cs` a la IP/red real de ese Nginx, en vez de confiar en cualquier
  origen
  - Criterio de cierre: `docker compose -f docker-compose.prod.yml up -d`
    levanta los 3 servicios sanos en el VPS

### Fase 4 — Base de datos en produccion

- [ ] Levantar el contenedor MariaDB en el VPS con volumen persistente
- [ ] Ejecutar `database/01_CreateSchema.sql` contra la base nueva (arranca
  vacia; no se migran datos de desarrollo/local)
- [ ] Automatizar backup diario (`mariadb-dump` o `mariabackup`) via cron —
  procedimiento ya documentado en `docs/devops/Plan-Backup-Mantenimiento.md`
  - Criterio de cierre: existe al menos un backup automatico verificado

### Fase 5 — Secretos y configuracion del backend

- [ ] Generar `Jwt:Key` (>= 32 caracteres) y `Encryption:Key` (AES-256
  base64) de produccion, **distintos** a los de local
- [ ] `ConnectionStrings:DefaultConnection` apuntando al MariaDB del VPS
  (usuario de aplicacion con permisos minimos, no `root`)
- [ ] `Cors:AllowedOrigins__0` con el subdominio real elegido en Fase 0
- [ ] `ASPNETCORE_ENVIRONMENT=Production`
- [ ] Decidir si `Auth:DemoUser` se deshabilita en produccion
- [ ] Archivo de secretos en el VPS (`env_file` del compose de produccion),
  nunca versionado en git — mismo criterio que `docker/backend.local.env`

### Fase 6 — CI/CD: automatizar el despliegue

- [ ] Ya activo: build + test + publicacion de imagen backend a GHCR
  (`.github/workflows/publish-backend-image.yml`)
- [ ] Nuevo job de deploy backend: conexion SSH al VPS y
  `docker compose -f docker-compose.prod.yml pull && ... up -d` (secret
  `SSH_PRIVATE_KEY`/`SSH_HOST` en GitHub Actions)
- [ ] Nuevo job de deploy frontend: `ng build --configuration production`
  en CI y copiar el resultado al VPS (o construir la imagen Nginx del
  Fase 3 y desplegarla igual que el backend)
  - Criterio de cierre: un merge a `main` termina publicado en el VPS sin
    pasos manuales

### Fase 7 — Validacion y go-live

- [ ] Smoke test funcional completo contra el dominio real: login,
  dashboard, CV publico, hoja de vida, contacto, alertas, panel privado
- [ ] Verificar que el certificado HTTPS es valido (sin warnings de
  navegador) y que la cookie JWT se guarda/envia correctamente
- [ ] Verificar `Cors:AllowedOrigins` no bloquea nada real (con el esquema
  de un solo origen, no deberia hacer falta CORS cross-site)
- [ ] Definir rollback rapido: mantener el tag de imagen backend anterior
  en GHCR + version anterior del build de frontend en el VPS
- [ ] Monitoreo basico de uptime (Cloudflare o un servicio externo tipo
  UptimeRobot — no hay equivalente al "log stream" de un PaaS en un VPS
  propio, asi que esto sustituye esa visibilidad)

---

## Checklist operativo por componente

### VPS Contabo

- [ ] SSH endurecido (sin password, usuario no-root)
- [ ] Firewall activo
- [ ] Docker + Docker Compose instalados
- [ ] `docker-compose.prod.yml` corriendo los 3 servicios

### Cloudflare

- [ ] Registro `A` del subdominio creado y proxied
- [ ] Modo SSL/TLS configurado
- [ ] Certificado de origen instalado en Nginx (si Full strict)

### MariaDB

- [ ] Contenedor con volumen persistente
- [ ] Esquema aplicado (`01_CreateSchema.sql`)
- [ ] Backup automatico configurado y probado

### Backend / Frontend

- [ ] Secretos de produccion cargados (distintos a local)
- [ ] `Cors:AllowedOrigins` con el dominio real
- [ ] Imagen backend en GHCR desplegandose por CI
- [ ] Imagen/artefacto frontend desplegandose por CI

---

## Riesgos principales y mitigacion

- Riesgo: exponer el VPS con SSH por password o root abierto
  - Mitigacion: Fase 1 (llave SSH, sin root, fail2ban) antes de cualquier otra cosa
- Riesgo: perder datos de MariaDB por no tener backup automatizado
  - Mitigacion: Fase 4, backup diario verificado antes del go-live
- Riesgo: secretos de produccion iguales a los de desarrollo
  - Mitigacion: generar `Jwt:Key`/`Encryption:Key` nuevos, nunca reusar los locales
- Riesgo: certificado HTTPS invalido o modo SSL de Cloudflare mal elegido
  - Mitigacion: probar el dominio real en un navegador antes de anunciar el go-live
- Riesgo: despliegue manual propenso a error humano
  - Mitigacion: Fase 6, automatizar el deploy completo desde CI

---

## Orden recomendado de ejecucion

1. Fase 0 (decisiones) y Fase 1 (servidor)
2. Fase 2 (DNS/Cloudflare) en paralelo con Fase 3 (contenerizacion)
3. Fase 4 (base de datos) y Fase 5 (secretos)
4. Fase 6 (CI/CD de deploy)
5. Fase 7 (validacion y go-live)

---

## Criterio final de "Listo para produccion"

- Servidor endurecido (SSH, firewall, fail2ban)
- Dominio real con HTTPS valido servido desde Cloudflare
- MariaDB con backup automatico probado
- Secretos de produccion propios, no reusados de local
- Deploy reproducible desde CI (push a `main` -> publicado sin pasos manuales)
- Smoke test funcional completo en el dominio real
- Rollback definido y probado

---

## Ver tambien

- [docs/devops/Plan-Backup-Mantenimiento.md](../devops/Plan-Backup-Mantenimiento.md) — backups y mantenimiento de MariaDB
- [docs/devops/Checklist-Produccion.md](../devops/Checklist-Produccion.md) — checklist previo a publicar
- [database/README.md](../../database/README.md) — esquema y modelo de datos (MariaDB, fuente de verdad)
- `CLAUDE.md` — estado general del stack y decisiones de arquitectura
