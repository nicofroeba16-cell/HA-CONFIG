# IM-03-W / P03R pool temperature repair

## Scope

This branch prepares a Home Assistant repair for the pool thermometer without changing the live system. Live HA, the IM-03-W gateway, Smart Life/Tuya devices, and network configuration remain read-only until separately approved.

## Verified observations

- Home Assistant device: `Pool Basis`
- Gateway model: INKBIRD `IM-03-W`
- Existing HA entity: `sensor.pool_basis_temperatur`
- Current standard Tuya code used by HA: `va_temperature`
- Observed Tuya raw value: `-200`
- Tuya scale: `1`, therefore HA correctly renders the supplied value as `-20.0 °C`
- The reported raw value equals the lower boundary of the documented standard temperature range.
- The current evidence does not support applying an offset, template correction, or alternate decimal scaling.

## Working hypothesis

The P03R water temperature is likely reported on a manufacturer-specific channel/datapoint while the standard `va_temperature` datapoint remains at `-200`. The exact custom datapoint is intentionally not guessed in this branch.

## Repair acceptance criteria

1. Identify the real P03R datapoint from a read-only raw datapoint capture.
2. Correlate that datapoint with the physical thermometer display across multiple readings.
3. Preserve real negative temperatures; do not treat every `-20.0 °C` reading generically as invalid.
4. Return unavailable when the P03R channel is absent or disconnected instead of inventing a temperature.
5. Survive gateway/P03R reconnect and Home Assistant restart.
6. Keep the existing entity untouched during initial live validation.
7. Do not merge/deploy until the exact-head tests and live comparison are green.

## Branch tooling

`tools/pool_im03w_dp_inspect.py` accepts a sanitized saved JSON datapoint dump and performs offline inspection only. It exposes numeric datapoints for correlation but does not assign semantic meaning to custom datapoints.

## Remaining evidence gate

A read-only raw datapoint capture from the actual IM-03-W is still required before the production sensor implementation can be written. Until then this branch contains diagnostic tooling and tests only, not a guessed live fix.
