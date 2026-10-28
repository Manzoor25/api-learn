# Microsoft Graph paging and delta

Identity and productivity. Fetched 2026-10-28.

- Paging: https://learn.microsoft.com/en-us/graph/paging
- `GET /users` returns a default of 100. More pages are an `@odata.nextLink` URL. Call it as-is.
- Delta: https://learn.microsoft.com/en-us/graph/delta-query-overview
- Delta is a pull for created, updated, and deleted entities. Change notifications are the push.
- Follow `@odata.nextLink` until `@odata.deltaLink`. A page does not contain both. Later calls use the delta link.

Lesson: notification plus delta is the combination pattern. The token is the watermark. Advance it after the merge, not before.
