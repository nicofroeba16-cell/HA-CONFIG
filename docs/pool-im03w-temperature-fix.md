# IM-03-W / P03R pool temperature repair

## Scope

This branch prepares a Home Assistant repair for the pool thermometer without changing the live system outside explicitly approved diagnostic windows. Live HA, the IM-03-W gateway, Smart Life/Tuya devices, and network configuration remain read-only unless separately approved. GitHub development, tests, documentation, commits and draft-PR maintenance may continue independently of that live-system gate.

## Verified observations

- Home Assistant device: `Pool Basis`
- Gateway model: INKBIRD `IM-03-W`
- Tuya product ID: `vftsypplefmoy4uc`
- Existing HA entity: `sensor.pool_basis_temperatur`
- Tuya cloud reports `va_temperature=-200` with scale `1`; HA therefore correctly renders `-20.0 °C`.
- This is not a Home Assistant decimal-scaling defect.
- No offset/template/alternate scaling is justified by current evidence.
- `localtuya` is present on live HA but has no configured entry for this device and remains untouched.

## Live diagnostic result — 2026-09-22

The approved one-shot diagnostic found the real IM-03-W at `192.168.178.56`, Tuya protocol `3.4`. Its read-only local `status()` snapshot was:

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

The sanitized fixture is `tests/fixtures/pool_im03w_live_status_20260922.json`. The actual P03R temperature is **not present** in the normal gateway `status()` snapshot. Local DP `1`/`va_temperature` is absent while the cloud path still reports `-200`.

## Offline gateway/subdevice research

TinyTuya 1.20 exposes a gateway-only `subdev_query()` read path implemented with Tuya `LAN_EXT_STREAM` and `reqType=subdev_online_stat_query`. Its known response form reports child identifiers in `online`, `offline`, and `nearby` lists. This is a query operation, not a DP-control operation.

The branch now contains:

- `read_subdevice_directory()` in the local transport, using only `subdev_query()`.
- `tools/pool_im03w_subdev_inspect.py` for child-directory responses and common `cid` + `dps` report shapes.
- Unit coverage for child-ID extraction, nested/top-level child reports, duplicate suppression, and no-guess behavior.
- Contract tests that forbid known control/write methods including `set_*`, `send_commands`, raw `send()`, and `updatedps()`.

This does **not** yet prove that the proprietary RF P03R is represented as a Tuya child device. It establishes the next narrow read-only probe and the parser needed to evaluate the result safely.

## Candidate path order

1. Query the IM-03-W subdevice directory with `subdev_query()`.
2. If a child ID appears, capture passive/read-only child reports carrying `cid` + `dps`.
3. If no child exists, investigate a manufacturer-specific RF/read-only path instead of guessing Tuya child semantics.

No production temperature mapping is assigned until a real value is observed and correlated with the physical P03R display.

## Next live diagnostic gate

The next live action, if separately approved, is deliberately minimal:

1. Backup current HA config/component target.
2. Deploy the exact CI-green diagnostic branch head only.
3. `ha core check`.
4. Run **one** IM-03-W `subdev_query()` through the existing Tuya local key held inside HA.
5. Log only sanitized response fields; never log the local key/token.
6. Roll the diagnostic files/config back immediately and config-check the rollback.

No DP writes, pairing, reset, firmware action, Smart Life change, network change, production sensor swap, merge, or release are part of this gate.

## Repair acceptance criteria

1. Identify the real P03R datapoint/subdevice field from read-only evidence.
2. Correlate it with the physical thermometer display across multiple readings.
3. Preserve real negative temperatures; do not treat every `-20.0 °C` as invalid.
4. Return unavailable when the P03R channel is absent/disconnected.
5. Survive gateway/P03R reconnect and Home Assistant restart.
6. Keep the existing entity untouched during initial validation.
7. Do not merge/deploy the production mapping until exact-head tests and live comparison are green and separately approved.

## Live-system boundary

Allowed without a new live-write approval: HA state/registry/log reads, IM-03-W status/read requests, passive event evidence, and offline analysis of sanitized captures.

Not allowed without separate explicit live approval: `/config` changes/deployment, HA restart/reload for this fix, Tuya/Smart Life writes/configuration, pairing/reset/firmware changes, device migration, or network configuration changes.

GitHub development/CI/PR maintenance is not blocked by the live read-only rule.
