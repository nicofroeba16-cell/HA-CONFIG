#!/bin/bash
# HA-CONFIG deploy v1.9.27 — Zuhause is the dashboard master
set -euo pipefail
log() { echo "[deploy] $*"; }
DRY_RUN="${DRY_RUN:-0}"

if [ "$DRY_RUN" = "1" ]; then
  log "dry-run: validating repository sources only"
  for src in deploy.sh apply_updates.py generate_personal_dashboards.py configuration.yaml apple.yaml apple-optik.js apple-mobile-gradient.js themes/apple.yaml dashboards/zuhause.yaml; do
    [ -f "/config/$src" ] || { log "fehlt /config/$src"; exit 1; }
  done
  log "dry-run: sources and target mappings are valid"
  exit 0
fi

mkdir -p /config/dashboards /config/themes /config/www
if [ -f /config/backup_fire_tv_media_card.sh ]; then
  log "backup current Fire TV media-card runtime"
  BACKUP_DIR="$(bash /config/backup_fire_tv_media_card.sh /config)"
  log "backup $BACKUP_DIR"
fi

log "git fetch"
git -C /config fetch origin main

log "checkout"
git -C /config checkout origin/main -- \
  deploy.sh apply_updates.py generate_personal_dashboards.py configuration.yaml apple.yaml apple-optik.js apple-mobile-gradient.js themes/apple.yaml backup_fire_tv_media_card.sh restore_fire_tv_media_card_backup.sh \
  dashboards/zuhause.yaml

need() { [ -f "$1" ] || { log "fehlt $1"; exit 1; }; }
need /config/configuration.yaml
need /config/dashboards/zuhause.yaml
need /config/apple.yaml
need /config/apple-optik.js
need /config/apple-mobile-gradient.js
need /config/apply_updates.py
need /config/generate_personal_dashboards.py
need /config/deploy.sh

copy_one() {
  src="$1"; dst="$2"
  mkdir -p "$(dirname "$dst")"
  cp -f "$src" "$dst"
  log "copy $src -> $dst ($(wc -c < "$src") bytes)"
}

copy_one /config/apple.yaml /config/themes/apple.yaml
copy_one /config/apple-optik.js /config/www/apple-optik.js
copy_one /config/apple-mobile-gradient.js /config/www/apple-mobile-gradient.js

log "generate Timo/Juli/Mika/Gabi from Zuhause master"
python3 /config/generate_personal_dashboards.py

need /config/dashboards/timo.yaml
need /config/dashboards/juli.yaml
need /config/dashboards/mika.yaml
need /config/dashboards/gabi.yaml

log "apply runtime patch"
python3 /config/apply_updates.py

log "ha core check"
ha core check
log "restart Home Assistant"
ha core restart
log "OK v1.9.27"
