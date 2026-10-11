#!/bin/bash
# Entrada de la llave SSH de despliegue de GitHub Actions de PortalCV. En authorized_keys del VPS esa llave va como:
#   restrict,command="/usr/local/sbin/portalcv-entrada.sh" ssh-ed25519 AAAA... portalcv-deploy
# asi que con ELLA no se abre una shell ni se ejecuta nada que no sea una de estas dos ordenes:
#   desplegar-frontend   reconstruye la imagen web y recrea solo el contenedor web
#   desplegar-backend    descarga la imagen del backend de GHCR y recrea solo el contenedor backend
# Robar la llave o el secreto solo permite lanzar un despliegue de PortalCV, no controlar el servidor (que comparte
# Docker con Colfe y GDB). Ver H-001/H-003 y deploy/instalar.sh.
#
# Protocolo de desplegar-backend (entrada estandar): una primera linea con el GITHUB_TOKEN efimero del workflow, para
# leer la imagen de GHCR ("-" = no iniciar sesion, solo pruebas). Se usa en una carpeta de configuracion de Docker
# temporal que se borra al terminar: no queda ninguna credencial en el servidor.
#
# Limite conocido: el compose y el codigo salen del repositorio (git pull de main); quien pueda hacer push a main
# puede cambiarlos. Eso lo cubre la proteccion de ramas y, en una segunda etapa, una politica sobre el compose
# (ver GrupoDigitalBank-CRUD, deploy/politica.py).
#
# Para las pruebas: PORTALCV_DIR, ESPERA_SEGUNDOS.
set -euo pipefail

DIR=${PORTALCV_DIR:-/srv/sitiosapps/Curriculum-Vitae-Web}
REGISTRO=ghcr.io
USUARIO_REGISTRO=maomauro
ESPERA=${ESPERA_SEGUNDOS:-}
COMPOSE=(docker compose -f docker-compose.prod.yml)

orden=${SSH_ORIGINAL_COMMAND:-}
case "$orden" in
    desplegar-frontend | desplegar-backend) ;;
    *)
        echo "Orden no permitida. Solo: desplegar-frontend | desplegar-backend" >&2
        exit 2
        ;;
esac

actualizar_repositorio() {
    git fetch origin main
    git checkout main
    git pull origin main
}

desplegar_frontend() {
    actualizar_repositorio
    "${COMPOSE[@]}" build --no-cache web
    "${COMPOSE[@]}" up -d --force-recreate --no-deps web
    sleep "${ESPERA:-3}"
    # El contenedor web no publica puertos (el gateway llega por la red sitiosapps-edge): se prueba desde dentro
    "${COMPOSE[@]}" exec -T web wget -q -O /dev/null http://127.0.0.1/
}

# Global a proposito: la trap de salida corre cuando la funcion ya termino y una variable local no existiria
trabajo=""
desplegar_backend() {
    local token
    read -r token || { echo "Falta el token en la primera linea." >&2; exit 2; }
    # El token solo se usa como entrada estandar de docker login (nunca dentro de una orden de shell), asi que no hace
    # falta una lista blanca de caracteres: el formato de los tokens de GitHub cambia. Se rechaza lo vacio, los espacios,
    # los caracteres de control y lo desmesurado.
    if [[ ${#token} -lt 1 || ${#token} -gt 4096 || $token == *[[:space:][:cntrl:]]* ]]; then
        echo "Token no valido." >&2
        exit 2
    fi

    trabajo=$(mktemp -d)
    trap 'rm -rf "${trabajo:-}"' EXIT
    export DOCKER_CONFIG=$trabajo/docker
    mkdir -p "$DOCKER_CONFIG"
    # Una carpeta de configuracion propia oculta los plugins instalados por usuario (por ejemplo `docker compose` en
    # ~/.docker/cli-plugins); si existen, se copian para que sigan disponibles
    if [[ -d "${HOME:-/nonexistent}/.docker/cli-plugins" ]]; then
        cp -r "$HOME/.docker/cli-plugins" "$DOCKER_CONFIG/cli-plugins"
    fi

    actualizar_repositorio
    if [[ "$token" != "-" ]]; then
        printf '%s' "$token" | docker login "$REGISTRO" -u "$USUARIO_REGISTRO" --password-stdin > /dev/null
    fi
    unset token
    "${COMPOSE[@]}" pull backend
    "${COMPOSE[@]}" up -d --force-recreate --no-deps backend
    sleep "${ESPERA:-5}"
    # /health pasa por web, que lo reenvia al backend: prueba las dos mitades
    "${COMPOSE[@]}" exec -T web wget -q -O /dev/null http://127.0.0.1/health
}

cd "$DIR"
if [[ "$orden" == "desplegar-frontend" ]]; then
    desplegar_frontend
else
    desplegar_backend
fi
