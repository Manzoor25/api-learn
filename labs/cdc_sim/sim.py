"""A SQLite change log standing in for a database transaction log.

The application writes the business row and a change row together. A reader
snapshots, stores the log position, then streams later changes. A schema
change adds a column and the stream continues.
"""

from __future__ import annotations

import sqlite3
from pathlib import Path


def connect(path: Path) -> sqlite3.Connection:
    conn = sqlite3.connect(path)
    conn.row_factory = sqlite3.Row
    conn.executescript(
        """
        CREATE TABLE IF NOT EXISTS orders (id INTEGER PRIMARY KEY, amount REAL, status TEXT);
        CREATE TABLE IF NOT EXISTS changes (
            lsn INTEGER PRIMARY KEY AUTOINCREMENT,
            op TEXT NOT NULL,
            order_id INTEGER NOT NULL,
            payload TEXT NOT NULL
        );
        """
    )
    return conn


def _log(conn: sqlite3.Connection, op: str, order_id: int, payload: str) -> None:
    conn.execute(
        "INSERT INTO changes (op, order_id, payload) VALUES (?, ?, ?)",
        (op, order_id, payload),
    )


def upsert(conn: sqlite3.Connection, order_id: int, amount: float, status: str) -> None:
    conn.execute(
        "INSERT INTO orders (id, amount, status) VALUES (?, ?, ?) "
        "ON CONFLICT(id) DO UPDATE SET amount=excluded.amount, status=excluded.status",
        (order_id, amount, status),
    )
    _log(conn, "upsert", order_id, f"{amount}|{status}")
    conn.commit()


def delete(conn: sqlite3.Connection, order_id: int) -> None:
    conn.execute("DELETE FROM orders WHERE id = ?", (order_id,))
    _log(conn, "delete", order_id, "")
    conn.commit()


def snapshot(conn: sqlite3.Connection) -> tuple[list[dict], int]:
    rows = [dict(row) for row in conn.execute("SELECT id, amount, status FROM orders ORDER BY id")]
    position = conn.execute("SELECT COALESCE(MAX(lsn), 0) AS n FROM changes").fetchone()["n"]
    print(f"[cdc] snapshot rows={len(rows)} lsn={position}", flush=True)
    return rows, int(position)


def stream(conn: sqlite3.Connection, after_lsn: int) -> list[dict]:
    rows = [
        dict(row)
        for row in conn.execute(
            "SELECT lsn, op, order_id, payload FROM changes WHERE lsn > ? ORDER BY lsn",
            (after_lsn,),
        )
    ]
    print(f"[cdc] stream after={after_lsn} events={len(rows)}", flush=True)
    return rows


def add_note_column(conn: sqlite3.Connection) -> None:
    columns = {row["name"] for row in conn.execute("PRAGMA table_info(orders)")}
    if "note" not in columns:
        conn.execute("ALTER TABLE orders ADD COLUMN note TEXT")
        conn.commit()
    print("[cdc] schema added note", flush=True)
