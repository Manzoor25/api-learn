"""A small paginated API. Teaches offset, cursor, and keyset without a million rows."""

from __future__ import annotations

import base64
import hashlib
import hmac
import json

from fastapi import FastAPI, HTTPException, Query

SECRET = "lab-cursor"


def encode(last_id: int) -> str:
    payload = json.dumps({"last_id": last_id}).encode()
    sig = hmac.new(SECRET.encode(), payload, hashlib.sha256).hexdigest()[:12]
    body = base64.urlsafe_b64encode(payload).decode().rstrip("=")
    return f"{body}.{sig}"


def decode(token: str) -> int:
    try:
        body, sig = token.split(".", 1)
        padded = body + "=" * (-len(body) % 4)
        payload = base64.urlsafe_b64decode(padded.encode())
    except (ValueError, TypeError) as exc:
        raise HTTPException(status_code=400, detail="bad cursor") from exc
    expected = hmac.new(SECRET.encode(), payload, hashlib.sha256).hexdigest()[:12]
    if not hmac.compare_digest(expected, sig):
        raise HTTPException(status_code=400, detail="cursor signature mismatch")
    return int(json.loads(payload)["last_id"])


def create_app(rows: list[dict] | None = None, max_page: int = 5) -> FastAPI:
    data = rows or [{"id": i, "name": f"row-{i}"} for i in range(1, 21)]
    app = FastAPI()

    def page(items: list[dict], limit: int) -> dict:
        if limit > max_page:
            raise HTTPException(status_code=400, detail={"error": "page_size_exceeded", "max": max_page})
        return items

    @app.get("/offset")
    def offset(limit: int = 5, offset: int = 0) -> dict:
        chunk = page(data, limit) and data[offset : offset + limit]
        return {"data": chunk, "total": len(data), "has_more": offset + limit < len(data)}

    @app.get("/cursor")
    def cursor(limit: int = 5, cursor: str | None = None) -> dict:
        page(data, limit)
        after = decode(cursor) if cursor else 0
        chunk = [row for row in data if row["id"] > after][:limit]
        has_more = bool(chunk) and chunk[-1]["id"] < data[-1]["id"]
        return {
            "data": chunk,
            "has_more": has_more,
            "next_cursor": encode(chunk[-1]["id"]) if has_more else None,
        }

    @app.get("/keyset")
    def keyset(limit: int = 5, after_id: int = 0, end_id: int | None = None) -> dict:
        page(data, limit)
        chunk = [row for row in data if row["id"] > after_id and (end_id is None or row["id"] <= end_id)][:limit]
        more_pool = [row for row in data if row["id"] > after_id and (end_id is None or row["id"] <= end_id)]
        has_more = len(more_pool) > len(chunk)
        return {"data": chunk, "has_more": has_more}

    return app
