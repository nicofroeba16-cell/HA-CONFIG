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

js="/config/www/apple-optik.js"
if [ -f "$js" ] && ! grep -q 'data-panel="admin"' "$js"; then
  log "patch HACS wash guard into apple-optik.js"
  cat >> "$js" << 'ENDJS'

;(function () {
  function markPanel() {
    var p = location.pathname || "";
    var admin = /\/(hacs|config|developer-tools|history|logbook|media-browser|profile)\b/.test(p);
    document.documentElement.setAttribute("data-panel", admin ? "admin" : "dash");
  }
  var s = document.createElement("style");
  s.textContent = 'html[data-panel="admin"]::before,html[data-panel="admin"]::after{content:none!important;display:none!important;z-index:-1!important;}html[data-panel="admin"],html[data-panel="admin"] body,html[data-panel="admin"] home-assistant,html[data-panel="admin"] ha-app-layout{background:var(--primary-background-color,#111)!important;}';
  (document.head || document.documentElement).appendChild(s);
  markPanel();
  window.addEventListener("location-changed", markPanel);
  window.addEventListener("popstate", markPanel);
})();
ENDJS
else
  log "JS HACS guard already present or JS missing"
fi

log "ha core check"
ha core check
log "OK — Browser hart neu. Restart nur bei configuration.yaml."
