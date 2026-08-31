#!/bin/bash
# Einziger Deploy-Pfad. Kein python3. Kein core restart.
set -euo pipefail
mkdir -p /config/dashboards /config/themes /config/www
git -C /config fetch origin main
git -C /config checkout origin/main -- \
  zuhause.yaml timo.yaml apple.yaml apple-optik.js configuration.yaml deploy.sh || true
cp -f /config/zuhause.yaml /config/dashboards/zuhause.yaml
cp -f /config/timo.yaml /config/dashboards/timo.yaml
[ -f /config/apple.yaml ] && cp -f /config/apple.yaml /config/themes/apple.yaml
[ -f /config/apple-optik.js ] && cp -f /config/apple-optik.js /config/www/apple-optik.js
for f in /config/dashboards/zuhause.yaml /config/dashboards/timo.yaml /config/zuhause.yaml /config/timo.yaml; do
  [ -f "$f" ] || continue
  sed -i '/type: custom:ios-media-player/{
N
N
/firetv_television/d
}' "$f"
done
ha core check
echo "YAML/JS deployed. Browser hart neu. Restart nur wenn configuration.yaml neu."
