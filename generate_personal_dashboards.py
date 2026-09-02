#!/usr/bin/env python3
"""Generate Juli/Mika/Gabi dashboards from the Timo dashboard master.

All views, sections, cards, entities and actions are inherited from
`dashboards/timo.yaml`. Only dashboard identity, navbar configuration and
internal dashboard URL prefixes are changed.
"""
from __future__ import annotations

from pathlib import Path

ROOT = Path("/config")
DASHBOARDS = ROOT / "dashboards"
MASTER = DASHBOARDS / "timo.yaml"

PROFILES = {
    "juli": {
        "title": "Zuhause Juli",
        "template": "juli_nav",
        "routes": [
            ("mdi:television-classic", "juli-zimmer", "Juli"),
            ("mdi:home", "haus", "Home"),
            ("mdi:sofa", "wohnzimmer", "Wohnzimmer"),
        ],
    },
    "mika": {
        "title": "Zuhause Mika",
        "template": "mika_nav",
        "routes": [
            ("mdi:television", "mika-zimmer", "Mika Zimmer"),
            ("mdi:home", "haus", "Home"),
            ("mdi:play-box-multiple", "medien", "Medien"),
        ],
    },
    "gabi": {
        "title": "Zuhause Gabi",
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
        raise RuntimeError("Timo master has no views block")
    header, views = text.split(marker, 1)

    style_marker = "    styles: |\n"
    if style_marker not in header:
        raise RuntimeError("Timo master navbar has no styles block")
    _before_styles, styles = header.split(style_marker, 1)
    return style_marker + styles, marker + views


def navbar(profile: str, data: dict, styles: str) -> str:
    lines = [
        f"title: {data['title']}",
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
        lines.extend(
            [
                f"      - icon: {icon}",
                f"        url: /dashboard-{profile}/{view}",
                f"        label: {label}",
            ]
        )
    return "\n".join(lines) + "\n" + styles


def render(profile: str, data: dict, styles: str, views: str) -> str:
    # The complete Timo views block stays unchanged except for references that
    # must point to the dashboard currently being rendered.
    body = views.replace("/dashboard-timo/", f"/dashboard-{profile}/")
    body = body.replace("template: timo_nav", f"template: {data['template']}")
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
