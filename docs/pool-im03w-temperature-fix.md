# IM-03-W / P03R pool temperature repair

## Scope

This branch prepares a Home Assistant repair for the pool thermometer without changing the live system outside explicitly approved diagnostic windows. Live HA, the IM-03-W gateway, Smart Life/Tuya devices, and network configuration remain read-only unless separately approved. GitHub development, tests, documentation, commits and draft-PR maintenance may continue independently of that live-system gate.

## Verified observations

- Home Assistant device: `Pool Basis`
- Gateway model: INKBIRD `IM-03-W`
- Tuya product ID: `vftsypplefmoy4uc`
- Existing HA entity: `sensor.pool_basis_temperatur`
- Current standard Tuya code used by HA: `va_temperature`
- Observed Tuya cloud raw value: `-200`
- Tuya scale: `1`, therefore HA correctly renders the supplied value as `-20.0 °C`
- Direct Tuya cloud status also reports `va_temperature=-200`; this is not a Home Assistant decimal-scaling defect.
- Current evidence does not support an offset, template correction, alternate decimal scaling, or guessed custom datapoint mapping.
- The normal Home Assistant Tuya sharing path does not expose the complete manufacturer-specific/raw datapoint set needed to identify the P03R channel.
- `localtuya` is present on live HA but has no configured entry for this device and remains untouched.

## Live diagnostic result — 2026-09-22

An explicitly approved temporary diagnostic bootstrap was deployed to live HA, config-checked successfully, run once, and removed again. The real IM-03-W was discovered at `192.168.178.56` and answered using Tuya protocol `3.4`.

The direct read-only local `status()` snapshot returned:

```json
{
  "9": "c",
  "114": 0,
  "115": 0,
  "116": 0,
  "117": 0,
  "118": 0,
  "119": 0,
  "120": 0,
  "121": 0,
  "122": 0,
  "123": 0,
  "124": 0,
  "128": true,
  "131": 3
}
```

The sanitized fixture is committed as `tests/fixtures/pool_im03w_live_status_20260922.json`. The real P03R water temperature is **not present in this normal gateway `status()` snapshot**. DP `1`/`va_temperature` is absent locally while the cloud path still exposes `-200`.

## Offline gateway/subdevice research

TinyTuya 1.20 exposes a gateway-only `subdev_query()` read path implemented with Tuya `LAN_EXT_STREAM` and `reqType=subdev_online_stat_query`. Its expected response reports child identifiers in `online`, `offline`, and `nearby` lists. This is a query operation, not a DP-control operation.

The branch now contains:

- `read_subdevice_directory()` in the local transport, using only `subdev_query()`.
- `tools/pool_im03w_subdev_inspect.py` to normalize subdevice-directory responses and common `cid` + `dps` child-report shapes offline.
- Unit coverage for child-ID discovery, nested/top-level child reports, and the no-guess behavior.
- Contract tests that forbid known control/write methods, including raw `send()` and `updatedps()`.

This does **not** prove that the proprietary RF P03R is represented as a Tuya child device. It establishes the next narrow read-only probe and the parser needed to evaluate its response without guessing.

## Working hypothesis

The P03R water temperature is likely reported on a manufacturer-specific RF/subsensor path while the standard cloud `va_temperature` remains at `-200`. Candidate mechanisms are now ordered as:

1. Tuya gateway subdevice directory/report (`subdev_query`, child `cid` reports).
2. Passive asynchronous gateway event frames carrying `cid`/DPS data.
3. A manufacturer-specific read-only path if the P03R is not represented as a Tuya child.

No production temperature mapping is assigned until a real value is observed and correlated with the physical display.

## Read-only discovery strategy

1. Query only the exact IM-03-W.
2. Do not pair, reset, update firmware, write any DP, or call control methods.
3. Keep local keys/tokens inside Home Assistant or transient process memory; never print or commit them.
4. Sanitize every captured response before committing fixtures.
5. Correlate any candidate value with the physical P03R display across multiple readings.
6. Preserve real negative temperatures and return unavailable when the P03R path is absent.

## Repair acceptance criteria

1. Identify the real P03R datapoint/subdevice field from read-only evidence.
2. Correlate it with the physical thermometer display across multiple readings.
3. Preserve real negative temperatures; do not treat every `-20.0 °C` as invalid.
4. Return unavailable when the P03R channel is absent/disconnected.
5. Survive gateway/P03R reconnect and Home Assistant restart.
6. Keep the existing entity untouched during initial validation.
7. Do not merge or deploy the production mapping until exact-head tests and live comparison are green and separately approved.

## Live-system boundary

Allowed without a new live-write approval:

- HA state/registry/log reads
- IM-03-W status/read requests only
- passive network/event evidence
- offline analysis of sanitized captures

Not allowed without separate explicit live approval:

- Home Assistant `/config` changes or deployment
- HA reload/restart for this fix
- Tuya/Smart Life DP writes or device configuration changes
- pairing, reset, firmware update or account/device migration
- network configuration changes

GitHub branch work, test development, documentation, commits, pushes, CI and draft-PR updates are not blocked by the live read-only rule.
