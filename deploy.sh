#!/bin/bash
# HA-CONFIG deploy v1.9.21 — fuenf Dateien, kein configuration.yaml, kein restart
set -euo pipefail
log() { echo "[deploy] $*"; }

mkdir -p /config/dashboards /config/themes /config/www
log "git fetch"
git -C /config fetch origin main

log "checkout"
git -C /config checkout origin/main -- \
  deploy.sh zuhause.yaml timo.yaml apple.yaml apple-optik.js themes/apple.yaml

need() { [ -f "$1" ] || { log "fehlt $1"; exit 1; }; }
need /config/zuhause.yaml
need /config/timo.yaml
need /config/apple.yaml
need /config/apple-optik.js
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

js=/config/www/apple-optik.js
if ! grep -q 'html\[data-panel="dash"\]::before' "$js"; then
  log "scope wash to dashboards"
  sed -i -e 's/^html::before/html[data-panel="dash"]::before/g' \
         -e 's/^html::after/html[data-panel="dash"]::after/g' "$js"
fi

log "ha core check"
ha core check
log "OK v1.9.21"
