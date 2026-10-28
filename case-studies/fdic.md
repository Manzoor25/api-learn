# FDIC BankFind

Government open data. Checked 2026-10-28.

- Docs and spec: https://api.fdic.gov/banks/docs/ and https://api.fdic.gov/banks/docs/swagger.yaml
- Institutions use `limit` and `offset`. Default 10. Maximum 10,000. `limit=10001` returned HTTP 400.
- Total is `meta.total`. On the live call that day it was 27,835.
- A pull at page size 10,000 was 3 requests and 2.9 seconds, with a client cap of 2 requests per second.
- `X-Ratelimit-Limit: 20` was on the responses. The header did not name the window. That number is not a plan.

Lesson: read the maximum page size before you add threads. Here the maximum turned thousands of default-size calls into three.
