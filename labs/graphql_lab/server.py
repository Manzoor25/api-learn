"""A tiny GraphQL-shaped endpoint: connection cursors and a cost limit.

This is not a full GraphQL engine. It accepts one query shape so the lesson
is visible: ask for a page of edges, follow endCursor, and a query that is
too wide is rejected before the data is returned.
"""

from __future__ import annotations

import re

from fastapi import FastAPI
from pydantic import BaseModel

COST_LIMIT = 25


class Query(BaseModel):
    query: str


def parse_query(text: str) -> tuple[int, int, int]:
    first_match = re.search(r"first:\s*(\d+)", text)
    after_match = re.search(r'after:\s*"(\d+)"', text)
    first = int(first_match.group(1)) if first_match else 2
    after = int(after_match.group(1)) if after_match else 0
    # Each requested word costs a point. A huge field list should fail.
    cost = len(re.findall(r"[A-Za-z_]{2,}", text)) + first
    return first, after, cost


def create_app(count: int = 10) -> FastAPI:
    rows = [{"id": i, "name": f"item-{i}"} for i in range(1, count + 1)]
    app = FastAPI()

    @app.post("/graphql")
    def graphql(body: Query) -> dict:
        first, after, cost = parse_query(body.query)
        if cost > COST_LIMIT:
            return {"errors": [{"message": "query cost exceeded", "cost": cost, "limit": COST_LIMIT}]}
        chunk = [row for row in rows if row["id"] > after][:first]
        has_next = bool(chunk) and any(row["id"] > chunk[-1]["id"] for row in rows)
        return {
            "data": {
                "items": {
                    "edges": [{"cursor": str(row["id"]), "node": row} for row in chunk],
                    "pageInfo": {
                        "hasNextPage": has_next,
                        "endCursor": str(chunk[-1]["id"]) if chunk else None,
                    },
                }
            },
            "extensions": {"cost": cost},
        }

    return app
