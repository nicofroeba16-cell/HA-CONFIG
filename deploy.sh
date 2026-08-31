#!/bin/bash
# Einziger Deploy-Pfad: HA-CONFIG → /config.
# YAML/JS: Browser hart neu. ha core restart NUR bei configuration.yaml.
set -euo pipefail
mkdir -p /config/dashboards /config/themes /config/www
git -C /config fetch origin main
git -C /config checkout origin/main -- \
  zuhause.yaml timo.yaml apple.yaml apple-optik.js configuration.yaml deploy.sh apply_updates.py
cp -f /config/zuhause.yaml /config/dashboards/zuhause.yaml
cp -f /config/timo.yaml /config/dashboards/timo.yaml
[ -f /config/apple.yaml ] && cp -f /config/apple.yaml /config/themes/apple.yaml
[ -f /config/apple-optik.js ] && cp -f /config/apple-optik.js /config/www/apple-optik.js
python3 /config/apply_updates.py
ha core check
echo "YAML/JS deployed. Browser hart neu. Restart nur wenn configuration.yaml neu."
