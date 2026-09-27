# Rollback rápido — PortalCV Producción

Procedimiento para revertir un despliegue defectuoso en `https://portalcv.sitiosapps.com`, ejecutado manualmente por SSH en el VPS (no hay pipeline automatizado de rollback todavía — ver deuda de gobierno).

## Backend (imagen versionada en GHCR)

Cada build en `main` publica dos tags en GHCR: `:latest` y `:sha-<commit-corto>`. El rollback consiste en apuntar el compose a un tag `sha-` anterior conocido-bueno en vez de `:latest`.

1. Identificar el tag bueno anterior en https://github.com/maomauro/Curriculum-Vitae-Web/pkgs/container/portalcv-backend (ejemplo real al momento de escribir esto: actual `sha-84c26c4`, anterior validado `sha-311560a`).
2. En el VPS:
   ```bash
   cd ~/Curriculum-Vitae-Web
   TAG_ROLLBACK=sha-311560a   # ajustar al tag bueno conocido

   # Traer la imagen del tag anterior (no toca :latest)
   docker pull ghcr.io/maomauro/portalcv-backend:$TAG_ROLLBACK

   # Recrear el contenedor apuntando a ese tag puntual (override sin editar el compose)
   docker rm -f portalcv-backend-prod
   docker run --rm -d \
     --name portalcv-backend-prod \
     --network portalcv-net-prod \
     --env-file docker/backend.prod.env \
     --env-file docker/mariadb.prod.env \
     ghcr.io/maomauro/portalcv-backend:$TAG_ROLLBACK

   curl -skf https://localhost/health
   ```
   Alternativa más limpia (recomendada a futuro): parametrizar `docker-compose.prod.yml` con `image: ghcr.io/maomauro/portalcv-backend:${BACKEND_IMAGE_TAG:-latest}` y hacer `BACKEND_IMAGE_TAG=sha-311560a docker compose -f docker-compose.prod.yml up -d --force-recreate backend`. Hoy el compose tiene el tag fijo a `:latest`, así que el rollback exige el `docker run` manual de arriba o editar el compose temporalmente.
3. Verificar ST-01 (`/health`) y un par de endpoints críticos (`/api/cv/personales` autenticado, `/cv/<slug>` público) antes de dar el incidente por resuelto.
4. Una vez resuelta la causa raíz y publicado el fix, volver a `docker compose -f docker-compose.prod.yml up -d --force-recreate backend` (vuelve a `:latest`) o disparar el workflow `Deploy backend to VPS`.

## Frontend (build directo en el VPS, sin registry)

El frontend **no** se versiona como imagen: `deploy-frontend.yml` hace `git checkout main` + `docker compose build --no-cache nginx` directamente en el VPS. El rollback exige mover el working copy del VPS a un commit anterior:

```bash
cd ~/Curriculum-Vitae-Web
git log --oneline -- frontend/   # localizar el commit bueno anterior
git checkout <commit-anterior>   # HEAD detached, temporal
docker compose -f docker-compose.prod.yml build --no-cache nginx
docker compose -f docker-compose.prod.yml up -d --force-recreate nginx
curl -skf https://localhost/ > /dev/null
```

Al resolver la causa raíz: `git checkout main` para volver a la rama, y redeploy normal (push a `main` o `workflow_dispatch` de `deploy-frontend.yml`).

## Base de datos

Desde el runner de migraciones (`SchemaMigrationRunner`, ver CLAUDE.md sección "Migraciones de esquema"), cada arranque del backend aplica automáticamente contra la base real cualquier script pendiente de `database/migrations/` (numerados, idempotentes) — ya no hace falta correr un `ALTER TABLE` a mano por SSH antes de desplegar un backend que espera un cambio de esquema.

Esto **no es rollback de esquema**: sigue sin haber manera automática de *revertir* una columna/tabla ya agregada. Si se hace rollback del backend a un tag anterior (ver arriba) después de que corrió una migración nueva, el esquema queda "adelantado" respecto al código viejo. Esto es seguro **mientras las migraciones sean puramente aditivas** (agregar columna nullable, agregar tabla) — el código viejo simplemente no la usa, EF Core no pide columnas que no están mapeadas en su modelo. Si alguna vez se necesita una migración destructiva (renombrar/eliminar una columna), coordinar el rollback de esquema aparte, a mano, antes de confiar en el rollback de imagen solo.

Antes de cualquier cambio de esquema en producción, tomar un dump manual igual:

```bash
docker compose -f docker-compose.prod.yml exec db mariadb-dump -u root -p"$MARIADB_ROOT_PASSWORD" portalcv > backup_$(date +%Y%m%d_%H%M).sql
```

## Deuda de gobierno relacionada (pendiente, no bloquea Fase 7)

- **Tags SemVer** por deploy — hoy solo hay `sha-<commit>`, lo cual funciona para rollback pero no correlaciona con versiones "humanas".
- Parametrizar `docker-compose.prod.yml` con `BACKEND_IMAGE_TAG` para que el rollback de backend sea un solo comando sin `docker run` manual.
- Versionar el frontend como imagen en GHCR igual que el backend, para que el rollback de frontend no dependa de mover el working copy del VPS con `git checkout`.
