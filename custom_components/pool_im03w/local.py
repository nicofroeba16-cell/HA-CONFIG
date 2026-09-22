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


def _discover(runtime: PoolRuntimeData) -> dict[str, Any] | None:
    try:
        found = tinytuya.find_device(dev_id=runtime.device_id)
    except Exception:
        return None
    return found if isinstance(found, dict) else None


def _address(runtime: PoolRuntimeData, discovered: dict[str, Any] | None) -> str:
    if discovered and discovered.get("ip"):
        return str(discovered["ip"])
    return runtime.address or "Auto"


def _device(runtime: PoolRuntimeData, address: str, version: str):
    return tinytuya.Device(
        runtime.device_id,
        address,
        runtime.local_key,
        version=float(version),
        connection_timeout=3,
    )


def read_raw_status(runtime: PoolRuntimeData) -> dict[str, Any]:
    """Read current IM-03-W status without sending control commands."""
    discovered = _discover(runtime)
    address = _address(runtime, discovered)
    last_error: str | None = None

    for version in _protocol_candidates(runtime, discovered):
        try:
            response = _device(runtime, address, version).status()
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


def read_subdevice_directory(runtime: PoolRuntimeData) -> dict[str, Any]:
    """Query gateway sub-device presence without issuing control commands."""
    discovered = _discover(runtime)
    address = _address(runtime, discovered)
    last_error: str | None = None

    for version in _protocol_candidates(runtime, discovered):
        try:
            response = _device(runtime, address, version).subdev_query()
        except Exception as err:
            last_error = type(err).__name__
            continue

        if not isinstance(response, dict):
            last_error = "unexpected response type"
            continue
        data = response.get("data")
        if not isinstance(data, dict):
            last_error = str(response.get("Error", "missing data"))
            continue

        runtime.address = None if address == "Auto" else address
        runtime.protocol_version = version
        return response

    raise PoolStatusError(last_error or "no readable sub-device response")
