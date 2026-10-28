from fastapi.testclient import TestClient

from labs.graphql_lab.server import create_app


def test_cursor_connection_walks_every_node():
    client = TestClient(create_app())
    after = None
    ids = []
    for _ in range(10):
        args = "first: 3" if after is None else f'first: 3, after: "{after}"'
        query = "{ items(" + args + ") { edges { cursor node { id name } } pageInfo { hasNextPage endCursor } } }"
        body = client.post("/graphql", json={"query": query}).json()
        assert "errors" not in body
        edges = body["data"]["items"]["edges"]
        ids.extend(edge["node"]["id"] for edge in edges)
        print(f"[graphql] after={after} ids={[edge['node']['id'] for edge in edges]}", flush=True)
        if not body["data"]["items"]["pageInfo"]["hasNextPage"]:
            break
        after = body["data"]["items"]["pageInfo"]["endCursor"]
    assert ids == list(range(1, 11))


def test_wide_query_is_rejected_on_cost():
    client = TestClient(create_app())
    query = "{ items(first: 20) { edges { cursor node { id name description vendor region extra } } } }"
    body = client.post("/graphql", json={"query": query}).json()
    assert body["errors"][0]["message"] == "query cost exceeded"
