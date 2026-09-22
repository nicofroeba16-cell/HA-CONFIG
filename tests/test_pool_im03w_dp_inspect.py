import importlib.util
from pathlib import Path


MODULE_PATH = Path(__file__).resolve().parents[1] / "tools" / "pool_im03w_dp_inspect.py"
spec = importlib.util.spec_from_file_location("pool_im03w_dp_inspect", MODULE_PATH)
module = importlib.util.module_from_spec(spec)
assert spec.loader is not None
spec.loader.exec_module(module)


def test_extracts_plain_dps_mapping():
    payload = {"dps": {"1": -200, "9": "c", "101": 172}}
    assert module.extract_dps(payload) == {"1": -200, "9": "c", "101": 172}


def test_marks_standard_minimum_without_guessing_custom_mapping():
    result = module.inspect_payload({"dps": {"1": -200, "101": 172}})
    assert result["standard_temperature_c"] == -20.0
    assert result["standard_equals_known_minimum"] is True
    assert result["numeric_candidates"] == {"1": -200, "101": 172}


def test_extracts_shadow_property_shape():
    payload = {
        "properties": [
            {"dp_id": 1, "value": -200},
            {"dp_id": 101, "value": 172},
        ]
    }
    assert module.extract_dps(payload) == {"1": -200, "101": 172}


def test_non_numeric_standard_value_is_not_scaled():
    result = module.inspect_payload({"dps": {"1": "unknown"}})
    assert result["standard_temperature_c"] is None
    assert result["standard_equals_known_minimum"] is False
