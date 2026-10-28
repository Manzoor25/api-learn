# Sources

Checked 2026-10-28 unless a page's own date is noted. Vendor numbers below were read from the linked page or measured with a live call. If a number is missing, it was not verified. Do not fill it in from memory.

## Verified vendor or standard facts

| Fact | Where | Checked |
| --- | --- | --- |
| GitHub unauthenticated REST limit is 60 requests per hour per IP. Authenticated personal access tokens are 5,000 per hour. A secondary limit includes no more than 100 concurrent requests. Search and GraphQL have separate budgets. | https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api | 2026-10-28 |
| GitHub paginates with a `link` header (`rel="next"`, `prev`, `first`, `last`). The issues example on that page returns 30 issues even when more exist. `per_page` changes the page size. The maximum was not copied from the truncated page, so it is not quoted. | https://docs.github.com/en/rest/using-the-rest-api/using-pagination-in-the-rest-api | 2026-10-28 |
| Stripe list methods use `limit` (default 10, range 1 to 100), `starting_after`, and `ending_before`. Responses include `has_more`. | https://docs.stripe.com/api/pagination | 2026-10-28 |
| Microsoft Graph server-side paging: `GET /users` returns a default of 100. Further pages are an `@odata.nextLink` URL to call as-is. Page metadata says 2025-04-02; fetched 2026-10-28. | https://learn.microsoft.com/en-us/graph/paging | 2026-10-28 |
| Microsoft Graph delta query discovers created, updated, or deleted entities without a full read. It is a pull. Change notifications are the push. Pages use `@odata.nextLink` until `@odata.deltaLink`. A page does not contain both. Page updated 2026-05-14; fetched 2026-10-28. | https://learn.microsoft.com/en-us/graph/delta-query-overview | 2026-10-28 |
| Defender Vulnerability Management: JSON response is described as best for small organizations with less than 100-K devices. Via files is recommended for large organizations with more than 100-K devices. Data is a current snapshot, not history. A delta export is a date range, not a full export. | https://learn.microsoft.com/en-us/defender-endpoint/api/get-assessment-software-vulnerabilities | 2026-10-28 |
| Salesforce Bulk API 2.0 is asynchronous. More than 2,000 records is a good candidate. Jobs under 2,000 should use synchronous REST or SOAP. No SLA, because the work is background. | https://developer.salesforce.com/docs/platform/api-asynch/guide/asynch-api-intro.html | 2026-10-28 |
| FDIC BankFind institutions: `limit` and `offset`, default 10, maximum 10,000 in the OpenAPI spec. Live calls on 2026-10-28: `meta.total` was 27,835, `limit=10001` returned HTTP 400, `X-Ratelimit-Limit` was 20 with no window in the header. A polite full pull at page size 10,000 was 3 requests and 2.9 seconds. | https://api.fdic.gov/banks/docs/swagger.yaml and live `GET https://api.fdic.gov/banks/institutions` | 2026-10-28 |
| NVD CVE API 2.0 shape, measured with a live call: `startIndex`, `resultsPerPage`, `totalResults` (415,517 on that call). | `GET https://services.nvd.nist.gov/rest/json/cves/2.0?startIndex=0&resultsPerPage=1` | 2026-10-28 |

## Not verified, so not quoted as numbers

- NVD rate limits. https://nvd.nist.gov/developers/start-here is a client-rendered app. The static HTML fetched on 2026-10-28 did not include the numeric window. Secondary pages claim 5 requests per 30 seconds without a key and 50 with a key. Those numbers are **not** treated as verified here. Read the developers page the day you build the pull.
- GitHub `per_page` maximum. The pagination page was fetched, and the maximum was not in the portion read. Not quoted.
- Salesforce result `locator` and chunking. The intro page was fetched. The results-endpoint details were not re-read line by line, so they are not quoted.
- Prices, default retention, and throughput units for Kafka, Event Hubs, Kinesis, Pub/Sub, Fivetran, Airbyte, and Databricks. Names and roles are used as categories. Current numbers belong on the vendor page the day you buy.

## Pattern references (no numeric claim)

- GraphQL pagination overview: https://graphql.org/learn/pagination/
- GitHub GraphQL rate limits (separate from REST; read before estimating): https://docs.github.com/en/graphql/overview/rate-limits-and-query-limits-for-the-graphql-api
- SOAP 1.2: https://www.w3.org/TR/soap12-part1/
- gRPC core concepts: https://grpc.io/docs/what-is-grpc/core-concepts/
- OAuth 2.0: https://datatracker.ietf.org/doc/html/rfc6749
- GitHub webhook signature validation: https://docs.github.com/en/webhooks/using-webhooks/validating-webhook-deliveries
- Apache Kafka documentation: https://kafka.apache.org/documentation/
- Azure Event Hubs overview: https://learn.microsoft.com/en-us/azure/event-hubs/event-hubs-about
- Debezium PostgreSQL connector: https://debezium.io/documentation/reference/stable/connectors/postgresql.html
- Delta Sharing: https://delta.io/sharing/
- dlt intro: https://dlthub.com/docs/intro
- Airbyte docs: https://docs.airbyte.com/
- Microsoft Graph JSON batching: https://learn.microsoft.com/en-us/graph/json-batching
- MQTT: https://mqtt.org/
- Server-sent events: https://html.spec.whatwg.org/multipage/server-sent-events.html
- Apache Airflow docs: https://airflow.apache.org/docs/
- JDBC basics: https://docs.oracle.com/javase/tutorial/jdbc/basics/index.html
- Scraping practice site used only as an allowed example: https://books.toscrape.com/

Illustrative times in the decision guide and the race diagram are models. They are labeled as models in those pages. They are not measurements from this repo's labs. The FDIC 2.9 second pull is a measurement.
