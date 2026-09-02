#!/usr/bin/env python3
"""Generate Timo/Juli/Mika/Gabi as exact Zuhause clones except navbar.

`dashboards/zuhause.yaml` is the only content master. The complete `views:`
block is inherited unchanged. Only the navbar definition and navbar template
references are personalized.
"""
from __future__ import annotations

import os
from pathlib import Path

ROOT = Path(os.environ.get("HA_CONFIG_ROOT", "/config"))
DASHBOARDS = ROOT / "dashboards"
MASTER = DASHBOARDS / "zuhause.yaml"

PROFILES = {
    "timo": {
        "template": "timo_nav",
        "routes": [
            ("mdi:home-floor-1", "timo-zimmer", "Timo"),
            ("mdi:home-variant", "huette", "Hütte"),
            ("mdi:home", "haus", "Home"),
            ("mdi:tree", "aussenbereich", "Außen"),
            ("mdi:server-network", "system", "System"),
        ],
    },
    "juli": {
        "template": "juli_nav",
        "routes": [
            ("mdi:television-classic", "juli-zimmer", "Juli"),
            ("mdi:home", "haus", "Home"),
            ("mdi:sofa", "wohnzimmer", "Wohnzimmer"),
        ],
    },
    "mika": {
        "template": "mika_nav",
        "routes": [
            ("mdi:television", "mika-zimmer", "Mika Zimmer"),
            ("mdi:home", "haus", "Home"),
            ("mdi:play-box-multiple", "medien", "Medien"),
        ],
    },
    "gabi": {
        "template": "gabi_nav",
        "routes": [
            ("mdi:sofa", "wohnzimmer", "Wohnzimmer"),
            ("mdi:home", "haus", "Home"),
            ("mdi:door", "flur", "Flur"),
        ],
    },
}


def master_parts() -> tuple[str, str]:
    text = MASTER.read_text(encoding="utf-8")
    marker = "views:\n"
    if marker not in text:
        raise RuntimeError("Zuhause master has no views block")
    header, views = text.split(marker, 1)
    style_marker = "    styles: |\n"
    if style_marker not in header:
        raise RuntimeError("Zuhause master navbar has no styles block")
    _before_styles, styles = header.split(style_marker, 1)
    return style_marker + styles, marker + views


def navbar(profile: str, data: dict, styles: str) -> str:
    lines = [
        "title: Zuhause",
        "navbar-templates:",
        f"  {data['template']}:",
        "    desktop:",
        "      position: bottom",
        "      show_labels: true",
        "    mobile:",
        "      show_labels: true",
        "      mode: floating",
        "    layout:",
        "      auto_padding:",
        "        enabled: true",
        "        desktop_px: 160",
        "        mobile_px: 224",
        "    routes:",
    ]
    for icon, view, label in data["routes"]:
        lines.extend([
            f"      - icon: {icon}",
            f"        url: /dashboard-{profile}/{view}",
            f"        label: {label}",
        ])
    return "\n".join(lines) + "\n" + styles


def render(profile: str, data: dict, styles: str, views: str) -> str:
    # Keep Zuhause views byte-for-byte except navbar template references.
    body = views.replace("template: zuhause_nav", f"template: {data['template']}")
    return navbar(profile, data, styles) + body


def main() -> None:
    styles, views = master_parts()
    for profile, data in PROFILES.items():
        target = DASHBOARDS / f"{profile}.yaml"
        content = render(profile, data, styles, views)
        target.write_text(content, encoding="utf-8")
        print(f"generated {target} ({len(content.encode('utf-8'))} bytes)")


if __name__ == "__main__":
    main()
