from __future__ import annotations

from collections.abc import Callable
from typing import Any


def sanitize_device_report(
    message: dict[str, Any], target_device_id: str
) -> dict[str, Any] | None:
    """Return a secret-free report for the selected Tuya device only."""
    if message.get("protocol") != 4:
        return None

    data = message.get("data")
    if not isinstance(data, dict) or data.get("devId") != target_device_id:
        return None

    status = data.get("status")
    if not isinstance(status, list):
        return None

    sanitized_status: list[dict[str, Any]] = []
    for item in status:
        if not isinstance(item, dict):
            continue
        clean: dict[str, Any] = {}
        for key in ("dpId", "code", "value", "t"):
            if key in item:
                clean[key] = item[key]
        if clean:
            sanitized_status.append(clean)

    if not sanitized_status:
        return None

    return {"protocol": 4, "status": sanitized_status}


def attach_passive_mq_capture(
    manager: Any,
    target_device_id: str,
    sink: Callable[[dict[str, Any]], None],
) -> Callable[[], None]:
    """Observe the already-running Tuya MQTT stream without device commands."""
    mq = getattr(manager, "mq", None)
    if mq is None:
        raise RuntimeError("Tuya MQTT stream is not available")

    def listener(message: dict[str, Any]) -> None:
        sanitized = sanitize_device_report(message, target_device_id)
        if sanitized is not None:
            sink(sanitized)

    mq.add_message_listener(listener)

    def detach() -> None:
        mq.remove_message_listener(listener)

    return detach
