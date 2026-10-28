# Salesforce Bulk API 2.0

CRM. Fetched 2026-10-28.

https://developer.salesforce.com/docs/platform/api-asynch/guide/asynch-api-intro.html

- The Bulk APIs are asynchronous. You submit work and come back.
- More than 2,000 records is a good candidate for Bulk API 2.0.
- Jobs under 2,000 should use synchronous REST or SOAP.
- There is no SLA, because the work runs in the background.

Lesson: "async" means you poll, and you do not promise a minute. It also means you should not page a large extract through the synchronous API just because it is familiar.

Result-file locator details were not re-read line by line, so they are not quoted. See [SOURCES.md](../SOURCES.md).
