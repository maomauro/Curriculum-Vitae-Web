#!/bin/bash
# Instala en el servidor el script que ejecuta la llave de despliegue, con dueno root y fuera de la carpeta del proyecto
# (un despliegue no puede reemplazarlo). Hay que repetirlo cuando cambie en el repositorio: NO se actualiza solo.
#
#   sudo bash instalar.sh                 # instala en /usr/local/sbin
#   bash instalar.sh --destino /ruta      # solo para pruebas: otra carpeta, sin cambiar el dueno
#
# Se ejecuta desde la carpeta deploy/ copiada al servidor (por ejemplo con scp).
set -euo pipefail

aqui=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
destino=/usr/local/sbin
prueba=0
if [[ "${1:-}" = "--destino" ]]; then
    destino=${2:?Falta la carpeta de destino}
    prueba=1
fi

mkdir -p "$destino"
if [[ "$prueba" = 1 ]]; then
    install -m 755 "$aqui/entrada.sh" "$destino/portalcv-entrada.sh"
else
    install -m 755 -o root -g root "$aqui/entrada.sh" "$destino/portalcv-entrada.sh"
fi
printf '%s  %s\n' "$(sha256sum "$destino/portalcv-entrada.sh" | cut -d' ' -f1)" "$destino/portalcv-entrada.sh"
echo "Instalado en $destino. Compare la suma con la del repositorio antes de seguir."
