#!/usr/bin/env python3
"""Idempotent runtime patch for HA dashboards and Apple Optik v1.9.23."""
from pathlib import Path
import re

VERSION = "1.9.23"
DASHBOARD_JS = r"\/dashboard-(?:x|timo|juli|mika|gabi)(?:\/|$)"
VIEW_JS = r"\/dashboard-(?:x|timo|juli|mika|gabi)\/([^\/?]+)"

TV = (
    "          - type: custom:ios-media-player\n"
    "            entity: media_player.wohnzimmer_wohnzimmer_firetv_television\n"
    "            name: Fernseher\n"
)

YAML_PATHS = (
    Path("/config/dashboards/zuhause.yaml"),
    Path("/config/dashboards/timo.yaml"),
    Path("/config/dashboards/juli.yaml"),
    Path("/config/dashboards/mika.yaml"),
    Path("/config/dashboards/gabi.yaml"),
    Path("/config/zuhause.yaml"),
    Path("/config/timo.yaml"),
)

JS_PATHS = (
    Path("/config/www/apple-optik.js"),
    Path("/config/apple-optik.js"),
)


def strip_tv(path: Path) -> str:
    if not path.is_file():
        return f"skip yaml {path}"
    t = path.read_text()
    if TV not in t:
        return f"yaml ok {path.name}"
    path.write_text(t.replace(TV, ""))
    return f"yaml stripped {path.name}"


def patch_js(path: Path) -> str:
    if not path.is_file():
        return f"skip js {path}"

    t = path.read_text()
    original = t

    # Bump only the Apple Optik module version (first VERSION constant).
    t = re.sub(r'const VERSION = "1\.9\.\d+";', f'const VERSION = "{VERSION}";', t, count=1)

    # Scope the global wash/background to Lovelace dashboards only.
    t = t.replace("html::before,\nhtml::after {", 'html[data-panel="dash"]::before,\nhtml[data-panel="dash"]::after {', 1)
    t = t.replace("html::before {", 'html[data-panel="dash"]::before {', 1)
    t = t.replace("html::after {", 'html[data-panel="dash"]::after {', 1)
    t = t.replace("html.apple-wash-animating::before", 'html[data-panel="dash"].apple-wash-animating::before')
    t = t.replace("html.apple-wash-animating::after", 'html[data-panel="dash"].apple-wash-animating::after')

    old_bg = (
        "html, body, home-assistant, ha-app-layout, ha-drawer,\n"
        "hui-view, hui-sections-view, #view, hui-view-background {\n"
        "  background: transparent !important;\n"
        "}"
    )
    new_bg = """html[data-panel=\"dash\"], html[data-panel=\"dash\"] body,
html[data-panel=\"dash\"] home-assistant, html[data-panel=\"dash\"] ha-app-layout,
html[data-panel=\"dash\"] ha-drawer, html[data-panel=\"dash\"] hui-view,
html[data-panel=\"dash\"] hui-sections-view, html[data-panel=\"dash\"] #view,
html[data-panel=\"dash\"] hui-view-background {
  background: transparent !important;
}

html[data-panel=\"admin\"]::before,
html[data-panel=\"admin\"]::after {
  content: none !important;
  display: none !important;
}
html[data-panel=\"admin\"],
html[data-panel=\"admin\"] body,
html[data-panel=\"admin\"] home-assistant,
html[data-panel=\"admin\"] ha-app-layout,
html[data-panel=\"admin\"] ha-drawer {
  background: var(--primary-background-color, #111) !important;
}"""
    if old_bg in t:
        t = t.replace(old_bg, new_bg, 1)

    # Add route tracking once. This makes all five YAML dashboards receive
    # data-panel="dash" and keeps the per-view color washes working.
    if "function markPanelAndView()" not in t:
        marker = "function boot() {"
        tracker = f'''function markPanelAndView() {{\n  try {{\n    const p = location.pathname || \"\";\n    const dash = /{DASHBOARD_JS}/.test(p);\n    document.documentElement.setAttribute(\"data-panel\", dash ? \"dash\" : \"admin\");\n    const m = p.match(/{VIEW_JS}/);\n    if (m && m[1]) document.documentElement.setAttribute(\"data-view\", m[1]);\n    else document.documentElement.removeAttribute(\"data-view\");\n  }} catch (_e) {{}}\n}}\n\n'''
        if marker in t:
            t = t.replace(marker, tracker + marker, 1)

    if "markPanelAndView();\n  document.documentElement.style.colorScheme" not in t:
        t = t.replace(
            "function boot() {\n  document.documentElement.style.colorScheme",
            "function boot() {\n  markPanelAndView();\n  document.documentElement.style.colorScheme",
            1,
        )

    t = t.replace(
        'window.addEventListener("location-changed", schedule);',
        'window.addEventListener("location-changed", () => { markPanelAndView(); schedule(); });',
        1,
    )
    t = t.replace(
        'window.addEventListener("popstate", schedule);',
        'window.addEventListener("popstate", () => { markPanelAndView(); schedule(); });',
        1,
    )

    if t != original:
        path.write_text(t)
        return f"js patched {path.name} -> {VERSION}"
    return f"js ok {path.name}"


def main() -> None:
    log = [strip_tv(p) for p in YAML_PATHS] + [patch_js(p) for p in JS_PATHS]
    print(f"apply_updates {VERSION}")
    print("\n".join(log))


if __name__ == "__main__":
    main()
