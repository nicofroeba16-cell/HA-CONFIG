import ast
import json
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
COMPONENT = ROOT / "custom_components" / "pool_im03w"


class PoolIm03wComponentContractTests(unittest.TestCase):
    def test_manifest_uses_existing_tuya_and_pinned_tinytuya(self):
        manifest = json.loads((COMPONENT / "manifest.json").read_text())
        self.assertEqual(manifest["domain"], "pool_im03w")
        self.assertIn("tuya", manifest["dependencies"])
        self.assertEqual(manifest["iot_class"], "local_polling")
        self.assertEqual(manifest["requirements"], ["tinytuya==1.20.0"])

    def test_component_python_files_parse(self):
        for path in COMPONENT.glob("*.py"):
            with self.subTest(path=path.name):
                ast.parse(path.read_text(), filename=str(path))

    def test_local_transport_has_only_read_queries(self):
        tree = ast.parse((COMPONENT / "local.py").read_text())
        attrs = {
            node.func.attr
            for node in ast.walk(tree)
            if isinstance(node, ast.Call) and isinstance(node.func, ast.Attribute)
        }
        self.assertIn("status", attrs)
        self.assertIn("subdev_query", attrs)
        forbidden = {
            "set_value",
            "set_status",
            "set_multiple_values",
            "turn_on",
            "turn_off",
            "send_commands",
            "updatedps",
            "send",
        }
        self.assertTrue(attrs.isdisjoint(forbidden), attrs & forbidden)

    def test_probe_does_not_guess_temperature_dp(self):
        source = (COMPONENT / "sensor.py").read_text()
        self.assertNotIn("temperature_dp", source)
        self.assertNotIn("va_temperature", source)

    def test_probe_does_not_expose_secrets(self):
        source = (COMPONENT / "sensor.py").read_text()
        forbidden = {
            '"local_key"',
            "'local_key'",
            '"access_token"',
            "'access_token'",
            '"refresh_token"',
            "'refresh_token'",
            '"client_secret"',
            "'client_secret'",
        }
        for marker in forbidden:
            with self.subTest(marker=marker):
                self.assertNotIn(marker, source)


if __name__ == "__main__":
    unittest.main()
