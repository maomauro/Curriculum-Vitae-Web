#!/bin/bash
# Prueba deploy/entrada.sh: solo `desplegar-frontend` y `desplegar-backend` pasan, cada una ejecuta exactamente su
# secuencia, el token de GHCR no aparece en ningun argumento ni queda en disco, y todo lo demas se rechaza SIN tocar git
# ni Docker. Usa git y docker de mentira (no toca el servidor ni Docker).
set -uo pipefail

RAIZ=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)
T=$(mktemp -d)
trap 'rm -rf "$T"' EXIT
fallos=0

mkdir -p "$T/repo" "$T/bin"
# git y docker de mentira: registran cada invocacion (sin la entrada estandar) en $T/registro.txt
cat > "$T/bin/git" << 'EOS'
#!/bin/bash
echo "git $*" >> "$REGISTRO_PRUEBA"
EOS
cat > "$T/bin/docker" << 'EOS'
#!/bin/bash
echo "docker $*" >> "$REGISTRO_PRUEBA"
if [[ "${1:-}" == login ]]; then
    cat > "$REGISTRO_PRUEBA.stdin-login"
    echo "DOCKER_CONFIG=$DOCKER_CONFIG" >> "$REGISTRO_PRUEBA"
fi
if [[ -n "${FALLAR_EN:-}" && "$*" == *"$FALLAR_EN"* ]]; then exit 1; fi
exit 0
EOS
chmod +x "$T/bin/git" "$T/bin/docker"

ok() { printf 'OK     %s\n' "$1"; }
falla() { printf 'FALLA  %s\n' "$1"; fallos=$((fallos + 1)); }

# correr <orden> <entrada estandar> [VAR=valor...]: ejecuta la entrada como lo haria sshd
correr() {
    local orden=$1 entrada=$2
    shift 2
    : > "$T/registro.txt"
    rm -f "$T/registro.txt.stdin-login"
    printf '%s' "$entrada" | env PATH="$T/bin:$PATH" REGISTRO_PRUEBA="$T/registro.txt" PORTALCV_DIR="$T/repo" ESPERA_SEGUNDOS=0 \
        SSH_ORIGINAL_COMMAND="$orden" "$@" bash "$RAIZ/deploy/entrada.sh" > "$T/salida.txt" 2>&1
}
registro_tiene() { grep -qF -- "$1" "$T/registro.txt"; }
registro_ok() { if registro_tiene "$1"; then ok "$2"; else falla "$2"; fi; } # registro_ok <texto> <descripcion>
sin_registro() { [[ ! -s "$T/registro.txt" ]]; }

C="docker compose -f docker-compose.prod.yml"

# ---- desplegar-frontend ----
if correr "desplegar-frontend" ""; then ok "desplegar-frontend termina bien"; else falla "desplegar-frontend debia pasar"; fi
registro_ok "git pull origin main" "actualiza el repositorio (git pull origin main)"
registro_ok "$C build --no-cache web" "reconstruye la imagen web"
registro_ok "$C up -d --force-recreate --no-deps web" "recrea SOLO web (--no-deps: ni backend ni base)"
registro_ok "$C exec -T web wget -q -O /dev/null http://127.0.0.1/" "verifica por dentro del contenedor web"
if registro_tiene "backend" || registro_tiene "login"; then falla "el frontend no debe tocar backend ni iniciar sesion"; else ok "el frontend no toca backend ni inicia sesion"; fi

# ---- desplegar-backend ----
if correr "desplegar-backend" $'ghs_TokenDePrueba123\n'; then ok "desplegar-backend termina bien"; else falla "desplegar-backend debia pasar"; fi
registro_ok "login ghcr.io -u maomauro --password-stdin" "inicia sesion en GHCR con --password-stdin"
if grep -q "ghs_TokenDePrueba123" "$T/registro.txt"; then falla "el token aparece en los argumentos"; else ok "el token NO aparece en ningun argumento"; fi
if [[ "$(cat "$T/registro.txt.stdin-login" 2> /dev/null)" == "ghs_TokenDePrueba123" ]]; then ok "el token llega por la entrada estandar, tal cual"; else falla "el token no llego por stdin"; fi
dir_config=$(grep -o 'DOCKER_CONFIG=.*' "$T/registro.txt" | head -n1 | cut -d= -f2-)
if [[ -n "$dir_config" && ! -e "$dir_config" ]]; then ok "la configuracion temporal de Docker se borra al terminar"; else falla "quedo la configuracion de Docker con credenciales: $dir_config"; fi
registro_ok "$C pull backend" "descarga solo la imagen del backend"
registro_ok "$C up -d --force-recreate --no-deps backend" "recrea SOLO backend (--no-deps: ni base ni web)"
registro_ok "$C exec -T web wget -q -O /dev/null http://127.0.0.1/health" "verifica /health a traves de web"
# El orden importa: primero la sesion, despues la descarga, despues recrear
secuencia=$(grep -oE "login|pull backend|up -d" "$T/registro.txt" | tr '\n' ',')
if [[ "$secuencia" == "login,pull backend,up -d," ]]; then ok "orden correcto: sesion, descarga, recreacion"; else falla "orden incorrecto: $secuencia"; fi

# Los tokens reales de GitHub traen guiones, puntos y otros caracteres: deben pasar, y NO deben ejecutarse como shell
# shellcheck disable=SC2016
for token in "ghs_abc-DEF.123=" "ghs_$(printf 'a%.0s' $(seq 1 300))" "x;id" 'a$(id)'; do
    if correr "desplegar-backend" "$token"$'
' && [[ "$(cat "$T/registro.txt.stdin-login")" == "$token" ]]; then ok "token con caracteres variados llega intacto a docker login: ${token:0:16}"; else falla "token valido rechazado: ${token:0:16}"; fi
done

# "-" = sin sesion (pruebas)
if correr "desplegar-backend" $'-
' && ! registro_tiene "login"; then ok "con token '-' no inicia sesion"; else falla "token '-' mal manejado"; fi

# ---- tokens que se rechazan, sin tocar nada ----
for token in "" "a b" $'a	b' "$(printf 'a%.0s' $(seq 1 4097))"; do
    if correr "desplegar-backend" "$token"$'\n' ; then falla "token invalido aceptado: ${token:0:20}"; elif sin_registro; then ok "token invalido rechazado sin tocar nada: '${token:0:12}'"; else falla "token invalido rechazado pero SE EJECUTO algo"; fi
done
if correr "desplegar-backend" ""; then falla "sin token debia fallar"; elif sin_registro; then ok "sin token (entrada vacia): rechazado sin tocar nada"; else falla "sin token pero se ejecuto algo"; fi

# ---- ordenes que se rechazan, sin tocar git ni Docker ----
rechazar() {
    if correr "$1" $'ghs_x\n'; then falla "debia rechazarse: $(printf '%q' "$1")"
    elif ! sin_registro; then falla "se rechazo pero SE EJECUTO algo: $(printf '%q' "$1")"
    else ok "rechazada: $(printf '%q' "$1")"; fi
}
rechazar ""
rechazar "ls /"
rechazar "bash"
rechazar "desplegar"
rechazar "desplegar latest"
rechazar "desplegar-frontend; id"
rechazar "desplegar-frontend && id"
rechazar "desplegar-frontend | cat"
rechazar "desplegar-frontend extra"
rechazar "desplegar-backend extra"
rechazar "DESPLEGAR-FRONTEND"
rechazar " desplegar-frontend"
rechazar "desplegar-frontend "
rechazar $'desplegar-frontend\nid'
# shellcheck disable=SC2016
rechazar 'desplegar-frontend $(id)'
rechazar "cd ~/Curriculum-Vitae-Web && docker compose -f docker-compose.prod.yml up -d"

# ---- un fallo a mitad corta el despliegue ----
if correr "desplegar-frontend" "" FALLAR_EN="build"; then falla "si el build falla, el despliegue debia fallar"
elif registro_tiene "up -d"; then falla "tras fallar el build igual recreo el contenedor"
else ok "si el build falla, no se recrea el contenedor y el despliegue falla"; fi
if correr "desplegar-backend" $'ghs_x\n' FALLAR_EN="pull"; then falla "si el pull falla, el despliegue debia fallar"
elif registro_tiene "up -d"; then falla "tras fallar el pull igual recreo el backend"
else ok "si el pull falla, no se recrea el backend"; fi
# y aun asi no quedan credenciales
dir_config=$(grep -o 'DOCKER_CONFIG=.*' "$T/registro.txt" | head -n1 | cut -d= -f2-)
if [[ -n "$dir_config" && ! -e "$dir_config" ]]; then ok "tras un fallo tampoco queda la configuracion con credenciales"; else falla "tras un fallo quedo la configuracion de Docker"; fi

# ---- la carpeta del proyecto debe existir ----
if correr "desplegar-frontend" "" PORTALCV_DIR="$T/no-existe"; then falla "sin carpeta del proyecto debia fallar"; elif sin_registro; then ok "sin carpeta del proyecto falla sin ejecutar nada"; else falla "se ejecuto algo sin carpeta"; fi

echo
if [[ "$fallos" -eq 0 ]]; then echo "Entrada de despliegue: todas las pruebas pasaron."; exit 0; fi
echo "Entrada de despliegue: $fallos prueba(s) fallaron."
exit 1
