"""German-language and iOS 27 design-contract checks for the dashboard simulation."""
from pathlib import Path
import re
import unittest

ROOT = Path(__file__).resolve().parents[1]
DASHBOARDS = ROOT / "dashboards"
OPTIK = (ROOT / "apple-optik.js").read_text()
MASTER = (DASHBOARDS / "zuhause.yaml").read_text()
GENERATOR = (ROOT / "generate_personal_dashboards.py").read_text()

class LanguageAuditTests(unittest.TestCase):
    def test_no_known_english_user_visible_dashboard_labels(self):
        banned = [
            "label: Home",
            "Health · System",
            "Live-Status & Navigation",
            "Live-Status und Navigation",
            "Letztes Backup",
            "Kein erfolgreiches Backup bekannt",
            "System & Geräte",
            "Netzwerk · Backup",
            "Internet Status",
            "System Updates",
            "Home Assistant & Backup",
            "Core Update",
            "OS Update",
            "Letztes Backup",
            "primary: Backup",
            "Presence & Akkus",
            "Status & Akku",
            "Licht Master",
            "Medien Master",
            "TV Master",
        ]
        for dashboard in sorted(DASHBOARDS.glob("*.yaml")):
            text = dashboard.read_text()
            for token in banned:
                with self.subTest(dashboard=dashboard.name, token=token):
                    self.assertNotIn(token, text)

    def test_visible_connectivity_wording_is_german(self):
        for dashboard in sorted(DASHBOARDS.glob("*.yaml")):
            text = dashboard.read_text()
            self.assertNotIn("'Online' if", text, dashboard.name)
            self.assertNotIn("'Offline' if", text, dashboard.name)
            self.assertIn("Internetstatus", text)

    def test_custom_card_labels_and_accessibility_are_german(self):
        for token in [
            'aria-label="Power"',
            'aria-label="Play"',
            '|| "Player"',
            'playing ? "Pause" : "Play"',
            'name: "iOS Media Player"',
            'description: "Now Playing',
            'name: "iOS Light"',
        ]:
            self.assertNotIn(token, OPTIK)
        for token in [
            'aria-label="Ein/Aus"',
            'aria-label="Wiedergabe"',
            'name: "iOS Medienwiedergabe"',
            'name: "iOS Licht"',
        ]:
            self.assertIn(token, OPTIK)
    def test_personal_nav_generator_uses_german_home_label(self):
        self.assertNotIn('("mdi:home", "haus", "Home")', GENERATOR)
        self.assertIn('("mdi:home", "haus", "Zuhause")', GENERATOR)


class IOS27DesignAuditTests(unittest.TestCase):
    def test_no_forced_dark_mode(self):
        self.assertNotIn('style.colorScheme = "dark"', OPTIK)
        self.assertIn("color-scheme: light dark;", OPTIK)

    def test_control_layer_is_adaptive_and_content_layer_not_glass(self):
        for token in [
            "--apple-content-surface:",
            "--apple-control-glass:",
            "--apple-control-glass-opaque:",
            "@media (prefers-reduced-transparency: reduce)",
        ]:
            self.assertIn(token, OPTIK)
        media_css = OPTIK.split("/* ===== media-player ===== */", 1)[1]
        media_css = media_css.split("function fmtTime", 1)[0]
        light_css = OPTIK.split("/* ===== light-card ===== */", 1)[1]
        light_css = light_css.split("const POWER", 1)[0]
        self.assertNotIn("backdrop-filter", media_css)
        self.assertNotIn("backdrop-filter", light_css)
    def test_primary_custom_touch_targets_are_44pt(self):
        self.assertRegex(
            OPTIK,
            r"\.btn \{[^}]*width: 44px; height: 44px;",
        )
        self.assertRegex(
            OPTIK,
            r"\.appchip \{[^}]*height: 44px;",
        )
        self.assertRegex(
            OPTIK,
            r"\.tile \{[^}]*width: 44px; height: 44px;",
        )
        self.assertGreaterEqual(OPTIK.count("width: 44px; height: 44px"), 4)

    def test_safe_area_and_accessibility_motion_contracts_remain(self):
        self.assertIn("env(safe-area-inset-bottom, 0px)", MASTER)
        self.assertIn("@media (prefers-reduced-motion: reduce)", OPTIK)
        self.assertIn("@media (prefers-reduced-transparency: reduce)", OPTIK)
        self.assertIn("apple-wash-animating", OPTIK)

    def test_gradient_base_tracks_home_assistant_appearance(self):
        mobile = (ROOT / "apple-mobile-gradient.js").read_text()
        self.assertIn("var(--primary-background-color, #000)", OPTIK)
        self.assertIn("var(--primary-background-color, #000000)", mobile)
        self.assertNotIn('style.colorScheme = "dark"', OPTIK)

    def test_acceptance_surface_is_german_and_content_is_not_glass(self):
        sim = (ROOT / "tests/motion-sim.html").read_text()
        for token in ["Motion Lab", "Sheet öffnen", ">Player<", "Dashboard navigation", "Offline"]:
            self.assertNotIn(token, sim)
        self.assertIn("Systemaktualisierungen", sim)
        self.assertIn("Sicherung · Anwesenheit · Internetstatus", sim)
        demo_css = re.search(r"\.demo-card \{([^}]*)\}", sim, re.S)[1]
        self.assertNotIn("backdrop-filter", demo_css)

    def test_navigation_glass_remains_functional_layer(self):
        self.assertIn(".navbar.mobile ha-card", OPTIK)
        self.assertIn("var(--apple-control-glass-strong", OPTIK)
        self.assertIn("app-header", OPTIK)
        self.assertIn("var(--apple-control-glass", OPTIK)


if __name__ == "__main__":
    unittest.main(verbosity=2)
