from __future__ import annotations

from typing import Any

from homeassistant.components.sensor import SensorEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import EntityCategory
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback
from homeassistant.helpers.update_coordinator import CoordinatorEntity

from . import PoolRuntimeData
from .coordinator import PoolCoordinator


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ConfigEntry[PoolRuntimeData],
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    coordinator = PoolCoordinator(hass, entry.runtime_data)
    await coordinator.async_config_entry_first_refresh()
    async_add_entities([PoolRawDpSensor(coordinator, entry.runtime_data)])


class PoolRawDpSensor(CoordinatorEntity[PoolCoordinator], SensorEntity):
    _attr_entity_category = EntityCategory.DIAGNOSTIC
    _attr_has_entity_name = True
    _attr_name = "Raw DP probe"

    def __init__(self, coordinator: PoolCoordinator, runtime: PoolRuntimeData) -> None:
        super().__init__(coordinator)
        self._runtime = runtime
        self._attr_unique_id = f"{runtime.device_id}_raw_dp_probe"

    @property
    def native_value(self) -> int:
        return len(self.coordinator.data or {})

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        return {
            "raw_dps": dict(self.coordinator.data or {}),
            "protocol_version": self._runtime.protocol_version,
            "address": self._runtime.address,
        }
