from __future__ import annotations

from typing import Any


def extract_subdevice_ids(payload: dict[str, Any]) -> list[str]:
    """Extract child identifiers from a TinyTuya subdev_query response."""
    data = payload.get("data")
    if not isinstance(data, dict):
        return []

    ids: list[str] = []
    for key in ("online", "offline", "nearby"):
        values = data.get(key)
        if not isinstance(values, list):
            continue
        for value in values:
            if isinstance(value, str) and value not in ids:
                ids.append(value)
    return ids


def extract_child_report(payload: dict[str, Any]) -> dict[str, Any] | None:
    """Normalize common gateway child-report shapes without guessing semantics."""
    candidates: list[dict[str, Any]] = [payload]
    data = payload.get("data")
    if isinstance(data, dict):
        candidates.append(data)

    for item in candidates:
        cid = item.get("cid")
        dps = item.get("dps")
        if isinstance(cid, str) and isinstance(dps, dict):
            return {
                "cid": cid,
                "dps": {str(key): value for key, value in dps.items()},
            }
    return None


def inspect_payload(payload: dict[str, Any]) -> dict[str, Any]:
    return {
        "subdevice_ids": extract_subdevice_ids(payload),
        "child_report": extract_child_report(payload),
    }
