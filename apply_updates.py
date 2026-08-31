#!/usr/bin/env python3
from pathlib import Path

BLK = (
    "          - type: custom:ios-media-player\n"
    "            entity: media_player.wohnzimmer_wohnzimmer_firetv_television\n"
    "            name: Fernseher\n"
)

for p in (
    "/config/dashboards/zuhause.yaml",
    "/config/dashboards/timo.yaml",
    "/config/zuhause.yaml",
    "/config/timo.yaml",
):
    f = Path(p)
    if f.exists():
        t = f.read_text()
        if BLK in t:
            f.write_text(t.replace(BLK, ""))

js = Path("/config/www/apple-optik.js")
if js.exists():
    t = js.read_text()
    if 'data-panel="admin"' not in t:
        needle = (
            "html, body, home-assistant, ha-app-layout, ha-drawer,\n"
            "hui-view, hui-sections-view, #view, hui-view-background {\n"
            "  background: transparent !important;\n"
            "}"
        )
        add = needle + """

/* HACS / Admin-Panels: Wash aus, sonst leere Fläche */
html[data-panel="admin"]::before,
html[data-panel="admin"]::after {
  content: none !important;
  display: none !important;
}
html[data-panel="admin"],
html[data-panel="admin"] body,
html[data-panel="admin"] home-assistant,
html[data-panel="admin"] ha-app-layout,
html[data-panel="admin"] ha-drawer {
  background: var(--primary-background-color, #111) !important;
}"""
        t = t.replace(needle, add, 1)
        t = t.replace('const VERSION = "1.9.18";', 'const VERSION = "1.9.19";', 1)
        old = (
            "  function setView() {\n"
            "    try {\n"
            '      const m = (location.pathname || "").match(/\\/dashboard-(?:x|timo)\\/([^\\/\\?]+)/);'
        )
        new = (
            "  function markPanel() {\n"
            '    const p = location.pathname || "";\n'
            '    const admin = /\\/(hacs|config|developer-tools|history|logbook|media-browser|profile)\\b/.test(p);\n'
            '    document.documentElement.setAttribute("data-panel", admin ? "admin" : "dash");\n'
            "  }\n"
            "  function setView() {\n"
            "    try {\n"
            "      markPanel();\n"
            '      const m = (location.pathname || "").match(/\\/dashboard-(?:x|timo)\\/([^\\/\\?]+)/);'
        )
        t = t.replace(old, new, 1)
        js.write_text(t)
print("apply_updates ok")
