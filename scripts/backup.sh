#!/usr/bin/env bash
# Backup diário do banco "escola" (container escola-db) para /home/sombra/backups/escola/,
# mantendo os últimos $RETENCAO_DIAS dias. Pensado para rodar via cron na VPS.
#
# Uso manual:   ./backup.sh
# Restauração:  ver README abaixo (docker exec -i escola-db psql ... < arquivo.sql)

set -euo pipefail

CONTAINER_DB="escola-db"
DB_NAME="escola"
DB_USER="admin"
DESTINO="/home/sombra/backups/escola"
RETENCAO_DIAS=14

mkdir -p "$DESTINO"

TIMESTAMP=$(date +%Y-%m-%d_%H%M%S)
ARQUIVO="$DESTINO/escola_${TIMESTAMP}.sql.gz"

docker exec "$CONTAINER_DB" pg_dump -U "$DB_USER" "$DB_NAME" | gzip > "$ARQUIVO"

echo "Backup salvo em $ARQUIVO ($(du -h "$ARQUIVO" | cut -f1))"

# Remove backups mais antigos que RETENCAO_DIAS
find "$DESTINO" -name 'escola_*.sql.gz' -mtime +"$RETENCAO_DIAS" -delete

echo "Backups mantidos (últimos $RETENCAO_DIAS dias):"
ls -lh "$DESTINO" | tail -n +2

# ============================================================
# Restauração (rodar manualmente, NUNCA direto na produção sem testar antes):
#
#   gunzip -c /home/sombra/backups/escola/escola_2026-07-25_030000.sql.gz | \
#     docker exec -i escola-db psql -U admin -d escola_restore_teste
#
# Crie um banco de teste antes (docker exec escola-db createdb -U admin escola_restore_teste),
# restaure nele, confira os dados, e só então considere restaurar por cima do banco real
# (nesse caso, pare o container escola-app antes de restaurar sobre "escola").
#
# Cron sugerido (rodar `crontab -e` como o usuário sombra):
#   0 3 * * * /home/sombra/docker/escola/scripts/backup.sh >> /home/sombra/backups/escola/backup.log 2>&1
# ============================================================
