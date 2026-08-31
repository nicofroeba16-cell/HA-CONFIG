#!/bin/bash
# Layout: dashboards/ themes/ www/ in Git → /config
set -euo pipefail
log() { echo "[deploy] $*"; }
mkdir -p /config/dashboards /config/themes /config/www
log "git fetch"
git -C /config fetch origin main
log "checkout"
git -C /config checkout origin/main -- \
  deploy.sh \
  dashboards/zuhause.yaml dashboards/timo.yaml \
  themes/apple.yaml www/apple-optik.js \
  zuhause.yaml timo.yaml apple.yaml apple-optik.js || true
copy_one() {
  src="$1"; dst="$2"
  if [ -f "$src" ]; then
    mkdir -p "$(dirname "$dst")"
    cp -f "$src" "$dst"
    log "copy $src -> $dst ($(wc -c < "$src") bytes)"
  else
    log "skip missing $src"
  fi
}
copy_one /config/dashboards/zuhause.yaml /config/dashboards/zuhause.yaml
copy_one /config/dashboards/timo.yaml /config/dashboards/timo.yaml
copy_one /config/themes/apple.yaml /config/themes/apple.yaml
copy_one /config/www/apple-optik.js /config/www/apple-optik.js
[ -f /config/dashboards/zuhause.yaml ] || copy_one /config/zuhause.yaml /config/dashboards/zuhause.yaml
[ -f /config/dashboards/timo.yaml ] || copy_one /config/timo.yaml /config/dashboards/timo.yaml
[ -f /config/themes/apple.yaml ] || copy_one /config/apple.yaml /config/themes/apple.yaml
[ -f /config/www/apple-optik.js ] || copy_one /config/apple-optik.js /config/www/apple-optik.js
js="/config/www/apple-optik.js"
if [ -f "$js" ] && ! grep -q 'html\[data-panel="dash"\]::before' "$js"; then
  log "scope wash to dashboards"
  sed -i -e 's/^html::before/html[data-panel="dash"]::before/g' -e 's/^html::after/html[data-panel="dash"]::after/g' "$js"
fi
cfg="/config/configuration.yaml"
if [ -f "$cfg" ]; then
  if ! grep -q "apple-optik.js?v=1.9.20" "$cfg"; then
    if grep -q "extra_module_url" "$cfg"; then
      sed -i "s|apple-optik.js[^\"' ]*|apple-optik.js?v=1.9.20|g" "$cfg"
    elif grep -q "themes: !include_dir_merge_named themes" "$cfg"; then
      sed -i "/themes: !include_dir_merge_named themes/a\\  extra_module_url:\\n    - /local/apple-optik.js?v=1.9.20" "$cfg"
    fi
    log "resource cache-bust ?v=1.9.20"
  else
    log "resource already ?v=1.9.20"
  fi
fi
log "ha core check"
ha core check
log "OK v1.9.20"
