"""Client strategies. `get` is any callable (path, params) -> dict, so tests need no socket."""

from __future__ import annotations


def pull_offset(get, page_size: int = 5) -> list[dict]:
    offset = 0
    rows: list[dict] = []
    while True:
        page = get("/offset", {"limit": page_size, "offset": offset})
        rows.extend(page["data"])
        print(f"[offset] offset={offset} got={len(page['data'])} total_so_far={len(rows)}", flush=True)
        if not page["data"] or not page["has_more"]:
            break
        offset += len(page["data"])
    return rows


def pull_cursor(get, page_size: int = 5) -> list[dict]:
    cursor = None
    rows: list[dict] = []
    while True:
        page = get("/cursor", {"limit": page_size, "cursor": cursor})
        rows.extend(page["data"])
        print(f"[cursor] got={len(page['data'])} has_more={page['has_more']}", flush=True)
        if not page["data"] or not page["has_more"]:
            break
        cursor = page["next_cursor"]
    return rows


def pull_keyset(get, page_size: int = 5, start_after: int = 0, end_id: int | None = None) -> list[dict]:
    after = start_after
    rows: list[dict] = []
    while True:
        params = {"limit": page_size, "after_id": after}
        if end_id is not None:
            params["end_id"] = end_id
        page = get("/keyset", params)
        rows.extend(page["data"])
        print(f"[keyset] after_id={after} got={len(page['data'])}", flush=True)
        if not page["data"] or not page["has_more"]:
            break
        after = page["data"][-1]["id"]
    return rows


def pull_partitioned(get, parts: int = 2, page_size: int = 5) -> list[dict]:
    """Independent key ranges. Safe to run together because each range is closed."""
    width = 20 // parts
    rows: list[dict] = []
    for index in range(parts):
        start = index * width
        end = 20 if index == parts - 1 else (index + 1) * width
        rows.extend(pull_keyset(get, page_size=page_size, start_after=start, end_id=end))
    return rows
