from __future__ import annotations

from typing import Any

import tinytuya

from . import PoolRuntimeData
from .const import PROTOCOL_VERSIONS


class PoolStatusError(RuntimeError):
    pass


def _protocol_candidates(runtime: PoolRuntimeData, discovered: dict[str, Any] | None) -> list[str]:
    values: list[str] = []
    if discovered and discovered.get("version"):
        values.append(str(discovered["version"]))
    if runtime.protocol_version:
        values.append(runtime.protocol_version)
    values.extend(PROTOCOL_VERSIONS)
    return list(dict.fromkeys(values))


def read_raw_status(runtime: PoolRuntimeData) -> dict[str, Any]:
    """Read current IM-03-W status without sending control commands."""
    discovered: dict[str, Any] | None = None
    try:
        found = tinytuya.find_device(dev_id=runtime.device_id)
        if isinstance(found, dict):
            discovered = found
    except Exception:
        discovered = None

    address = runtime.address
    if discovered and discovered.get("ip"):
        address = str(discovered["ip"])
    if not address:
        address = "Auto"

    last_error: str | None = None
    for version in _protocol_candidates(runtime, discovered):
        try:
            device = tinytuya.Device(
                runtime.device_id,
                address,
                runtime.local_key,
                version=float(version),
                connection_timeout=3,
            )
            response = device.status()
        except Exception as err:
            last_error = type(err).__name__
            continue

        if not isinstance(response, dict):
            last_error = "unexpected response type"
            continue
        dps = response.get("dps")
        if not isinstance(dps, dict):
            last_error = str(response.get("Error", "missing dps"))
            continue

        runtime.address = None if address == "Auto" else address
        runtime.protocol_version = version
        return {str(key): value for key, value in dps.items()}

    raise PoolStatusError(last_error or "no readable local status response")
