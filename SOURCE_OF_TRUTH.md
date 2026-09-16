# HA-CONFIG source of truth

## Active source

- Home Assistant configuration: configuration.yaml
- Dashboard master: dashboards/zuhause.yaml
- Generated personal dashboards: dashboards/timo.yaml, dashboards/juli.yaml, dashboards/mika.yaml, dashboards/gabi.yaml
- Frontend source assets: apple-optik.js, apple-mobile-gradient.js, apple-view-background-fix.js
- Theme source: apple.yaml
- Deployment entry point: deploy.sh
- Runtime reconciliation: apply_updates.py

deploy.sh copies the three frontend source assets to /config/www/ and generates the four personal dashboards from dashboards/zuhause.yaml.

## Legacy runtime copies

The repository-root zuhause.yaml and timo.yaml are not dashboard source files and are not checked out by the deploy path. apply_updates.py still recognizes corresponding legacy runtime paths under /config for compatibility with older installations.

They are therefore classified as LEGACY_COPY / RUNTIME_REFERENCED, not as source of truth and not yet SAFE_TO_REMOVE.

## Runtime mirror

ha-grok-bridge-live is a runtime snapshot/mirror. It can contain live-only backups, generated data, test artifacts, or emergency hotfixes. It is not the development source of truth. Any useful live-only fix must be reconciled back into this repository and validated before future deployment.
