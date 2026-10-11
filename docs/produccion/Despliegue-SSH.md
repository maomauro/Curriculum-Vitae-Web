# Despliegue por SSH con llave restringida

Los workflows `deploy-backend.yml` y `deploy-frontend.yml` entran al VPS con una llave dedicada (`SSH_DEPLOY_KEY`) que **no abre una shell**. En `~/.ssh/authorized_keys` del servidor va así:

```
restrict,command="/usr/local/sbin/portalcv-entrada.sh" ssh-ed25519 AAAA... portalcv-deploy
```

El script (`deploy/entrada.sh`, instalado por root con `deploy/instalar.sh`) solo acepta dos órdenes:

| Orden | Qué hace |
|---|---|
| `desplegar-frontend` | `git pull` de `main`, reconstruye la imagen `web` y recrea solo `web` (`--no-deps`), y comprueba `http://127.0.0.1/` por dentro del contenedor |
| `desplegar-backend` | Inicia sesión en GHCR con el `GITHUB_TOKEN` efímero (llega por la entrada estándar y no queda en el servidor), descarga la imagen, recrea solo `backend` y comprueba `/health` a través de `web` |

Cualquier otra orden se rechaza («Orden no permitida»). Robar la llave o el secreto solo permite lanzar un despliegue de PortalCV, no controlar el servidor, que comparte Docker con Colfe y GDB.

## Secretos del repositorio

`SSH_HOST`, `SSH_USER`, `SSH_DEPLOY_KEY` (la llave restringida) y `SSH_KNOWN_HOSTS` (la huella del servidor, que los workflows verifican con `StrictHostKeyChecking=yes`).

## Actualizar el script en el servidor

Si cambia `deploy/entrada.sh`: copiar `deploy/` al servidor (`scp`), comparar los SHA-256 y ejecutar `sudo bash instalar.sh`. No se actualiza solo.

## Límite conocido

El compose y el código salen del repositorio (`git pull` de `main`): quien pueda hacer push a `main` puede cambiarlos. Lo cubre la protección de ramas. Una segunda etapa sería una política de lista blanca sobre el compose, como la de GrupoDigitalBank-CRUD (`deploy/politica.py`).

## Prueba

`tests/despliegue/entrada_test.sh` (corre en el CI): cada orden ejecuta exactamente su secuencia, el token no aparece en ningún argumento ni queda en disco, y todo lo demás se rechaza sin tocar git ni Docker.
