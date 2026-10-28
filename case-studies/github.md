# GitHub REST

Developer tools. Checked 2026-10-28 against GitHub Docs.

- Rate limits: https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api
- Unauthenticated: 60 requests per hour per IP.
- Personal access token: 5,000 requests per hour.
- Secondary limit: no more than 100 concurrent requests. Search and GraphQL have their own budgets.
- Pagination: https://docs.github.com/en/rest/using-the-rest-api/using-pagination-in-the-rest-api
- A `link` header carries `rel="next"`. The issues example returns 30 results even when more exist.

Lesson: a Link header is easy to ignore if you only parse JSON. Ignoring it stops the pull after page one.
