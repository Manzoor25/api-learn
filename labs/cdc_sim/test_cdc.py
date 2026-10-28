from labs.cdc_sim.sim import add_note_column, connect, delete, snapshot, stream, upsert


def test_snapshot_then_stream_includes_delete_and_survives_schema_change(tmp_path):
    conn = connect(tmp_path / "cdc.db")
    upsert(conn, 1, 10, "open")
    upsert(conn, 2, 20, "open")
    rows, position = snapshot(conn)
    assert [row["id"] for row in rows] == [1, 2]
    upsert(conn, 1, 15, "paid")
    delete(conn, 2)
    changes = stream(conn, position)
    assert [change["op"] for change in changes] == ["upsert", "delete"]
    add_note_column(conn)
    upsert(conn, 3, 5, "open")
    later = stream(conn, changes[-1]["lsn"])
    assert later[-1]["order_id"] == 3
    conn.close()
