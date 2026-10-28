# Connector template

Copy `connector.py` when you point this lab at a real REST API.

1. Set `API_LEARN_TOKEN` in the environment if the API needs a bearer token. Do not commit the token.
2. Change `get` so it calls your base URL. Keep the function signature `(path, params, headers)`.
3. If the docs say cursor or offset, replace the loop. Do not force keyset onto a cursor API.
4. Keep the rule: write the page file, then write `state.json`.
5. Point the sink at your lake only after `pytest` still passes against the mock.

The pagination lab's server is a fine mock. See `test_connector.py`.
