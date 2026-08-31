#!/usr/bin/env python3
"""Idempotent box-patch: Wohnzimmer ohne firetv_television, JS 1.9.20 Wash-Scope."""
from pathlib import Path

TV = (
    "          - type: custom:ios-media-player\n"
    "            entity: media_player.wohnzimmer_wohnzimmer_firetv_television\n"
    "            name: Fernseher\n"
)

YAML_PATHS = (
    Path("/config/dashboards/zuhause.yaml"),
    Path("/config/dashboards/timo.yaml"),
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
    if 'function markPanel' in t and 'html[data-panel="dash"]::before' in t:
        if 'const VERSION = "1.9.18"' in t:
            t = t.replace('const VERSION = "1.9.18"', 'const VERSION = "1.9.20"', 1)
            path.write_text(t)
            return f"js version {path.name}"
        return f"js ok {path.name}"

    t = t.replace("html::before", 'html[data-panel="dash"]::before')
    t = t.replace("html::after", 'html[data-panel="dash"]::after')
    t = t.replace("html.apple-wash-animating", 'html[data-panel="dash"].apple-wash-animating')
    t = t.replace('const VERSION = "1.9.18"', 'const VERSION = "1.9.20"', 1)
    t = t.replace('const VERSION = "1.9.19"', 'const VERSION = "1.9.20"', 1)

    needle = (
        "html, body, home-assistant, ha-app-layout, ha-drawer,\n"
        "hui-view, hui-sections-view, #view, hui-view-background {\n"
        "  background: transparent !important;\n"
        "}"
    )
    scoped = """html[data-panel="dash"], html[data-panel="dash"] body,
html[data-panel="dash"] home-assistant, html[data-panel="dash"] ha-app-layout,
html[data-panel="dash"] ha-drawer, html[data-panel="dash"] hui-view,
html[data-panel="dash"] hui-sections-view, html[data-panel="dash"] #view,
html[data-panel="dash"] hui-view-background {
  background: transparent !important;
}

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
    if needle in t and 'html[data-panel="admin"]::before' not in t:
        t = t.replace(needle, scoped, 1)

    old = (
        "  function setView() {\n"
        "    try {\n"
        '      const m = (location.pathname || "").match(/\\/dashboard-(?:x|timo)\\/([^\\/\\?]+)/);'
    )
    new = (
        "  function markPanel() {\n"
        '    const p = location.pathname || "";\n'
        '    const dash = /\\/dashboard-(?:x|timo)(?:\\/|$)/.test(p);\n'
        '    document.documentElement.setAttribute("data-panel", dash ? "dash" : "admin");\n'
        "  }\n"
        "  function setView() {\n"
        "    try {\n"
        "      markPanel();\n"
        '      const m = (location.pathname || "").match(/\\/dashboard-(?:x|timo)\\/([^\\/\\?]+)/);'
    )
    if "function markPanel" not in t and old in t:
        t = t.replace(old, new, 1)

    path.write_text(t)
    return f"js patched {path.name}"


def main() -> None:
    log = [strip_tv(p) for p in YAML_PATHS] + [patch_js(p) for p in JS_PATHS]
    print("apply_updates 1.9.20")
    print("\n".join(log))


if __name__ == "__main__":
    main()
