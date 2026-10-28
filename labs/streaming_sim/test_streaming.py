from labs.streaming_sim.sim import Log, assign, commit, poll


def test_rebalance_replays_only_uncommitted_records():
    log = Log()
    for i in range(6):
        log.produce(f"device-{i}", {"n": i})
    members = ["a", "b"]
    owned = assign(members, 3)
    committed = {0: 0, 1: 0, 2: 0}
    first = poll(log, owned["a"], committed)
    assert first
    # Write the first record, then crash before commit. Replay must include it.
    crashed = poll(log, owned["a"], committed)
    assert crashed[0] == first[0]
    commit(committed, first[0][0], first[0][1])
    # b dies. a takes every partition. Already committed offsets are not reread.
    owned = assign(["a"], 3)
    again = poll(log, owned["a"], committed)
    assert all(offset >= committed[index] for index, offset, _record in again)
    assert (first[0][0], first[0][1]) not in {(index, offset) for index, offset, _record in again}
    print(f"[stream] replayed {len(again)} after committing 1", flush=True)
