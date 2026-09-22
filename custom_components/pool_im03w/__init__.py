from __future__ import annotations

from dataclasses import dataclass

from homeassistant.config_entries import ConfigEntry
from homeassistant.const import Platform
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import ConfigEntryNotReady

from .const import CONF_DEVICE_ID, CONF_TUYA_ENTRY_ID

PLATFORMS = [Platform.SENSOR]


@dataclass
class PoolRuntimeData:
    device_id: str
    name: str
    address: str | None
    local_key: str
    protocol_version: str | None = None


type PoolConfigEntry = ConfigEntry[PoolRuntimeData]


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
