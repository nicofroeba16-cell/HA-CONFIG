#!/bin/bash
# HA-CONFIG deploy v1.9.22 — fuenf Dateien, TV-Strip, kein configuration.yaml, kein restart
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

strip_tv() {
  f="$1"
  grep -q 'wohnzimmer_wohnzimmer_firetv_television' "$f" || return 0
  log "strip fernseher $(basename "$f")"
  awk '
    /type: custom:ios-media-player/ {
      line1=$0
      if ((getline line2) <= 0) { print line1; next }
      if ((getline line3) <= 0) { print line1; print line2; next }
      if (line2 ~ /wohnzimmer_wohnzimmer_firetv_television/) next
      print line1
      print line2
      print line3
      next
    }
    { print }
  ' "$f" > "$f.tmp"
  mv "$f.tmp" "$f"
}

strip_tv /config/zuhause.yaml
strip_tv /config/timo.yaml

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
log "OK v1.9.22"
