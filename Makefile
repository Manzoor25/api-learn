PY ?= python3

.PHONY: site test

site:
	$(PY) -m http.server 8080

test:
	$(PY) -m pytest
