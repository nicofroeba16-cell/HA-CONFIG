from __future__ import annotations

from typing import Any

import voluptuous as vol

from homeassistant import config_entries
from homeassistant.core import HomeAssistant
from homeassistant.helpers import selector

from .const import CONF_DEVICE_ID, CONF_TUYA_ENTRY_ID, DOMAIN, PRODUCT_ID

CONF_TARGET = "target"


def _compatible_devices(hass: HomeAssistant) -> dict[str, str]:
    choices: dict[str, str] = {}
    for tuya_entry in hass.config_entries.async_entries("tuya"):
        listener = tuya_entry.runtime_data
        manager = getattr(listener, "manager", None) if listener is not None else None
        if manager is None:
            continue
        for device in manager.device_map.values():
            if getattr(device, "product_id", None) != PRODUCT_ID:
                continue
            key = f"{tuya_entry.entry_id}|{device.id}"
            label = device.name or getattr(device, "product_name", None) or "IM-03-W"
            choices[key] = label
    return choices


class PoolIm03wConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    VERSION = 1

    async def async_step_user(self, user_input: dict[str, Any] | None = None):
        choices = _compatible_devices(self.hass)
        if not choices:
            return self.async_abort(reason="no_devices")

        if user_input is not None:
            target = user_input[CONF_TARGET]
            tuya_entry_id, device_id = target.split("|", 1)
            await self.async_set_unique_id(device_id)
            self._abort_if_unique_id_configured()
            return self.async_create_entry(
                title=choices[target],
                data={
                    CONF_TUYA_ENTRY_ID: tuya_entry_id,
                    CONF_DEVICE_ID: device_id,
                },
            )

        options = [
            selector.SelectOptionDict(value=value, label=label)
            for value, label in choices.items()
        ]
        schema = vol.Schema(
            {
                vol.Required(CONF_TARGET): selector.SelectSelector(
                    selector.SelectSelectorConfig(options=options)
                )
            }
        )
        return self.async_show_form(step_id="user", data_schema=schema)
