#!/bin/bash
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
  if [ -f "$src" ]; then cp -f "$src" "$dst"; log "copy $src -> $dst"; else log "MISSING $src"; exit 1; fi
done
drop_tv() {
  f="$1"; [ -f "$f" ] || return 0
  before=$(grep -c firetv_television "$f" || true)
  awk '$0 ~ /type: custom:ios-media-player/ { a=$0; if ((getline b)<=0){print a;next} if ((getline c)<=0){print a;print b;next} if (b ~ /firetv_television/ || c ~ /firetv_television/) next; print a; print b; print c; next } { print }' "$f" > "$f.tmp-deploy"
  mv "$f.tmp-deploy" "$f"
  after=$(grep -c firetv_television "$f" || true)
  log "strip $f television $before -> $after"
}
drop_tv /config/dashboards/zuhause.yaml
drop_tv /config/dashboards/timo.yaml
drop_tv /config/zuhause.yaml
drop_tv /config/timo.yaml
js="/config/www/apple-optik.js"
if [ -f "$js" ] && ! grep -q 'html\[data-panel="dash"\]::before' "$js"; then
  log "scope wash to dashboards only"
  sed -i -e 's/^html::before/html[data-panel="dash"]::before/g' -e 's/^html::after/html[data-panel="dash"]::after/g' "$js"
fi
if [ -f "$js" ] && ! grep -q 'data-panel="admin"' "$js"; then
  log "patch HACS wash guard"
  printf '\n;(function(){function m(){var p=location.pathname||"";document.documentElement.setAttribute("data-panel",/\\/(hacs|config|developer-tools|history|logbook|media-browser|profile)\\b/.test(p)?"admin":"dash");}var s=document.createElement("style");s.textContent="html[data-panel=admin]::before,html[data-panel=admin]::after{content:none!important;display:none!important}";(document.head||document.documentElement).appendChild(s);m();window.addEventListener("location-changed",m);}());\n' >> "$js"
else
  log "JS HACS guard already present"
fi
log "ha core check"
ha core check
log "OK"
