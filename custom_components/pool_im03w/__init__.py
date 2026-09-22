from __future__ import annotations

import asyncio
from dataclasses import dataclass
import json
import logging

from homeassistant.config_entries import ConfigEntry
from homeassistant.const import Platform
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import ConfigEntryNotReady

from .const import CONF_DEVICE_ID, CONF_TUYA_ENTRY_ID, DOMAIN, PRODUCT_ID

PLATFORMS = [Platform.SENSOR]
_LOGGER = logging.getLogger(__name__)


@dataclass
class PoolRuntimeData:
    device_id: str
    name: str
    address: str | None
    local_key: str
    protocol_version: str | None = None


type PoolConfigEntry = ConfigEntry[PoolRuntimeData]


async def _find_live_manager_device(hass: HomeAssistant):
    for _ in range(10):
        for tuya_entry in hass.config_entries.async_entries("tuya"):
            listener = tuya_entry.runtime_data
            manager = getattr(listener, "manager", None) if listener is not None else None
            if manager is None:
                continue
            for device in manager.device_map.values():
                if getattr(device, "product_id", None) != PRODUCT_ID:
                    continue
                return manager, device
        await asyncio.sleep(2)
    return None, None


async def async_setup(hass: HomeAssistant, config: dict) -> bool:
    """Run an opt-in passive capture on the existing Tuya MQTT stream."""
    settings = config.get(DOMAIN)
    if not isinstance(settings, dict):
        return True

    capture_seconds = int(settings.get("passive_capture_seconds", 0))
    if capture_seconds <= 0:
        return True

    manager, device = await _find_live_manager_device(hass)
    if manager is None or device is None:
        _LOGGER.error("POOL_IM03W_EVENT_ERROR device_not_available")
        return True

    from .event_capture import attach_passive_mq_capture

    def sink(report: dict) -> None:
        _LOGGER.warning(
            "POOL_IM03W_EVENT %s",
            json.dumps(report, sort_keys=True, ensure_ascii=False),
        )

    try:
        detach = attach_passive_mq_capture(manager, device.id, sink)
    except RuntimeError as err:
        _LOGGER.error("POOL_IM03W_EVENT_ERROR reason=%s", str(err))
        return True

    _LOGGER.warning("POOL_IM03W_EVENT_CAPTURE_STARTED seconds=%s", capture_seconds)

    async def stop_capture() -> None:
        try:
            await asyncio.sleep(capture_seconds)
        finally:
            detach()
            _LOGGER.warning("POOL_IM03W_EVENT_CAPTURE_STOPPED")

    hass.async_create_task(stop_capture(), "pool_im03w passive event capture")
    return True


async def async_setup_entry(hass: HomeAssistant, entry: PoolConfigEntry) -> bool:
    tuya_entry = hass.config_entries.async_get_entry(entry.data[CONF_TUYA_ENTRY_ID])
    if tuya_entry is None or tuya_entry.runtime_data is None:
        raise ConfigEntryNotReady("Tuya integration is not ready")

    manager = getattr(tuya_entry.runtime_data, "manager", None)
    if manager is None:
        raise ConfigEntryNotReady("Tuya manager is not available")

    device = manager.device_map.get(entry.data[CONF_DEVICE_ID])
    if device is None:
        raise ConfigEntryNotReady("IM-03-W is not present in the Tuya device map")
    if not getattr(device, "local_key", None):
        raise ConfigEntryNotReady("IM-03-W local key is unavailable")

    entry.runtime_data = PoolRuntimeData(
        device_id=device.id,
        name=device.name or "Pool IM-03-W",
        address=getattr(device, "ip", None) or None,
        local_key=device.local_key,
    )
    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    return True


async def async_unload_entry(hass: HomeAssistant, entry: PoolConfigEntry) -> bool:
    return await hass.config_entries.async_unload_platforms(entry, PLATFORMS)
