import json
import random

from labs.webhooks.flow import deliver, receive, reconcile


def test_bad_signature_is_rejected_and_duplicates_do_not_double():
    secret = "test-secret"
    source = [{"id": f"e{i}", "n": i} for i in range(1, 6)]
    seen: dict[str, dict] = {}
    calls = deliver(source, secret, drop_rate=0, duplicate_rate=1, rng=random.Random(1))
    assert len(calls) == 10
    for body, signature in calls:
        assert receive(seen, body, signature, secret) in {"accepted", "duplicate"}
    assert receive(seen, calls[0][0], "deadbeef", secret) == "rejected"
    assert list(seen) == [event["id"] for event in source]


def test_reconciliation_recovers_drops():
    secret = "test-secret"
    source = [{"id": f"e{i}", "n": i} for i in range(1, 11)]
    seen: dict[str, dict] = {}
    for body, signature in deliver(source, secret, drop_rate=0.4, duplicate_rate=0.2, rng=random.Random(2)):
        receive(seen, body, signature, secret)
    assert len(seen) < len(source)
    missing = reconcile(source, seen)
    assert missing
    assert set(seen) == {event["id"] for event in source}
    assert json.loads(json.dumps(seen["e1"]))["n"] == 1
