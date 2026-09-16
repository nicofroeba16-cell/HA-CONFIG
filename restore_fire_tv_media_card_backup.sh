#!/bin/bash
set -euo pipefail

BACKUP_DIR="${1:-}"
ROOT="${2:-/config}"

if [ -z "$BACKUP_DIR" ] || [ ! -d "$BACKUP_DIR" ]; then
  echo "Usage: $0 <backup-dir> [root=/config]" >&2
  exit 2
fi

FILES=(
  "configuration.yaml"
  "apply_updates.py"
  "apple-optik.js"
  "www/apple-optik.js"
  "dashboards/zuhause.yaml"
  "dashboards/timo.yaml"
  "dashboards/juli.yaml"
  "dashboards/mika.yaml"
  "dashboards/gabi.yaml"
  "zuhause.yaml"
  "timo.yaml"
)

for rel in "${FILES[@]}"; do
  src="${BACKUP_DIR}/${rel}"
  if [ -f "$src" ]; then
    mkdir -p "${ROOT}/$(dirname "$rel")"
    cp -p "$src" "${ROOT}/$rel"
    echo "restored $rel"
  fi
done
