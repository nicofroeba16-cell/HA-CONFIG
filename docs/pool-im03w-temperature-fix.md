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
- The reported raw value equals the lower boundary of the standard Tuya temperature range exposed for the device.
- Direct Tuya cloud status also reports `va_temperature=-200`; this is not a Home Assistant decimal-scaling defect.
- Current evidence does not support applying an offset, template correction, alternate decimal scaling, or guessed custom datapoint mapping.
- The normal Home Assistant Tuya sharing path does not expose the complete manufacturer-specific/raw datapoint set needed to identify the P03R channel.
- The Tuya v2 shadow/raw-DP path is not available through the existing Home Assistant sharing token.
- `localtuya` is present on the live HA installation but has no configured entry for this device; it remains untouched.
- A Tuya Cloud project limited to the China data center is not used to migrate or re-pair the existing Smart Life device.

## Live diagnostic result — 2026-09-22

An explicitly approved temporary diagnostic bootstrap was deployed to live HA, config-checked successfully, run once, and then removed again. The live IM-03-W was discovered locally at `192.168.178.56` and answered using Tuya protocol `3.4`.

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

The sanitized fixture is committed as `tests/fixtures/pool_im03w_live_status_20260922.json`.

This is an important negative result: the real P03R water temperature is **not present in the normal gateway `status()` snapshot**. DP `1`/`va_temperature` is absent locally, while the cloud path continues to expose `va_temperature=-200`. Therefore a simple switch from cloud `va_temperature` to local gateway `status()` is not sufficient.

The next evidence target is the IM-03-W RF/subsensor reporting path: a passive push/event frame, subdevice query, or another read-only datapoint query that reveals the P03R channel. No production temperature DP is assigned until that evidence exists.

## Working hypothesis

The P03R water temperature is likely reported on a manufacturer-specific RF/subsensor channel while the standard cloud `va_temperature` datapoint remains at `-200`. The exact custom datapoint is intentionally not guessed. `-200` is treated as an observed boundary value/likely placeholder for this device path, not as a universal invalid-temperature sentinel.

A second live observation is a Tuya discovery/device-map inconsistency for the IM-03-W in Home Assistant. It may affect later updates, but it does not explain the initial `-200` value because that same value is already supplied by Tuya cloud status. The raw-P03R datapoint problem and the discovery race therefore remain separate until evidence proves a causal link.

## Read-only discovery strategy

1. Prefer an already-authorized local status/query path to the exact IM-03-W only.
2. Do not pair, reset, update firmware, or write any DP.
3. Keep local keys/tokens inside Home Assistant or transient process memory; never print or commit them.
4. Sanitize every captured dump before committing fixtures; never commit tokens, local keys, device secrets, account identifiers, or unrelated device data.
5. Correlate candidate numeric DPs with the physical P03R display across multiple readings before assigning semantics.
6. The standard `status()` path is now proven insufficient; continue with passive event/subdevice evidence before adding a production sensor.

## Repair acceptance criteria

1. Identify the real P03R datapoint or subdevice field from read-only evidence.
2. Correlate that value with the physical thermometer display across multiple readings.
3. Preserve real negative temperatures; do not treat every `-20.0 °C` reading generically as invalid.
4. Return unavailable when the P03R channel is absent or disconnected instead of inventing a temperature.
5. Survive gateway/P03R reconnect and Home Assistant restart.
6. Keep the existing entity untouched during initial live validation.
7. Do not deploy or merge the production implementation until exact-head tests and live comparison are green and the separate live/merge gates are approved.

## Branch tooling

`tools/pool_im03w_dp_inspect.py` accepts sanitized saved JSON datapoint dumps and performs offline inspection only. It exposes numeric datapoints for correlation but does not assign semantic meaning to custom datapoints.

The dedicated `pool_im03w` integration candidate contains a read-only local transport based on `tinytuya.status()`, a diagnostic coordinator/sensor, and an opt-in YAML diagnostic bootstrap. The transport contract tests reject known Tuya control methods and diagnostic output is not allowed to expose local keys or authentication secrets.

## Remaining evidence gate

The first real local status capture is complete, but it does not contain the P03R temperature. The remaining evidence gate is therefore narrower: capture the read-only RF/subsensor event/query path that carries the actual P03R reading and correlate it with the physical display. Until then there is still no justified production temperature mapping.

## Live-system boundary

Allowed without a new live-write approval:

- HA state/registry/log reads
- IM-03-W status/read requests only
- passive network/event evidence
- offline analysis of sanitized captures

Not allowed without a separate explicit live approval:

- Home Assistant `/config` changes or deployment
- HA reload/restart for this fix
- Tuya/Smart Life DP writes or device configuration changes
- pairing, reset, firmware update or account/device migration
- network configuration changes

GitHub branch work, test development, documentation, commits, pushes, CI and draft-PR updates are not blocked by the live read-only rule.
