from fastapi.testclient import TestClient

from labs.pagination.client import pull_cursor, pull_keyset, pull_offset, pull_partitioned
from labs.pagination.server import create_app


def _get(client: TestClient):
    def get(path, params):
        response = client.get(path, params={k: v for k, v in params.items() if v is not None})
        assert response.status_code == 200, response.text
        return response.json()

    return get


def test_offset_cursor_keyset_and_partitions_match():
    client = TestClient(create_app())
    get = _get(client)
    expected = list(range(1, 21))
    assert [row["id"] for row in pull_offset(get)] == expected
    assert [row["id"] for row in pull_cursor(get)] == expected
    assert [row["id"] for row in pull_keyset(get)] == expected
    partitioned = pull_partitioned(get, parts=4)
    assert sorted(row["id"] for row in partitioned) == expected
    assert len(partitioned) == len(expected)


def test_oversized_page_is_rejected():
    client = TestClient(create_app())
    response = client.get("/offset", params={"limit": 100})
    assert response.status_code == 400
    assert response.json()["detail"]["error"] == "page_size_exceeded"


def test_forged_cursor_is_rejected():
    client = TestClient(create_app())
    response = client.get("/cursor", params={"cursor": "bm90.dead"})
    assert response.status_code == 400
