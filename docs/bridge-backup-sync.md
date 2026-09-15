# Bridge-Backup und Sync

## Verifizierter Stand

`cloud_poll_live.py` (Add-on 0.3.3) verwendet als Command-Schema ausschließlich:

```json
{"id":"<eindeutige-id>","command":"<whitelist-befehl>"}
```

Ein `action: "sync"`-Feld gehört nicht zu diesem verifizierten Add-on-Code.

Die Whitelist erlaubt HA-Prüfkommandos, Git-Kommandos unter `/config`, das vorhandene
Deployment-Skript, den Runtime-Patch sowie `bridge transfer`.

`bridge transfer /config/<quelle> <repo-ziel>` kopiert eine einzelne Datei aus `/config`
ins Bridge-Repository und führt anschließend automatisch `git add`, Commit und Push aus.
Das ist ein Transfer, kein Backup.

## Sicherheitsbefund

- Vor Transfer oder Deploy wird kein Snapshot erstellt.
- Es gibt keinen automatischen Backup-Pfad.
- Archiv-Hash und Test-Entpackung sind nicht implementiert.
- Atomic Replace und Rollback sind nicht implementiert.
- Doppelte Commands werden über `/data/last_id` verhindert.
- Fehler werden als `exit_code`, `ok`, `output` und Zeitstempel in `result.json` gemeldet.
- SSH wird vom Add-on nicht zum HA-Host verwendet; `/config` ist lokal im Add-on.

## Erforderlicher Ablauf vor einem produktiven Sync

1. Auf dem HA-System ein Backup außerhalb des Git-Repositories und außerhalb von `.storage` erstellen.
2. Dateiliste, Archivgröße und SHA-256 erfassen.
3. Archiv testweise in einem temporären Verzeichnis entpacken und Dateiliste vergleichen.
4. Restore-Befehl dokumentieren, aber nicht ausführen.
5. Erst danach den zu diesem Add-on passenden Command mit `id` und `command` anlegen.
6. Resultat anhand derselben ID, `ok`, Exit-Code und Integritätsdaten prüfen.

Beispiel für einen späteren, manuell auszuführenden Backup-Ablauf (nicht automatisch durch die Bridge):

```bash
tar --exclude='/config/.storage' --exclude='/config/home-assistant_v2.db*' \
  -czf /backup/ha-config-<timestamp>.tar.gz \
  /config/configuration.yaml /config/deploy.sh /config/apply_updates.py \
  /config/www/apple-optik.js /config/www/apple-mobile-gradient.js \
  /config/www/apple-view-background-fix.js \
  /config/dashboards/zuhause.yaml /config/dashboards/timo.yaml \
  /config/dashboards/juli.yaml /config/dashboards/mika.yaml \
  /config/dashboards/gabi.yaml
sha256sum /backup/ha-config-<timestamp>.tar.gz
tar -tzf /backup/ha-config-<timestamp>.tar.gz
```

Der konkrete Pfad muss vor Ausführung auf dem HA-System verifiziert werden. Ohne diesen Nachweis
darf der Commit `7f1e992d09c7c299201db87631515c3b565412c1` nicht verarbeitet werden.

## Verifiziertes Live-Backup

Am 2026-09-16 wurde auf dem HA-System ein Archiv unter
`/backup/ha-config-backup-20260916T002000Z.tar.gz` erstellt.

- Archivgröße: 42,416,964 Bytes
- SHA-256: `4f64a5ec890f49450da902be28b5fa18e774535e96a67167681e2b48fd14b7a3`
- Einträge: 5293
- Enthalten: die vollständige Konfigurationsstruktur unter `/homeassistant` (dem Ziel von `/config`)
- Ausgeschlossen: `.storage`, `home-assistant_v2.db*` und `backups`
- Test-Entpackung: erfolgreich in ein temporäres Verzeichnis; `configuration.yaml` und `dashboards/zuhause.yaml` vorhanden

Der dokumentierte Restore-Befehl (nicht ausgeführt) lautet:

```bash
tar -xzf /backup/ha-config-backup-20260916T002000Z.tar.gz -C /config
```

Vor einem Restore müssen Home Assistant gestoppt, die Zielstruktur geprüft und die SHA-256-Prüfsumme
erneut validiert werden. Ein Restore wurde noch nicht produktiv durchgeführt.
