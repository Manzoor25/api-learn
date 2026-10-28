"""An in-process log with partitions, a consumer group, and checkpoints.

Commit after the sink write. Killing a member reassigns its partitions.
Uncommitted records are replayed. Committed ones are not.
"""

from __future__ import annotations


class Log:
    def __init__(self, partitions: int = 3) -> None:
        self.partitions = [[] for _ in range(partitions)]

    def produce(self, key: str, value: dict) -> int:
        index = sum(ord(ch) for ch in key) % len(self.partitions)
        self.partitions[index].append({"key": key, **value})
        return index


def assign(members: list[str], partitions: int) -> dict[str, list[int]]:
    owned = {member: [] for member in members}
    for index in range(partitions):
        owned[members[index % len(members)]].append(index)
    return owned


def poll(log: Log, partitions: list[int], committed: dict[int, int]) -> list[tuple[int, int, dict]]:
    batch = []
    for index in partitions:
        start = committed.get(index, 0)
        for offset, record in enumerate(log.partitions[index][start:], start=start):
            batch.append((index, offset, record))
    return batch


def commit(committed: dict[int, int], index: int, offset: int) -> None:
    """Store the next offset to read, after the record at `offset` was written."""
    committed[index] = offset + 1
