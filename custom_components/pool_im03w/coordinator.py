from __future__ import annotations

import logging
from typing import Any

from homeassistant.core import HomeAssistant
from homeassistant.helpers.update_coordinator import DataUpdateCoordinator, UpdateFailed

from . import PoolRuntimeData
from .const import DEFAULT_SCAN_INTERVAL, DOMAIN
from .local import PoolStatusError, read_raw_status

_LOGGER = logging.getLogger(__name__)


class PoolCoordinator(DataUpdateCoordinator[dict[str, Any]]):
    def __init__(self, hass: HomeAssistant, runtime: PoolRuntimeData) -> None:
        super().__init__(
            hass,
            _LOGGER,
            name=DOMAIN,
            update_interval=DEFAULT_SCAN_INTERVAL,
        )
        self.runtime = runtime

    async def _async_update_data(self) -> dict[str, Any]:
        try:
            return await self.hass.async_add_executor_job(read_raw_status, self.runtime)
        except PoolStatusError as err:
            raise UpdateFailed(str(err)) from err
