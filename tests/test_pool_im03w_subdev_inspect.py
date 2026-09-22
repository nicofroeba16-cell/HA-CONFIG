import importlib.util
import unittest
from pathlib import Path


MODULE_PATH = Path(__file__).resolve().parents[1] / "tools" / "pool_im03w_subdev_inspect.py"
spec = importlib.util.spec_from_file_location("pool_im03w_subdev_inspect", MODULE_PATH)
module = importlib.util.module_from_spec(spec)
assert spec.loader is not None
spec.loader.exec_module(module)


class PoolIm03wSubdeviceInspectTests(unittest.TestCase):
    def test_extracts_subdevice_directory_ids_without_duplicates(self):
        payload = {
            "reqType": "subdev_online_stat_report",
            "data": {
                "online": ["child-a"],
                "offline": ["child-b"],
                "nearby": ["child-a", "child-c"],
            },
        }
        self.assertEqual(
            module.extract_subdevice_ids(payload),
            ["child-a", "child-b", "child-c"],
        )

    def test_extracts_nested_child_dp_report(self):
        payload = {"data": {"cid": "child-a", "dps": {101: 172, "9": "c"}}}
        self.assertEqual(
            module.extract_child_report(payload),
            {"cid": "child-a", "dps": {"101": 172, "9": "c"}},
        )

    def test_extracts_top_level_child_dp_report(self):
        payload = {"cid": "child-a", "dps": {"101": 172}}
        self.assertEqual(
            module.extract_child_report(payload),
            {"cid": "child-a", "dps": {"101": 172}},
        )

    def test_does_not_invent_child_report(self):
        self.assertIsNone(module.extract_child_report({"data": {"online": []}}))


if __name__ == "__main__":
    unittest.main()
