# Motion / Sprache / iOS 27 Acceptance Matrix

- Tested source HEAD: `e554ae77c11f52aeb8406f08e638f35cee25680e`
- Source baseline: `411b7b2c4057812f0fd3cf256b9342fdc3250fc8`
- Generated: `2026-09-18T00:01:57.402Z`
- Mode: lokale Repo-/Browser-Simulation; kein authentifizierter oder Live-HA-Zugriff
- Apple-Referenzen:
  - https://developer.apple.com/design/human-interface-guidelines/
  - https://developer.apple.com/design/tips/
  - https://developer.apple.com/design/human-interface-guidelines/buttons
  - https://developer.apple.com/design/human-interface-guidelines/accessibility

| Bereich | Erwartung | Evidence | Ergebnis | Befund / Fix / Retest |
|---|---|---|---|---|
| Deutsche Navigation und Karten | Normale UI-Bezeichnungen und Navigationslabels sind deutsch. | alle Videos + statischer Sprachaudit | PASS | Home/Health/Presence/Backup/Update/Master-Mischungen ersetzt; Marken- und technische Entity-Namen bleiben unverändert. |
| Deutsche Status-/Fehlerzustände | Laden, nicht verfügbar, Wiederverbinden und Verbindungsstatus sind deutsch. | alle Videos + language segment | PASS | Online/Offline sichtbar zu Verbunden/Getrennt; Lade-/Unavailable-Simulation deutsch. |
| Deutsche Accessibility-/ARIA-Texte | Kontrollierte ARIA-/Button-Texte enthalten keine unbeabsichtigten englischen Operatorbegriffe. | tests/test_language_ios27.py | PASS | Power/Play/Player und Custom-Card-Editorbezeichnungen lokalisiert. |
| 44-pt Touch-Ziele | Primäre Custom Controls besitzen mindestens 44×44 px/pt Simulationsfläche. | statischer iOS27-Test + Videos | PASS | Media-Buttons, App-Chips und Licht-Kachel auf 44×44 angehoben. |
| Liquid Glass Rollen | Glass/Blur bleibt auf Navigation, Header und Overlay; Inhaltskarten bleiben klare Content-Flächen. | Dark/Light Screenshots + statischer Test | PASS | Content-Karten ohne backdrop-filter; Navbar/Header/Detail-Layer behalten funktionales Material. |
| Dark Appearance | Hierarchie, Labels und Karten bleiben im dunklen Erscheinungsbild lesbar. | iphone-393x852-motion.avi + Screenshots | PASS | Custom-Karte rgb(28,28,30), Text rgb(245,245,247). |
| Light Appearance | Hierarchie, Labels und Karten adaptieren an helles Home-Assistant/System-Erscheinungsbild. | iphone-430x932-motion.avi + Screenshots | PASS | Custom-Karte rgb(255,255,255), Text rgb(28,28,30); kein erzwungener Dark Mode. |
| Safe Area / Navigation | Unterer Inhalt respektiert safe-area; Navigation bleibt klar getrennte Funktionsschicht. | statischer iOS27-Test + Videos | PASS | env(safe-area-inset-bottom) erhalten; keine horizontale Überbreite. |
| Initial Load + Navigation | Dashboard startet stabil; Navigation crossfadet einmalig und ohne Ghosting. | alle vier Videos | PASS | Keine gestapelten Übergänge; Zielroute stabil. |
| Schnelle wiederholte Navigation | Neueste Route gewinnt; keine doppelte Animation oder blockierte Eingabe. | alle vier Videos | PASS | Rapid-Navigation endet stabil auf haus. |
| Press/Release + Details | Press-State reagiert sofort; Details öffnen/schließen wiederholt ohne Sprung. | alle vier Videos | PASS | 44-pt Kontrollflächen + bestehende reduzierte Skalierung. |
| Licht-/Medienzustände | Entity- und Medienwechsel verursachen keinen Layoutsprung. | alle vier Videos | PASS | Aus/Ein/Bereit/Wiedergabe wiederholt geprüft. |
| Loading / unavailable / reconnect | Zwischenzustände lösen sauber in bereit/verfügbar/verbunden auf. | alle vier Videos | PASS | Kein Ghosting, keine Console Errors. |
| Explizites Reload | Hard reload initialisiert Styles genau einmal und kehrt stabil zurück. | alle vier Videos | PASS | Page.reload(ignoreCache=true) enthalten. |
| Reduce Motion / Transparency | Animationen kollabieren auf minimale Dauer; Glass wird opaker/ohne Blur. | iphone-393x852-reduced-motion.avi | PASS | prefers-reduced-motion und prefers-reduced-transparency beide aktiv und gemessen. |
| DOM / Style / Overflow / Console | Mutation-Stress verursacht kein Wachstum oder Style-Duplikate. | results.json | PASS | 70→70 DOM nodes; style counts 1/1/1; overflow=false; consoleErrors=[] in allen Profilen. |
