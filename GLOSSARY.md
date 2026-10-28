# Glossary

Plain definitions. If a sentence names a vendor limit, that limit is in [SOURCES.md](SOURCES.md), not here.

**At-least-once.** The sender retries until it hears success. A crash after the write and before the ack delivers the record twice.

**At-most-once.** No retry. A crash loses the record.

**Backfill.** A deliberate replay of a past range. It must not move the live watermark backward.

**Backpressure.** The reader slows down when the sink or queue is full, instead of buffering without a bound.

**Bronze / silver / gold.** Raw as received, cleaned and deduped, then shaped for a decision. Names vary. The layers do not.

**Bulkhead.** A limit on how many threads or connections one source can use, so one outage cannot eat the pool.

**Checkpoint.** The cursor, offset, file id, or log position saved after a page is durable. Resume starts here.

**Circuit breaker.** After repeated failures, calls fail fast (open) until a trial call is allowed (half-open).

**Connection (GraphQL).** A page of edges. Each edge has a node and a cursor. pageInfo says whether to continue.

**Consumer group.** A set of readers that split a log's partitions. Each partition is read by one member at a time.

**Cursor.** An opaque token for the next page. You store it. You do not parse it. You cannot invent the next one.

**Dead letter.** A record that failed enough times to leave the main path, stored with the error so a human can replay it.

**Delta token / deltaLink.** A server-issued bookmark for "changes since this point." Microsoft Graph uses `@odata.deltaLink` after `@odata.nextLink` pages finish. See sources.

**Done marker.** A side file or an atomic rename that means the writer has finished. Loaders ignore files without it.

**Exactly-once.** Usually a claim. The workable version is at-least-once plus an idempotent write.

**Idempotent write.** Doing it twice leaves the same rows. Typically a primary key, keeping the newest version.

**Keyset / seek.** `WHERE sort_key > last_seen ORDER BY sort_key LIMIT n`. An index seek. Depth does not add a skip.

**Lag.** How far a consumer is behind the tip of a log. If lag exceeds retention, those events are gone.

**Link header.** An RFC 5988 header. `rel="next"` is the next page. Clients that only read JSON stop early. GitHub documents this.

**Offset pagination.** Skip N rows, then take a page. Easy, slow at depth, wrong if the order changes while you walk.

**Outbox.** The application writes a business change and an event row in one database transaction. A publisher reads the event row. You do not tail the engine log.

**Page cap.** The most rows one response will hold. It is not the size of the table.

**Partition.** A shard of a log. Order is guaranteed inside one partition, not across them.

**Quarantine.** A parking place for a file or batch that failed a contract. The rest of the pipeline continues.

**Rate-limit window.** The clock the budget resets on. A header that only says 20 does not tell you the window.

**Reconciliation.** A pull that compares source keys to landed keys and fills gaps. Required if you rely on webhooks.

**Resume token.** The last message id on a socket or stream. Without it, a reconnect is a hole.

**Retention.** How long a log keeps events. After that, replay is impossible.

**Signed URL.** A temporary capability to download one object. When it expires, ask the job for a new one.

**Snapshot.** The collection at one time. Not a history, and not a tail.

**Tombstone.** A change that says a key was deleted. Without it, an incremental feed cannot tell you what vanished.

**Watermark.** The point in time or the token that the next incremental run starts from. Prefer the server's token or the server clock at the start of a successful run.
