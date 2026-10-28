"""Fill this in for a REST API.

Required pieces, in the order a run uses them:
1. Config: base URL, page size, auth header name. Secrets come from the environment.
2. Auth: a callable that returns headers. Replace bearer() for OAuth refresh.
3. Pager: keyset by default. Swap in offset or cursor if the docs say so.
4. Limiter: a minimum gap between calls. This is not a substitute for Retry-After.
5. State: the last id, written after the page file.
6. Sink: NDJSON, overwritten per cursor so a resume does not append twice.
"""

from __future__ import annotations

import json
import os
import time
from pathlib import Path


def bearer() -> dict[str, str]:
    token = os.environ.get("API_LEARN_TOKEN", "")
    if not token:
        return {}
    return {"Authorization": f"Bearer {token}"}


class Connector:
    def __init__(self, get, out_dir: Path, page_size: int = 5, min_interval_s: float = 0.0) -> None:
        self.get = get
        self.out_dir = Path(out_dir)
        self.page_size = page_size
        self.min_interval_s = min_interval_s
        self.state_path = self.out_dir / "state.json"
        self.out_dir.mkdir(parents=True, exist_ok=True)

    def load_state(self) -> int:
        if not self.state_path.exists():
            return 0
        return int(json.loads(self.state_path.read_text(encoding="utf-8"))["after_id"])

    def save_state(self, after_id: int, records: int) -> None:
        self.state_path.write_text(
            json.dumps({"after_id": after_id, "records": records}),
            encoding="utf-8",
        )

    def run(self) -> int:
        after = self.load_state()
        seen = 0
        headers = bearer()
        while True:
            if self.min_interval_s:
                time.sleep(self.min_interval_s)
            page = self.get("/keyset", {"after_id": after, "limit": self.page_size}, headers)
            path = self.out_dir / f"after_{after}.ndjson"
            lines = [json.dumps(row) for row in page["data"]]
            path.write_text(("\n".join(lines) + "\n") if lines else "", encoding="utf-8")
            seen += len(page["data"])
            print(f"[connector] after={after} wrote={len(page['data'])}", flush=True)
            if page["data"]:
                after = page["data"][-1]["id"]
            self.save_state(after, seen)
            if not page["data"] or not page["has_more"]:
                break
        return seen
