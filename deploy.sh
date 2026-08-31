#!/bin/bash
# Deploy HA-CONFIG → /config. Kein python3, kein core restart.
set -euo pipefail
log() { echo "[deploy] $*"; }

mkdir -p /config/dashboards /config/themes /config/www
log "git fetch"
git -C /config fetch origin main
log "checkout tracked files"
git -C /config checkout origin/main -- \
  zuhause.yaml timo.yaml apple.yaml apple-optik.js configuration.yaml deploy.sh

for srcdst in \
  "zuhause.yaml:dashboards/zuhause.yaml" \
  "timo.yaml:dashboards/timo.yaml" \
  "apple.yaml:themes/apple.yaml" \
  "apple-optik.js:www/apple-optik.js"
do
  src="/config/${srcdst%%:*}"
  dst="/config/${srcdst##*:}"
  if [ -f "$src" ]; then
    cp -f "$src" "$dst"
    log "copy $src -> $dst ($(wc -c < "$src") bytes)"
  else
    log "MISSING $src"
    exit 1
  fi
done

drop_tv() {
  f="$1"
  [ -f "$f" ] || return 0
  before=$(grep -c firetv_television "$f" || true)
  tmp="$f.tmp-deploy"
  awk '
    $0 ~ /type: custom:ios-media-player/ {
      a=$0
      if ((getline b) <= 0) { print a; next }
      if ((getline c) <= 0) { print a; print b; next }
      if (b ~ /firetv_television/ || c ~ /firetv_television/) next
      print a; print b; print c
      next
    }
    { print }
  ' "$f" > "$tmp"
  mv "$tmp" "$f"
  after=$(grep -c firetv_television "$f" || true)
  log "strip $f television $before -> $after"
}

drop_tv /config/dashboards/zuhause.yaml
drop_tv /config/dashboards/timo.yaml
drop_tv /config/zuhause.yaml
drop_tv /config/timo.yaml

log "ha core check"
ha core check
log "OK — Browser hart neu. Restart nur bei configuration.yaml."
