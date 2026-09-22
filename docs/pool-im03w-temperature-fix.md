# IM-03-W / P03R pool temperature repair

## Scope

This branch prepares a Home Assistant repair for the pool thermometer without changing the live system. Live HA, the IM-03-W gateway, Smart Life/Tuya devices, and network configuration remain read-only until separately approved. GitHub development, tests, documentation, commits and draft-PR maintenance are allowed to continue independently of that live-system gate.

## Verified observations

- Home Assistant device: `Pool Basis`
- Gateway model: INKBIRD `IM-03-W`
- Existing HA entity: `sensor.pool_basis_temperatur`
- Current standard Tuya code used by HA: `va_temperature`
- Observed Tuya raw value: `-200`
- Tuya scale: `1`, therefore HA correctly renders the supplied value as `-20.0 °C`
- The reported raw value equals the lower boundary of the standard Tuya temperature range exposed for the device.
- Direct Tuya cloud status also reports `va_temperature=-200`; this is not a Home Assistant decimal-scaling defect.
- Current evidence does not support applying an offset, template correction, alternate decimal scaling, or guessed custom datapoint mapping.
- The normal Home Assistant Tuya sharing path does not expose the complete manufacturer-specific/raw datapoint set needed to identify the P03R channel.
- The Tuya v2 shadow/raw-DP path is not available through the existing Home Assistant sharing token.
- `localtuya` is present on the live HA installation but has no configured entry for this device; it is intentionally left untouched.
- A Tuya Cloud project limited to the China data center is not used for the production investigation because the existing Smart Life account/device is not being migrated or re-paired.

## Working hypothesis

The P03R water temperature is likely reported on a manufacturer-specific channel/datapoint while the standard `va_temperature` datapoint remains at `-200`. The exact custom datapoint is intentionally not guessed in this branch. `-200` is treated as an observed boundary value/likely placeholder for this device path, not as a universal invalid-temperature sentinel.

A second live observation is a Tuya discovery/device-map inconsistency for the IM-03-W in Home Assistant. It may affect later updates, but it does not explain the initial `-200` value because that same value is already supplied by Tuya cloud status. The raw-P03R datapoint problem and the discovery race therefore remain separate until evidence proves a causal link.

## Read-only discovery strategy

1. Prefer an already-authorized local status query to the exact IM-03-W only.
2. Do not broadcast-control, pair, reset, update firmware, or write any DP.
3. If a local key/status path already exists, use it only to obtain the complete current DP map.
4. Sanitize any captured dump before committing fixtures; never commit tokens, local keys, device secrets, account identifiers, or unrelated device data.
5. Correlate candidate numeric DPs with the physical P03R display across multiple readings before assigning semantics.

## Repair acceptance criteria

1. Identify the real P03R datapoint from a read-only raw datapoint capture.
2. Correlate that datapoint with the physical thermometer display across multiple readings.
3. Preserve real negative temperatures; do not treat every `-20.0 °C` reading generically as invalid.
4. Return unavailable when the P03R channel is absent or disconnected instead of inventing a temperature.
5. Survive gateway/P03R reconnect and Home Assistant restart.
6. Keep the existing entity untouched during initial live validation.
7. Do not deploy or merge the production implementation until exact-head tests and live comparison are green and the separate live/merge gates are approved.

## Branch tooling

`tools/pool_im03w_dp_inspect.py` accepts a sanitized saved JSON datapoint dump and performs offline inspection only. It exposes numeric datapoints for correlation but does not assign semantic meaning to custom datapoints.

The helper and tests are deliberately offline-first so raw evidence can be captured read-only, sanitized, and analyzed without granting the development code any live-device write capability.

## Remaining evidence gate

A read-only raw datapoint capture from the actual IM-03-W is still required before the production sensor implementation can be written. Until then this branch contains diagnostic tooling, evidence documentation and tests only, not a guessed live fix.

## Live-system boundary

Allowed without a new live-write approval:

- HA state/registry/log reads
- IM-03-W status/read requests only
- passive network identity evidence
- offline analysis of sanitized captures

Not allowed without a separate explicit live approval:

- Home Assistant `/config` changes or deployment
- HA reload/restart for this fix
- Tuya/Smart Life DP writes or device configuration changes
- pairing, reset, firmware update or account/device migration
- network configuration changes

GitHub branch work, test development, documentation, commits, pushes, CI and draft-PR updates are not blocked by the live read-only rule.