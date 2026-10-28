from fastapi.testclient import TestClient

from labs.connector_template.connector import Connector
from labs.pagination.server import create_app


def test_connector_resumes_without_duplicating_pages(tmp_path):
    client = TestClient(create_app())

    def get(path, params, headers):
        assert "Authorization" not in headers or headers["Authorization"].startswith("Bearer ")
        response = client.get(path, params=params)
        assert response.status_code == 200
        return response.json()

    first = Connector(get, tmp_path, page_size=5)
    # Stop early by pretending the first save is the crash boundary.
    page = get("/keyset", {"after_id": 0, "limit": 5}, {})
    (tmp_path).mkdir(parents=True, exist_ok=True)
    (tmp_path / "after_0.ndjson").write_text("\n".join(__import__("json").dumps(row) for row in page["data"]) + "\n", encoding="utf-8")
    first.save_state(page["data"][-1]["id"], len(page["data"]))
    second = Connector(get, tmp_path, page_size=5)
    total = second.run()
    ids = []
    for path in sorted(tmp_path.glob("after_*.ndjson")):
        for line in path.read_text(encoding="utf-8").splitlines():
            if line:
                ids.append(__import__("json").loads(line)["id"])
    assert sorted(ids) == list(range(1, 21))
    assert len(ids) == 20
    assert total == 15
