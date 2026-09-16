#!/bin/bash
set -euo pipefail

ROOT="${1:-/config}"
STAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP_DIR="${ROOT}/.patch-backups/fire-tv-media-card/${STAMP}"

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

mkdir -p "$BACKUP_DIR"
: > "$BACKUP_DIR/manifest.txt"

for rel in "${FILES[@]}"; do
  src="${ROOT}/${rel}"
  if [ -f "$src" ]; then
    mkdir -p "$BACKUP_DIR/$(dirname "$rel")"
    cp -p "$src" "$BACKUP_DIR/$rel"
    printf 'saved %s\n' "$rel" >> "$BACKUP_DIR/manifest.txt"
  else
    printf 'missing %s\n' "$rel" >> "$BACKUP_DIR/manifest.txt"
  fi
done

if git -C "$ROOT" rev-parse HEAD >/dev/null 2>&1; then
  git -C "$ROOT" rev-parse HEAD > "$BACKUP_DIR/git-head.txt"
  git -C "$ROOT" status --short > "$BACKUP_DIR/git-status.txt" || true
fi

printf '%s\n' "$BACKUP_DIR"
