#!/usr/bin/env bash
set -Eeuo pipefail

BACKUP_DIR="/home/sombra/backups/escola"
LOG_FILE="/home/sombra/backups/escola/backup.log"
CONTAINER="escola-db"
DATABASE="escola"
DATABASE_USER="admin"
REMOTE="gdrive:Sistema Escolar/Backups PostgreSQL"
LOCAL_RETENTION_DAYS=7
DRIVE_RETENTION_DAYS=30

mkdir -p "$BACKUP_DIR"
exec 9>"$BACKUP_DIR/.backup.lock"
flock -n 9 || exit 0
exec >>"$LOG_FILE" 2>&1

timestamp="$(date +'%Y-%m-%d_%H-%M-%S')"
backup="$BACKUP_DIR/escola_${timestamp}.dump"
checksum="$backup.sha256"

cleanup_failed() {
  rm -f "$backup" "$checksum"
  echo "[$(date --iso-8601=seconds)] ERRO: backup interrompido."
}
trap cleanup_failed ERR

echo "[$(date --iso-8601=seconds)] Iniciando backup."
docker exec "$CONTAINER" pg_dump -U "$DATABASE_USER" -d "$DATABASE" --format=custom --compress=9 --no-owner --no-privileges > "$backup"
test -s "$backup"
docker exec -i "$CONTAINER" pg_restore --list < "$backup" >/dev/null
sha256sum "$backup" > "$checksum"
chmod 600 "$backup" "$checksum"

if command -v rclone >/dev/null 2>&1 && rclone listremotes | grep -qx 'gdrive:'; then
  rclone copyto "$backup" "$REMOTE/$(basename "$backup")" --retries 3 --low-level-retries 10
  rclone copyto "$checksum" "$REMOTE/$(basename "$checksum")" --retries 3 --low-level-retries 10
  rclone delete "$REMOTE" --min-age "${DRIVE_RETENTION_DAYS}d" --include 'escola_*.dump' --include 'escola_*.dump.sha256'
  echo "[$(date --iso-8601=seconds)] Backup enviado ao Google Drive."
else
  echo "[$(date --iso-8601=seconds)] AVISO: Google Drive ainda não autorizado; backup preservado localmente."
fi

find "$BACKUP_DIR" -maxdepth 1 -type f \( -name 'escola_*.dump' -o -name 'escola_*.dump.sha256' \) -mtime "+$LOCAL_RETENTION_DAYS" -delete
trap - ERR
echo "[$(date --iso-8601=seconds)] Backup validado: $(basename "$backup") ($(du -h "$backup" | cut -f1))."
