#!/bin/bash
set -euo pipefail
log() { echo "[deploy] $*"; }
mkdir -p /config/dashboards /config/themes /config/www
log "git fetch"
git -C /config fetch origin main
log "checkout root + themes"
git -C /config checkout origin/main -- \
  deploy.sh zuhause.yaml timo.yaml apple.yaml apple-optik.js themes/apple.yaml || true
copy_one() {
  src="$1"; dst="$2"
  [ -f "$src" ] || { log "skip missing $src"; return 0; }
  [ "$src" = "$dst" ] && { log "ok $dst"; return 0; }
  mkdir -p "$(dirname "$dst")"
  cp -f "$src" "$dst"
  log "copy $src -> $dst ($(wc -c < "$src") bytes)"
}
copy_one /config/zuhause.yaml /config/dashboards/zuhause.yaml
copy_one /config/timo.yaml /config/dashboards/timo.yaml
copy_one /config/apple.yaml /config/themes/apple.yaml
copy_one /config/apple-optik.js /config/www/apple-optik.js
js="/config/www/apple-optik.js"
if [ -f "$js" ] && ! grep -q 'html\[data-panel="dash"\]::before' "$js"; then
  log "scope wash to dashboards"
  sed -i -e 's/^html::before/html[data-panel="dash"]::before/g' -e 's/^html::after/html[data-panel="dash"]::after/g' "$js"
fi
cfg="/config/configuration.yaml"
if [ -f "$cfg" ] && ! grep -q "apple-optik.js?v=1.9.20" "$cfg"; then
  if grep -q "themes: !include_dir_merge_named themes" "$cfg"; then
    grep -q "extra_module_url" "$cfg" || sed -i "/themes: !include_dir_merge_named themes/a\\  extra_module_url:\\n    - /local/apple-optik.js?v=1.9.20" "$cfg"
  fi
  log "resource cache-bust"
fi
log "ha core check"
ha core check
log "OK v1.9.20"
