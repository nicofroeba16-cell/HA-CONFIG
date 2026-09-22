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

## Live local-status diagnostic — 2026-09-22

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

## Gateway/subdevice research and live probe

TinyTuya 1.20 exposes a gateway-only `subdev_query()` read path implemented with Tuya `LAN_EXT_STREAM` and `reqType=subdev_online_stat_query`. Its known response form reports child identifiers in `online`, `offline`, and `nearby` lists. This is a query operation, not a DP-control operation.

The branch contains:

- `read_subdevice_directory()` in the local transport, using only `subdev_query()`.
- `tools/pool_im03w_subdev_inspect.py` for child-directory responses and common `cid` + `dps` report shapes.
- Unit coverage for child-ID extraction, nested/top-level child reports, duplicate suppression, and no-guess behavior.
- Contract tests that forbid known control/write methods including `set_*`, `send_commands`, raw `send()`, and `updatedps()`.

An explicitly approved second one-shot live diagnostic deployed the CI-green subdevice bootstrap, passed `ha core check`, and issued exactly one `subdev_query()` to the real IM-03-W. The gateway did **not** return a usable child-directory response. Home Assistant logged `POOL_IM03W_SUBDEV_ERROR type=PoolStatusError` after roughly 20 seconds.

This result must not be overinterpreted as "there are no subdevices". It currently means only that the standard TinyTuya gateway query did not yield the expected response. Plausible classes are timeout/no response, an unsupported gateway query, or a response shape without the expected `data` object. The diagnostic was improved afterward to log only this sanitized reason string on a future run; no second live query has been made yet.

The live diagnostic files and YAML were rolled back, rollback `ha core check` returned `RC=0`, Home Assistant was restarted, and the frontend returned HTTP 200 afterward.

## Passive Tuya MQTT event capture

The Tuya Device Sharing SDK already maintains an MQTT stream for device reports. Its `SharingMQ` object supports additional message listeners, so a diagnostic observer can attach to the existing stream without issuing any device command, opening a second device socket, or altering the Tuya subscription set.

The SDK receives protocol-4 device reports in raw `data.status` form before its normal manager mapping. For devices with local strategy enabled, the manager discards unknown `dpId` values that are not present in `device.local_strategy`. This makes the pre-manager MQTT message boundary the strongest current candidate for seeing manufacturer-specific P03R datapoints that Home Assistant never exposes as normal entity state.

The branch therefore now contains `event_capture.py` with:

- target-device filtering by `devId`;
- protocol-4 device-report filtering;
- sanitization limited to `dpId`, `code`, `value`, and timestamp `t`;
- an observer-only `attach_passive_mq_capture()` helper using only `add_message_listener()` / `remove_message_listener()`;
- tests proving unrelated devices/protocols are ignored and the listener detaches cleanly.

No temperature datapoint is inferred from these structures. A real incoming report must be observed and correlated with the physical P03R display before any production mapping is implemented.

## Candidate path order

1. Prefer a bounded passive capture from the already-running Tuya MQTT stream; this can reveal raw manufacturer-specific `dpId` reports without polling or controlling the gateway.
2. If no useful report arrives during a realistic P03R reporting interval, inspect passive local Tuya-3.4 gateway traffic next.
3. If a child identifier or candidate raw DP is observed, correlate it across multiple physical temperature readings before assigning semantics.

No production temperature mapping is assigned until a real value is observed and correlated with the physical P03R display.

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
