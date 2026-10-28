# Cheat sheet

One line per family: the limitation, the workaround, and what you land.

| Family | Limitation | Workaround | Land |
| --- | --- | --- | --- |
| REST offset / page number | Deep skip is slow. Rows that move cause gaps and duplicates. | Keyset or cursor if offered. Otherwise a snapshot export. | Page file, then checkpoint the next offset only if the table is frozen. |
| REST cursor / nextLink | You cannot invent the next token, so you cannot parallelize. | Sequential loop. Ask the owner for keyset or a file if it is too slow. | Page file named by cursor. Overwrite on resume. |
| REST keyset | Needs a stable sort key the API lets you filter on. | Cut the key into ranges and run those ranges together, under one limiter. | One file per range and cursor. Dedup on the key. |
| Rate limit | pages / allowed rate is a floor. Threads cannot beat it. | Larger pages, a key if the terms allow, export, or incremental. Honor Retry-After. | Checkpoint so the hour-long pull can resume. |
| GraphQL | One query can be too expensive. Cursors are still sequential. | Smaller pages, fewer fields, persisted queries. Follow endCursor. | Raw response plus query hash plus cursor. |
| SOAP | XML faults can hide inside HTTP 200. Paging is in the body. | Read the WSDL. Prefer a file if one exists. | Raw envelope plus parsed rows. |
| gRPC | A stream is not storage. Deadlines cancel the call. | Checkpoint the last id. Reopen with a new deadline. | Append messages, then advance the checkpoint. |
| Batch requests | The outer call can succeed while inner calls fail. | Retry only the failed items. Confirm whether inner calls count against quota. | One result row per inner status. |
| Query APIs | Row, byte, and time caps. Deep search offsets are often banned. | Time-slice, or an async query job. | One file per slice, plus a manifest of slices. |
| Bulk export | URLs expire. The file is a snapshot, not a tail. | Poll, download, checksum, refresh URLs from the job. | Untouched files in bronze with job id and snapshot time. |
| File drop | A visible file may still be half written. | Done marker or atomic rename. Quarantine schema failures. | Raw file plus file id. Idempotent load. |
| Data share | The provider can change or revoke the share. | Materialize a versioned snapshot if gold must be stable. | Share version, or a copied snapshot. |
| Webhooks | Drops, duplicates, expiry, no order. | Signature, dedup on event id, fast ack, reconciliation pull. | Raw body plus event id. Same silver key as the pull. |
| Delta / incremental | A watermark taken from the max row you saw can skip a row. | Server token or server time at run start. Tombstones or a full reconcile for deletes. | Delta pages plus the token, advanced after the merge. |
| Streaming | At-least-once. Retention is a cliff. Order is per partition. | Commit after the sink write. Idempotent key. Alert on lag. | Captured log as bronze. Offsets outside the gold table. |
| WebSocket / MQTT / SSE | Disconnects create holes. | Heartbeat, resume token, backfill from an API for the gap. | Events plus the resume token. |
| Direct SQL | You can lock or melt the primary, and miss deletes. | Read replica, indexed ranges, a query budget. | Query text, replica time, streamed files. |
| CDC | Slot or log position can expire. Schema changes arrive as events. | Snapshot, then stream from that position. Do not drop the slot. | Change events with LSN. Apply idempotently. |
| Managed connector | A green check is not your business rule. | Buy the pipe. Keep your own count and contract tests. | Whatever the product writes, plus your reconciliation. |
| Scraping | Breaks, and may be forbidden. | Official API or file. Practice only on sites that allow it. | Raw HTML and the selector version, if allowed. |
| Email / spreadsheets | Columns move. No deletes. | Validate the header. Replace with a file contract. | Raw attachment plus message id. |

Cross-cutting rule: write the page, then the checkpoint. Dedup on a stable key. Compare unique keys to the source count. Exactly-once means at-least-once plus that dedup.
