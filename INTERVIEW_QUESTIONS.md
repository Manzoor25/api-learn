# Interview questions

Fifty questions a system-design interview can ask about moving data, with the answer I would want to hear. Eight whiteboard exercises are at the end. Vendor numbers are only the ones in [SOURCES.md](SOURCES.md).

## Questions

1. **Why do APIs cap page size?** A single response can exhaust memory, die at a gateway timeout, and starve other tenants. The cap is fairness and survival. It is not the size of the table.

2. **What is the difference between offset and keyset?** Offset skips N rows in the current order. Keyset seeks to the last key you saw. Offset gets slower with depth and drifts if rows move. Keyset stays cheap if the key is indexed, and it can be split into ranges.

3. **Why can't you parallelize a cursor?** The next token is produced by the previous response. A signed or opaque token cannot be forged. Page 40 does not exist until page 39 returns.

4. **When is parallel offset acceptable?** When each page has its own offset, the table is not changing, and you are under the rate limit. It is still the wrong tool if rows are moving. Prefer keyset ranges.

5. **What does Retry-After mean?** The earliest time you should call again. Ignoring it turns a 429 into a retry storm. If it is missing, use exponential backoff with jitter.

6. **Which status codes do you retry?** 429, 500, 502, 503, 504, timeouts, and connection resets. Not 400, 401, 403, or 404, except a single token refresh on 401.

7. **Why does a header that says 20 not tell you the pull time?** You do not know the window. 20 per second and 20 per minute differ by 60x. Do not invent the window. FDIC returned `X-Ratelimit-Limit: 20` with no window. That fact is in SOURCES.md.

8. **When does concurrency stop helping?** When `pages / allowed_rate` is larger than `pages * latency / concurrency`. Past that point, threads buy 429s.

9. **What is an idempotent write?** Doing it twice leaves the same rows. Dedup on a stable primary key. If two versions exist, keep the newer `updated_at` or the higher log position.

10. **Why write the page before the checkpoint?** If you die between them, the next run overwrites that page file. If you checkpoint first and die before the write, you skip a page.

11. **Why is "count the rows" not enough?** Duplicates can make the count match while keys are missing. Compare unique keys to the source total, and scan for gaps when ids are dense.

12. **How does offset duplicate a row it already returned?** A row inserted, or moved, into the consumed part of the sort shifts the tail. The next "skip N" lands on a row you have seen, and a row that jumped backward is never visited.

13. **What watermark should an incremental job store?** The server's delta token, or the server clock at the start of a successful run. The max `updated_at` you happened to see can skip a row committed during the run.

14. **Why are webhooks not enough?** They drop, duplicate, expire, and arrive out of order. They are a hint. A reconciliation pull against the source of truth fills the gaps.

15. **What do you check before you parse a webhook?** The signature over the raw body, and a timestamp if the vendor sends one, so a replay of an old body fails. Then dedup on the event id. Ack fast. Do the work on a queue.

16. **What is a signed URL failure?** The download starts after expiry and gets 403. The snapshot still exists. Ask the job API for a new URL. Do not treat 403 as an empty file, and do not mint your own URL.

17. **Why is a bulk export usually faster than paging?** You pay for a job and a download, not for a round trip per page. Salesforce's own intro says more than 2,000 records is a good candidate for Bulk API 2.0. The file is a snapshot, not a tail.

18. **What is the Defender JSON versus via-files split?** Microsoft's page says JSON responses fit small organizations with less than 100-K devices, and via-files is recommended above that. It is a snapshot, not history. Do not generalize the 100-K number to every security API.

19. **What is the difference between a queue and a log?** A queue deletes on read. A log keeps events for the retention window and lets each consumer group keep its own offset. Replay needs a log.

20. **Where is order guaranteed in Kafka-style systems?** Inside one partition, not across the topic. Partition by the entity that must stay in order, usually the account or device, not a random key.

21. **When do you commit a consumer offset?** After the sink write succeeds. Commit before the write and a crash loses events. A crash after the write and before the commit replays them. The sink must be idempotent.

22. **What happens when lag exceeds retention?** Those events are gone. That is data loss. Alert on lag against retention, not only on process uptime.

23. **What is a CDC snapshot handoff?** Copy the table, record the log position at that moment, then apply log events after that position. Miss the handoff and you gap or overlap. Overlap is safe if the sink dedups. A gap is not.

24. **Why not `SELECT *` from the primary?** You can lock rows, fill temp space, and miss deletes. Use a replica, an indexed range, a query budget, or the log.

25. **What is the outbox pattern?** The application writes the business change and an event row in one transaction. A publisher reads the outbox. You do not leak the engine's log format, and you do not have a dual-write race.

26. **When do you buy a connector?** The source is common, the latency and cost fit, and your edge is the model. You still own credentials, schema tests, and a reconciliation count. A green connector check is not a business rule.

27. **When do you build?** The source is odd, the connector hides a limit you cannot accept, or the data cannot leave a network the vendor cannot see.

28. **What is a done marker?** Proof the writer finished. A temporary name plus rename, or a `.done` file written after the flush. Loaders that ignore it will load a half-written file and call it the shipment.

29. **How do you handle schema drift?** Land raw so a new field is not lost. Contract silver. Additive fields can be ignored until you opt in. Type changes and renames fail the batch into quarantine. Do not coerce quietly.

30. **What is a data contract?** Required fields, types, and who may change them. Test it on every batch. It is the agreement, not a hope.

31. **Bronze, silver, gold?** Bronze is as received, plus ingest metadata. Silver is typed, deduped, and contracted. Gold is what a decision queries. Gold should be rebuildable from silver. Silver should be rebuildable from bronze.

32. **Why not hold the dataset in a list?** Memory grows without a bound, and a crash throws away every page. Stream each page to disk. Compact later.

33. **Async, threads, or processes?** Async and threads help when you are waiting on the network. Processes help when parsing is CPU-bound. None of them raise a rate limit.

34. **What is a circuit breaker?** Closed: calls go through. Open: fail fast after repeated failures. Half-open: one trial. It stops a retry storm against a dead source.

35. **What is a bulkhead?** A cap on how much of the pool one source can use. One slow API should not consume every thread.

36. **How do you handle token expiry mid-pull?** Refresh once, retry the same page, keep the checkpoint. If refresh fails, stop. Do not restart from zero. A restart can duplicate or waste the landed pages.

37. **Where do secrets live?** A secret store, injected at runtime. Not in git, not in logs, not in bronze. Read-only scope.

38. **What is least privilege for an extract?** The identity can read the one collection. It cannot write, and it cannot see the rest of the tenant. Separate credentials per environment.

39. **What does data residency change?** The bytes may not be allowed to leave a region or a tenant. A convenient SaaS extractor can violate that. Ask before you connect.

40. **How do you detect a silent empty day?** Alert when today's count is zero and yesterday's was not, and when the reconciliation gap is non-zero. A green task is not a count.

41. **What metrics matter per family?** Pages and 429 rate for APIs. Job duration and URL expiry for exports. Drop rate for webhooks. Lag and DLQ depth for streams. Slot or log position age for CDC. Schema failures for files.

42. **How do you backfill without corrupting the live watermark?** Run the backfill as its own range, writing the same idempotent keys, without moving the live token backward. Isolate it in the orchestrator.

43. **Page 0 or page 1?** Read the docs. An off-by-one skips or repeats a whole page. This course's lab uses page 1 as the first page when it uses page numbers. Do not assume that of a vendor.

44. **What is OData nextLink?** A URL for the next page. Call it as-is. Microsoft Graph uses it, and uses deltaLink when a delta round is finished. Do not rebuild the query string yourself.

45. **GraphQL subscriptions versus a query?** A subscription is a push of later events. It is not a backfill. Query or export history first, then subscribe or poll a delta.

46. **Why can a SOAP call be HTTP 200 and still failed?** The fault is in the envelope. Parse it. Do not land a fault as a row.

47. **What is query time-slicing?** The same query, narrower time or key bounds, because the engine caps rows, bytes, or time. Or turn it into an async job. Do not deep-offset a search API that forbids it.

48. **When is scraping acceptable?** When there is no official feed, the terms and robots.txt allow it, and you are not taking personal data you have no right to. It will break. Prefer an API. Practice on a site that invites it. Do not bypass controls.

49. **Why is an emailed CSV a bad API?** The schema is a human's export settings. Columns move. There is no tombstone and no event id. Validate the header or quarantine. Replace it.

50. **What do you ask in the first ten minutes with a new API?** The pagination style, the maximum page size, the rate-limit window, whether a bulk export or `updated_since` exists, the primary key, and what a delete looks like. Then measure one page. Then estimate.

## Whiteboard exercises

### 1. 50 million CRM records

Draw source, bulk export job, object store, bronze, silver. Mark the snapshot time on the files. Add a delta path for the next day. Call out expiring URLs and the idempotent merge key. Say why you are not paging 50,000 calls.

### 2. Government API, 1,000-row pages, tight limit

Draw the formula: pages, latency, concurrency, rate floor. Show threads bouncing off 429. Show the three exits: documented max page size, a key if the terms allow, or a file. Do not draw a thread pool as the fix.

### 3. Order webhooks

Draw sender, signature check, dedup store, queue, worker, and a scheduled reconcile against the orders API. Show one dropped POST and the pull that fills it. Show one duplicate and the event id that ignores it.

### 4. SQL Server to a lakehouse

Draw primary, log, CDC reader, bronze changes, silver current table. Mark the snapshot log position. Show a delete as a tombstone. Show what happens if the reader stops and the log disk fills.

### 5. IoT, one reading a second

Draw devices, MQTT or a bus, partitions keyed by device, consumers, lake. Show a disconnect and a resume token. Show why a REST call per reading falls behind. Mention order is per device, not global.

### 6. Nightly SFTP file

Draw writer, temp name, rename, done marker, loader, quarantine, archive. Show the failure of reading the file before the marker. Show the header check.

### 7. Exactly-once claim

Draw producer, log, consumer, sink. Mark the crash window after the write and before the offset commit. Show the duplicate event. Show the primary key that makes the second write a no-op. Say you did not build distributed transactions.

### 8. Unknown API in a week

Draw the checklist: one example call, pagination style, max page, total field, rate window, filters, export, primary key. Then the connector boxes: auth, pager strategy, limiter, retry, state, sink, metrics. End with a contract test that injects 429 and a timeout.
