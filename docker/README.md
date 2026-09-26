# Docker — mapa de archivos

Los archivos de Docker de este proyecto están repartidos a propósito, siguiendo la
convención estándar de Compose: el Dockerfile vive junto al código que construye, y
las credenciales se centralizan aparte para que nunca queden dentro del build context
de una imagen (los `.dockerignore` de `backend/` y `frontend/` excluyen `*.env`).
Ningún `Dockerfile*` vive dentro de esta carpeta — siempre junto a su código.

| Qué | Dónde | Para qué |
|---|---|---|
| Orquestador | `/docker-compose.yml` (raíz) | Levanta MariaDB + backend + frontend juntos, para desarrollo local |
| Imagen backend — desarrollo (hot-reload) | `backend/Dockerfile.dev`, `backend/entrypoint.dev.sh` | Solo para `docker compose up`. Corre `dotnet watch` sobre el código montado por bind mount. |
| Imagen frontend — desarrollo (hot-reload) | `frontend/Dockerfile.dev` | Solo para `docker compose up`. La imagen de producción (Nginx sirviendo el build estático en el VPS de Contabo) todavía no existe — ver `docs/produccion/Plan-Trabajo-Produccion.md` Fase 3. |
| Credenciales backend (JWT, cifrado, conexión a MariaDB) | `docker/backend.local.env` (copiar de `backend.local.env.mariadb.example`) | Usadas por `docker run` suelto del backend, o como base junto con `docker/mariadb.local.env` en el flujo con compose. |
| Credenciales del contenedor MariaDB | `docker/mariadb.local.env` (copiar de `.example`) | Las usa el servicio `db` del compose, y `backend/entrypoint.dev.sh` las reutiliza para armar la connection string (única fuente de verdad para usuario/password/nombre de la base). |

Ver `docs/devops/DevOps.md` (sección 4) para el flujo completo de entorno local.
