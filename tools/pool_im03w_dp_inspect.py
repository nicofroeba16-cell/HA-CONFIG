#!/usr/bin/env python3
"""Offline inspection helper for sanitized IM-03-W datapoint dumps.

No network access. No device writes. No guessed P03R mapping.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any


def extract_dps(payload: Any) -> dict[str, Any]:
    if isinstance(payload, dict):
        dps = payload.get("dps")
        if isinstance(dps, dict):
            return {str(key): value for key, value in dps.items()}
        result = payload.get("result")
        if result is not None:
            nested = extract_dps(result)
            if nested:
                return nested
        properties = payload.get("properties")
        if isinstance(properties, list):
            return _extract_list(properties)
    if isinstance(payload, list):
        return _extract_list(payload)
    return {}


def _extract_list(items: list[Any]) -> dict[str, Any]:
    found: dict[str, Any] = {}
    for item in items:
        if not isinstance(item, dict) or "value" not in item:
            continue
        key = item.get("dp_id", item.get("dpId", item.get("code")))
        if key is not None:
            found[str(key)] = item["value"]
    return found


def scaled_standard_temperature(raw_value: Any, scale: int = 1) -> float | None:
    if isinstance(raw_value, bool) or not isinstance(raw_value, (int, float)):
        return None
    return raw_value / (10**scale)


def numeric_candidates(dps: dict[str, Any]) -> dict[str, int | float]:
    return {
        key: value
        for key, value in dps.items()
        if isinstance(value, (int, float)) and not isinstance(value, bool)
    }


def inspect_payload(payload: Any) -> dict[str, Any]:
    dps = extract_dps(payload)
    standard = dps.get("1", dps.get("va_temperature"))
    return {
        "dps": dps,
        "standard_temperature_c": scaled_standard_temperature(standard),
        "standard_equals_known_minimum": standard == -200,
        "numeric_candidates": numeric_candidates(dps),
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Inspect a saved IM-03-W datapoint dump offline")
    parser.add_argument("json_file", type=Path)
    args = parser.parse_args()
    payload = json.loads(args.json_file.read_text(encoding="utf-8"))
    print(json.dumps(inspect_payload(payload), indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
