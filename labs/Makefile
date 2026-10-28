PY ?= python3

.PHONY: test api

test:
	$(PY) -m pytest

api:
	$(PY) -m uvicorn labs.pagination.server:create_app --factory --port 8090
