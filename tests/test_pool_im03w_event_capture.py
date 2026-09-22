import importlib.util
import unittest
from pathlib import Path


MODULE_PATH = (
    Path(__file__).resolve().parents[1]
    / "custom_components"
    / "pool_im03w"
    / "event_capture.py"
)
spec = importlib.util.spec_from_file_location("pool_im03w_event_capture", MODULE_PATH)
module = importlib.util.module_from_spec(spec)
assert spec.loader is not None
spec.loader.exec_module(module)


class FakeMQ:
    def __init__(self):
        self.listeners = set()

    def add_message_listener(self, listener):
        self.listeners.add(listener)

    def remove_message_listener(self, listener):
        self.listeners.discard(listener)


class FakeManager:
    def __init__(self):
        self.mq = FakeMQ()


class PoolIm03wEventCaptureTests(unittest.TestCase):
    def test_sanitizes_target_device_report(self):
        msg = {
            "protocol": 4,
            "data": {
                "devId": "pool-device",
                "status": [
                    {"dpId": 101, "value": 173, "t": 1234, "secret": "drop"},
                    {"code": "temp", "value": 17.3},
                ],
            },
        }
        self.assertEqual(
            module.sanitize_device_report(msg, "pool-device"),
            {
                "protocol": 4,
                "status": [
                    {"dpId": 101, "value": 173, "t": 1234},
                    {"code": "temp", "value": 17.3},
                ],
            },
        )

    def test_ignores_other_device_and_other_protocol(self):
        self.assertIsNone(
            module.sanitize_device_report(
                {"protocol": 4, "data": {"devId": "other", "status": []}},
                "pool-device",
            )
        )
        self.assertIsNone(
            module.sanitize_device_report(
                {"protocol": 20, "data": {"devId": "pool-device"}},
                "pool-device",
            )
        )

    def test_attach_is_observer_only_and_detaches(self):
        manager = FakeManager()
        captured = []
        detach = module.attach_passive_mq_capture(manager, "pool-device", captured.append)
        self.assertEqual(len(manager.mq.listeners), 1)
        listener = next(iter(manager.mq.listeners))
        listener(
            {
                "protocol": 4,
                "data": {
                    "devId": "pool-device",
                    "status": [{"dpId": 103, "value": 172}],
                },
            }
        )
        self.assertEqual(captured[0]["status"][0]["dpId"], 103)
        detach()
        self.assertEqual(manager.mq.listeners, set())


if __name__ == "__main__":
    unittest.main()
