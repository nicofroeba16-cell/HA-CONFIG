#!/bin/bash
# HA-CONFIG deploy v1.9.23 — Juli/Mika/Gabi + Apple Optik route patch
set -euo pipefail
log() { echo "[deploy] $*"; }

mkdir -p /config/dashboards /config/themes /config/www
log "git fetch"
git -C /config fetch origin main

log "checkout"
git -C /config checkout origin/main -- \
  deploy.sh apply_updates.py configuration.yaml zuhause.yaml timo.yaml apple.yaml apple-optik.js themes/apple.yaml \
  dashboards/zuhause.yaml dashboards/timo.yaml dashboards/juli.yaml dashboards/mika.yaml dashboards/gabi.yaml

need() { [ -f "$1" ] || { log "fehlt $1"; exit 1; }; }
need /config/configuration.yaml
need /config/dashboards/zuhause.yaml
need /config/dashboards/timo.yaml
need /config/dashboards/juli.yaml
need /config/dashboards/mika.yaml
need /config/dashboards/gabi.yaml
need /config/apple.yaml
need /config/apple-optik.js
need /config/apply_updates.py
need /config/deploy.sh

copy_one() {
  src="$1"; dst="$2"
  mkdir -p "$(dirname "$dst")"
  cp -f "$src" "$dst"
  log "copy $src -> $dst ($(wc -c < "$src") bytes)"
}

copy_one /config/zuhause.yaml /config/dashboards/zuhause.yaml
copy_one /config/timo.yaml /config/dashboards/timo.yaml
copy_one /config/apple.yaml /config/themes/apple.yaml
copy_one /config/apple-optik.js /config/www/apple-optik.js

log "apply runtime patch"
python3 /config/apply_updates.py

log "ha core check"
ha core check
log "restart Home Assistant"
ha core restart
log "OK v1.9.23"
