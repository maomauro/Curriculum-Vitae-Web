#!/usr/bin/env bash
set -euo pipefail

# Backup logico (mariadb-dump) de la base de datos de produccion de PortalCV.
# Pensado para correr via cron en el VPS, al final de cada mes.
# Variables de conexion se leen de docker/mariadb.prod.env (no se versiona).

REPO_DIR="$HOME/Curriculum-Vitae-Web"
COMPOSE_FILE="$REPO_DIR/docker-compose.prod.yml"
ENV_FILE="$REPO_DIR/docker/mariadb.prod.env"
BACKUP_DIR="$HOME/backups/portalcv"
RETENTION=3

mkdir -p "$BACKUP_DIR"

if [ ! -f "$ENV_FILE" ]; then
  echo "$(date '+%Y-%m-%d %H:%M:%S') ERROR: no se encontro $ENV_FILE" >&2
  exit 1
fi

export $(grep MARIADB_ROOT_PASSWORD "$ENV_FILE")

TIMESTAMP=$(date +%Y%m%d_%H%M)
BACKUP_FILE="$BACKUP_DIR/portalcv_backup_${TIMESTAMP}.sql"

docker compose -f "$COMPOSE_FILE" exec -T db mariadb-dump -u root -p"$MARIADB_ROOT_PASSWORD" portalcv > "$BACKUP_FILE"

echo "$(date '+%Y-%m-%d %H:%M:%S') Backup OK: $BACKUP_FILE ($(du -h "$BACKUP_FILE" | cut -f1))"

# Conserva solo los ultimos $RETENTION backups, borra el resto
ls -1t "$BACKUP_DIR"/portalcv_backup_*.sql 2>/dev/null | tail -n +$((RETENTION + 1)) | xargs -r rm --

exit 0
