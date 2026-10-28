"""Sender drops and duplicates. Receiver checks a signature and dedups. Reconciliation fills gaps."""

from __future__ import annotations

import hashlib
import hmac
import json
import random


def sign(body: bytes, secret: str) -> str:
    return hmac.new(secret.encode(), body, hashlib.sha256).hexdigest()


def deliver(events: list[dict], secret: str, drop_rate: float, duplicate_rate: float, rng: random.Random) -> list[tuple[bytes, str]]:
    sent = []
    for event in events:
        if rng.random() < drop_rate:
            print(f"[webhook] dropped {event['id']}", flush=True)
            continue
        body = json.dumps(event).encode()
        sent.append((body, sign(body, secret)))
        if rng.random() < duplicate_rate:
            sent.append((body, sign(body, secret)))
            print(f"[webhook] duplicated {event['id']}", flush=True)
    return sent


def receive(seen: dict[str, dict], body: bytes, signature: str, secret: str) -> str:
    expected = sign(body, secret)
    if not hmac.compare_digest(expected, signature):
        return "rejected"
    event = json.loads(body)
    if event["id"] in seen:
        return "duplicate"
    seen[event["id"]] = event
    return "accepted"


def reconcile(source: list[dict], seen: dict[str, dict]) -> list[dict]:
    missing = [event for event in source if event["id"] not in seen]
    for event in missing:
        seen[event["id"]] = event
    print(f"[reconcile] filled {len(missing)}", flush=True)
    return missing
