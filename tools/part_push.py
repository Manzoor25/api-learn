"""Push, database, and last-resort families."""

from helpers import flow, mod, nodes, seq, sstep, state, step

CHECKED = "2026-10-28"
PUSH = []


def add(item):
    PUSH.append(item)


add(mod(
    id="webhooks",
    family="C11",
    title="Webhooks",
    short="Webhooks",
    minutes=16,
    pull=0.78,
    realtime=0.66,
    summary="A webhook is a doorbell. The sender retries, signatures prove who rang, and some rings never arrive. A webhook feed without a reconciliation pull will lose data.",
    analogy="A doorbell that sometimes does not ring, sometimes rings twice, and can be mimicked by a stranger unless you check the signature.",
    sections=[
        {"h": "Why providers push", "p": [
            "They already know the row changed. Pushing is fresher than you polling every minute, and cheaper for them if you are idle. It is a hint, not a ledger.",
            "Subscriptions expire. Handshake validation proves you own the URL. Ordering is not guaranteed. Duplicates are normal because the sender retries when your endpoint times out.",
        ]},
        {"h": "The reliable shape", "p": [
            "Verify HMAC or the vendor signature before you parse. Dedup on the event id. Ack fast, process later from a queue. Renew subscriptions before they expire.",
            "Run a reconciliation job that pulls the source of truth and fills gaps. Missed events are expected. A system that only listens will silently drift.",
        ]},
    ],
    diagrams=[
        state("Subscription", ["pending", "active", "expiring", "renewed", "dead"], [
            step("Pending", "Handshake: the provider calls you and expects a specific response.", state_name="pending"),
            step("Active", "Events arrive. Verify, dedup, enqueue.", state_name="active"),
            step("Expiring", "The subscription has a clock. Notice it before it dies.", state_name="expiring"),
            step("Renewed", "Renew, or the doorbell is disconnected and you will not hear a failure.", state_name="renewed"),
            step("Dead", "Expired or revoked. Reconciliation is the only remaining path.", state_name="dead"),
        ]),
        seq("Validate, then maybe miss one", ["Sender", "Receiver", "Source API"], [
            sstep(0, 1, "POST event + signature", "Delivery", "Reject a bad signature before you touch the database."),
            sstep(1, 0, "2xx fast", "Ack", "Slow work belongs on a queue. A timeout makes the sender retry."),
            sstep(0, 1, "same event again", "Duplicate", "The event id is the dedup key."),
            sstep(1, 2, "list changes since watermark", "Reconcile", "The pull finds the ring that never arrived."),
        ]),
        flow("Missed webhook", nodes(
            ("src", "Source", "source"),
            ("hook", "Webhook", "error"),
            ("recv", "Receiver", "ingestion"),
            ("pull", "Reconcile", "processing"),
        ), [
            step("Dropped", "The sender tried. Your side never stored the event. The row still exists at the source.", ["src", "hook"], phase="fail"),
            step("Notice", "A completeness check compares source ids to received ids.", ["recv", "pull"], phase="fix"),
            step("Fill", "The reconciliation pull lands the missing row. The webhook was a hint.", ["src", "pull"], [{"from": "src", "to": "pull"}], phase="fix"),
        ]),
    ],
    examples=[
        {"domain": "Collaboration", "name": "Signed webhooks", "fact": "Pattern: HMAC over the raw body, plus a timestamp to limit replay. Confirm the exact header and base string in the vendor docs. No sample secret belongs in this repo.", "url": "https://docs.github.com/en/webhooks/using-webhooks/validating-webhook-deliveries", "source": "GitHub webhook signatures"},
        {"domain": "E-commerce", "name": "Order webhooks", "fact": "Pattern, not a store's SLA: treat each event as at-least-once, dedup on the event id, and reconcile against the orders API. Illustrative drop rates belong in the simulator, not in a contract.", "url": "https://en.wikipedia.org/wiki/Webhook", "source": "Pattern"},
    ],
    landing="Bronze is the raw body, signature result, and event id. Silver is the business object after dedup. Reconciliation writes the same silver key so a late webhook and a pull converge.",
))

add(mod(
    id="delta-incremental",
    family="C12",
    title="Delta and incremental APIs",
    short="Deltas",
    minutes=14,
    pull=0.36,
    realtime=0.55,
    summary="After the first snapshot, ask for what changed. Watermarks, delta tokens, and change feeds exist so tomorrow's pull is not another full scan. Deletes arrive as tombstones, or they do not arrive at all.",
    analogy="Asking the librarian what was checked out since yesterday, instead of recounting every book.",
    sections=[
        {"h": "The combination pattern", "p": [
            "A webhook or a schedule says 'something changed'. The delta API says what. Notification alone misses events. Delta alone can be delayed if you only poll nightly. Together they are the usual near-real-time design when a stream is not offered.",
            "Store the server's delta token or the server time at the start of a successful run. Using the max updated_at you happened to see can skip a row committed during the run.",
        ]},
        {"h": "Deletes and overlap", "p": [
            "If the API has tombstones, apply them. If it does not, you cannot discover deletes from an updated_since filter. You need a periodic full reconcile.",
            "Overlap the window by a few minutes and dedup. Late events are cheaper than gaps.",
        ]},
    ],
    diagrams=[
        seq("Token, then changes", ["Client", "Delta API"], [
            sstep(0, 1, "initial delta", "Snapshot", "The first call is the slow one. Save nextLink until it becomes a deltaLink."),
            sstep(1, 0, "deltaLink", "Checkpoint", "The token is the watermark. Lose it and you full-scan again."),
            sstep(0, 1, "GET deltaLink", "Changes", "Adds, updates, and tombstones. Apply them in order if the API orders them."),
            sstep(1, 0, "new deltaLink", "Advance", "Advance the token only after the page is durable."),
        ]),
        flow("Notification plus pull", nodes(
            ("hook", "Notify", "consumer"),
            ("delta", "Delta API", "source"),
            ("lake", "Lake", "storage"),
        ), [
            step("Hint", "The webhook says the collection changed. It may not include the row.", ["hook", "delta"], [{"from": "hook", "to": "delta"}]),
            step("Pull", "The delta call returns the actual changes since the token.", ["delta", "lake"], [{"from": "delta", "to": "lake"}]),
        ]),
    ],
    examples=[
        {"domain": "Identity", "name": "Microsoft Graph delta", "fact": "Checked via the official overview URL on " + CHECKED + ": a delta query pages with @odata.nextLink and, when the round is done, returns @odata.deltaLink. Later calls to that link return changes, not the full collection. Read the page for resource-specific limits before you code one.", "url": "https://learn.microsoft.com/en-us/graph/delta-query-overview", "source": "Microsoft Learn"},
    ],
    landing="Bronze stores each delta page and the token that produced it. Silver merges on the primary key, applies tombstones, and records the token only after the merge commits.",
))

add(mod(
    id="streaming",
    family="C13",
    title="Streaming platforms",
    short="Streams",
    minutes=18,
    pull=0.7,
    realtime=0.86,
    summary="Kafka, Event Hubs, Kinesis, and Pub/Sub are logs. Producers append. Consumers read at their own pace, in a group, from a checkpoint. Retention is how long you can replay. Lag is how far behind you are.",
    analogy="A conveyor belt with several lanes. If you blink, the belt does not rewind unless you kept a note of the last box you put on the shelf.",
    sections=[
        {"h": "Why a log", "p": [
            "Many consumers need the same events, and they need to replay after a bug. A queue that deletes on read cannot do that. A log keeps events for the retention window and lets each group keep its own offset.",
            "Ordering is per partition, not global. Choose the partition key to be the entity that must stay in order, usually the account or device id, not a random value.",
        ]},
        {"h": "How not to lose or double", "p": [
            "At-least-once is the normal contract. Commit the offset after the sink write. Commit before the write and a crash loses events. A crash after the write and before the commit replays them. Idempotent sinks make the replay safe.",
            "Lag, retention, and dead-letter queues are the operating picture. If lag exceeds retention, those events are gone. That is data loss. Alert before that.",
            "Schema registries exist so a new field does not break every consumer. Capture connectors can land the log in the lake. That is a copy, still not a business model.",
        ]},
    ],
    diagrams=[
        state("Consumer", ["connected", "consuming", "lagging", "rebalancing", "recovered"], [
            step("Connected", "The group assigned partitions. You have not read yet.", state_name="connected"),
            step("Consuming", "Read, write, then commit the offset.", state_name="consuming"),
            step("Lagging", "The producer is faster than you. Lag is visible. Retention is the cliff.", state_name="lagging"),
            step("Rebalancing", "A member died or joined. Partitions move. Pause writes until you know your assignment.", state_name="rebalancing"),
            step("Recovered", "Resume from the committed offset, not from the start, and not from the tip, unless you chose that.", state_name="recovered"),
        ]),
        seq("Commit after the write", ["Consumer", "Log", "Lake"], [
            sstep(1, 0, "records", "Read", "The log still has them. Reading is not consuming them away."),
            sstep(0, 2, "upsert", "Sink", "Idempotent write on the event key."),
            sstep(0, 1, "commit offset", "Checkpoint", "Only now may a crash skip ahead. Before this, a crash replays."),
        ]),
        flow("Crash before checkpoint", nodes(
            ("log", "Log", "source"),
            ("app", "Consumer", "ingestion"),
            ("off", "Offset", "queue"),
            ("lake", "Lake", "storage"),
        ), [
            step("Wrote, did not commit", "The row is in the lake. The offset is old. A restart will write the row again.", ["app", "lake"], phase="fail"),
            step("Idempotent sink", "The second write matches the same key and updated_at. The table does not double.", ["lake"], phase="fix"),
            step("Then commit", "Offset moves. Replay window closes.", ["app", "off"], [{"from": "app", "to": "off"}], phase="fix"),
        ]),
    ],
    examples=[
        {"domain": "Platform", "name": "Kafka and relatives", "fact": "Pattern: topics, partitions, consumer groups, offsets, retention, replay. Kafka, Event Hubs, Kinesis, and Pub/Sub rhyme. Their exact retention defaults and throughput units differ. Read the current service page before you cite a number. None is invented here.", "url": "https://kafka.apache.org/documentation/", "source": "Apache Kafka"},
        {"domain": "Security and markets", "name": "Vendor streams into a bus", "fact": "Pattern: a product streams events to Event Hubs, Pub/Sub, or storage. You consume the bus. You do not page the product's REST API for every event. Confirm the vendor's retention and schema in their docs.", "url": "https://learn.microsoft.com/en-us/azure/event-hubs/event-hubs-about", "source": "Event Hubs overview"},
    ],
    landing="Bronze can be the captured log. Silver is deduped events. Gold is aggregates. Keep the consumer group offset outside the gold table so a rebuild can replay.",
))

add(mod(
    id="realtime-protocols",
    family="C14",
    title="WebSockets, SSE, long polling, MQTT",
    short="Live sockets",
    minutes=12,
    pull=0.82,
    realtime=0.92,
    summary="Some sources keep a connection open. WebSockets and MQTT are bidirectional. Server-Sent Events are a one-way stream. Long polling is a loop of requests that wait. None of them is a database.",
    analogy="Holding the phone instead of sending letters. If the call drops, you need a sentence number to know what you missed.",
    sections=[
        {"h": "Why a live connection", "p": [
            "IoT devices and trading screens cannot wait for a nightly file. A socket is low latency. It is also fragile: proxies time out, laptops sleep, and brokers restart.",
            "Heartbeats tell you the connection is alive. A resume token or a last message id tells you what to replay. Without that, a reconnect is a hole.",
        ]},
        {"h": "Landing", "p": [
            "Write events as they arrive, with the resume token. On disconnect, buffer is gone unless you persisted it. Backfill from a REST or file API for the gap, then resume the socket.",
            "MQTT topics and QoS levels change the duplicate story. QoS 1 can duplicate. Design the sink as idempotent anyway.",
        ]},
    ],
    diagrams=[
        flow("Disconnect and resume", nodes(
            ("dev", "Device", "source"),
            ("sock", "Socket", "ingestion"),
            ("disk", "Log", "storage"),
        ), [
            step("Live", "Events flow. Persist the resume token with each batch.", ["dev", "sock"], [{"from": "dev", "to": "sock"}]),
            step("Drop", "The socket dies. Events during the gap are not in your process memory.", ["sock"], phase="fail"),
            step("Resume", "Reconnect with the token, and backfill from the API if the token cannot cover the gap.", ["dev", "disk"], [{"from": "dev", "to": "disk"}], phase="fix"),
        ]),
    ],
    examples=[
        {"domain": "IoT", "name": "MQTT", "fact": "Pattern: pub/sub for devices, with QoS and sessions. Confirm the broker's session expiry. No device-rate number is claimed.", "url": "https://mqtt.org/", "source": "MQTT.org"},
        {"domain": "Web", "name": "SSE and WebSockets", "fact": "Pattern: SSE is server to client over HTTP. WebSockets are bidirectional. Both need heartbeats and a resume story. Long polling is the fallback when a socket is blocked.", "url": "https://html.spec.whatwg.org/multipage/server-sent-events.html", "source": "WHATWG SSE"},
    ],
    landing="Append-only event files with the resume token in the manifest. Do not treat an open socket as proof of completeness.",
))

add(mod(
    id="database-extract",
    family="D15",
    title="Direct database extraction",
    short="Database reads",
    minutes=14,
    pull=0.14,
    realtime=0.22,
    summary="JDBC or ODBC can read a table or a query. It is fast and dangerous. You share the source database with the application that keeps the business running.",
    analogy="Counting books by walking into the stacks while people are still shelving. You can block them, or they can move a book between your two hands.",
    sections=[
        {"h": "Why teams do it", "p": [
            "There is no API, or the API is a toy in front of a real table. A SQL query is the shortest path. It is also the path that can lock rows, fill temp space, and show up in the on-call channel.",
        ]},
        {"h": "How to be a polite reader", "p": [
            "Use a read replica when you can. Incremental queries on an indexed updated_at or an increasing key beat SELECT *. Parallel range reads split the key space, the same idea as partitioned keyset, and they still hit one database.",
            "Snapshot isolation or a consistent read matters if you need a point in time. A query that runs for an hour on a live table is not one moment.",
            "Never extract through the primary at peak if a replica exists. Agree a query budget with the source team.",
        ]},
    ],
    diagrams=[
        flow("Replica, range, land", nodes(
            ("app", "Primary", "source"),
            ("rep", "Replica", "source"),
            ("job", "Extractor", "ingestion"),
            ("lake", "Lake", "storage"),
        ), [
            step("Do not hit primary", "The application owns the primary. Read the replica.", ["app", "rep"]),
            step("Ranges", "Split on an indexed key. Each worker seeks, it does not offset.", ["rep", "job"], [{"from": "rep", "to": "job"}]),
            step("Land", "Stream rows. A fetch size is a page. Do not fetchall() a billion rows.", ["job", "lake"], [{"from": "job", "to": "lake"}]),
        ]),
    ],
    examples=[
        {"domain": "Enterprise", "name": "JDBC and ODBC", "fact": "Pattern: full and incremental queries, read replicas, range reads. Locking and source impact are the reason managed CDC exists. No row-rate number is claimed.", "url": "https://docs.oracle.com/javase/tutorial/jdbc/basics/index.html", "source": "JDBC basics"},
    ],
    landing="Bronze is the query text, the replica timestamp, and the files. Silver merges on the primary key. A full refresh is allowed when the table is small and deletes must be exact.",
))

add(mod(
    id="cdc",
    family="D16",
    title="Change data capture",
    short="CDC",
    minutes=16,
    pull=0.48,
    realtime=0.74,
    summary="Log-based CDC reads the database's own change log. You get inserts, updates, and deletes in commit order, after an initial snapshot. You are not polling the table.",
    analogy="Reading the library's checkout log instead of recounting the shelves every hour.",
    sections=[
        {"h": "Why the log", "p": [
            "The database already writes a durable history of changes so it can recover. CDC readers tail that history. They see deletes. A query on updated_at often does not.",
            "The outbox pattern is the application writing events into a table in the same transaction as the business change, then a publisher reading that table. Use it when you own the application and the log format is not a contract you want to leak.",
        ]},
        {"h": "Snapshot, then stream", "p": [
            "The first run copies the current table. Then the reader switches to the log position taken at the snapshot. Miss that handoff and you gap or overlap. Overlap is fine if the sink is idempotent. A gap is not.",
            "Schema changes are events. A new column should not crash the pipeline. Quarantine unknown shapes, do not drop the slot, or the database may be forced to keep logs until the disk fills.",
        ]},
    ],
    diagrams=[
        state("CDC", ["snapshot", "streaming", "schema", "resumed"], [
            step("Snapshot", "Copy the table. Record the log position.", state_name="snapshot"),
            step("Streaming", "Apply log events after that position, in order, per transaction.", state_name="streaming"),
            step("Schema change", "A new column arrives. Evolve the landing schema or quarantine. Do not abandon the slot.", state_name="schema"),
            step("Resumed", "Restart from the stored log position, not from a new snapshot, unless the position expired.", state_name="resumed"),
        ]),
        seq("Read the log, commit the position", ["CDC reader", "DB log", "Lake"], [
            sstep(1, 0, "change event", "Read", "The log is the source of truth for what changed."),
            sstep(0, 2, "merge", "Apply", "Upsert or delete in the lake, idempotent on primary key plus LSN."),
            sstep(0, 1, "store LSN", "Checkpoint", "Advance the position after the apply. Same rule as a stream offset."),
        ]),
    ],
    examples=[
        {"domain": "Databases", "name": "Debezium and engine CDC", "fact": "Pattern: Debezium, SQL Server CDC, and Postgres logical replication are log readers plus a snapshot. Confirm slot retention and snapshot locking on the current connector page. No latency SLA is claimed.", "url": "https://debezium.io/documentation/reference/stable/connectors/postgresql.html", "source": "Debezium Postgres connector"},
    ],
    landing="Bronze can store the change events with LSN. Silver is the current row plus a history table if you need it. Gold does not read the log directly.",
))

add(mod(
    id="managed-connectors",
    family="D17",
    title="Managed connectors",
    short="Buy vs build",
    minutes=12,
    pull=0.5,
    realtime=0.42,
    summary="Airbyte, Fivetran, Azure Data Factory, Databricks Lakeflow Connect, and their relatives already built the pagination, CDC, and retries. Buy them when the source is common and your edge is the model, not the socket.",
    analogy="Hiring a courier instead of building a truck. You still have to say where the boxes go, and you still check that nothing was left on the dock.",
    sections=[
        {"h": "When to buy", "p": [
            "The source is Salesforce, a database, or another system with a maintained connector. Your team is small. The connector's latency and cost fit. You still own schema tests, credentials, and the reconciliation count.",
            "Build when the source is odd, the connector hides a limit you cannot accept, or the data cannot leave a network the vendor's cloud cannot see.",
        ]},
        {"h": "What you still do", "p": [
            "Compare control, cost, and latency in a table for the actual source, not from a slogan. A managed CDC product can be minutes. A nightly file connector is a day. Read the current product page.",
            "Do not point a managed connector at production credentials with write scope. Least privilege still applies.",
        ]},
    ],
    diagrams=[
        flow("Buy the pipe, own the check", nodes(
            ("src", "Source", "source"),
            ("conn", "Connector", "ingestion"),
            ("lake", "Lake", "storage"),
            ("you", "Your tests", "processing"),
        ), [
            step("Sync", "The product pages, tails a log, or copies a file.", ["src", "conn"], [{"from": "src", "to": "conn"}]),
            step("Land", "Rows arrive in your lake under their schema.", ["conn", "lake"], [{"from": "conn", "to": "lake"}]),
            step("Verify", "You still compare counts and keys. A green connector check is not your business rule.", ["lake", "you"], [{"from": "lake", "to": "you"}]),
        ]),
    ],
    examples=[
        {"domain": "Integration", "name": "Hosted and platform connectors", "fact": "Names checked as product categories, not as a feature matrix: Fivetran, Airbyte, Azure Data Factory, Databricks Lakeflow Connect. Capabilities and prices change. Compare the current docs for the source you have. No price is quoted here.", "url": "https://docs.airbyte.com/", "source": "Airbyte docs"},
    ],
    landing="Land where the product writes, then run your own silver tests. Keep a source-of-record count outside the connector's success flag.",
))

add(mod(
    id="scraping",
    family="E18",
    title="Scraping, last",
    short="Scraping",
    minutes=12,
    pull=0.08,
    realtime=0.1,
    summary="Scraping reads HTML because there is no API. It breaks when the page changes, and it can be illegal or forbidden even when it is technically easy. Prefer an official feed. Use demo sites if you practice.",
    analogy="Copying a shop window because they would not give you a catalog. The window changes, and the shop may have a rule against it.",
    sections=[
        {"h": "Rules, before code", "p": [
            "Read the terms of service, robots.txt, and copyright. Personal data on a page is still personal data. Rate courtesy is not a legal defense, but hammering a site is how you get blocked and how you cause harm.",
            "If an API, a file, or a data portal exists, use it. Scraping is the last resort for public pages you are allowed to read, not a clever way around a login.",
        ]},
        {"h": "If you still must", "p": [
            "Static HTML can be parsed. JavaScript-rendered pages need a browser, which is slower and more fragile. Anti-bot systems will beat a casual script. Do not teach bypasses here, and do not build them.",
            "Store the raw HTML and the URL and the time. Expect the selectors to break. Alert on a sudden drop to zero rows.",
        ]},
    ],
    diagrams=[
        flow("Prefer the official door", nodes(
            ("page", "HTML page", "error"),
            ("api", "Official API", "source"),
            ("lake", "Lake", "storage"),
        ), [
            step("Fragile", "A selector extract dies when a div is renamed. You also may not be allowed to do it.", ["page"], phase="fail"),
            step("Official", "An API or file feed is the supported contract.", ["api", "lake"], [{"from": "api", "to": "lake"}], phase="fix"),
        ]),
    ],
    examples=[
        {"domain": "Practice only", "name": "Sites built for scraping practice", "fact": "Use sites that invite practice, such as books.toscrape.com, and stay inside their terms. This course does not include bypass techniques.", "url": "https://books.toscrape.com/", "source": "Practice site"},
    ],
    landing="If a scrape is allowed, bronze is raw HTML. Silver is parsed fields with the selector version. A zero-row run is an incident, not an empty day.",
))

add(mod(
    id="email-reports",
    family="E19",
    title="Email, reports, and spreadsheets",
    short="Reports",
    minutes=8,
    pull=0.55,
    realtime=0.05,
    summary="A scheduled CSV in an inbox or a spreadsheet on a share is an API with no contract. It works until someone renames a column or the mail rule moves the file.",
    analogy="A colleague sliding a printout under your door. Helpful, and not a system.",
    sections=[
        {"h": "Why it happens", "p": [
            "The source system can email a report and cannot expose a table. Teams accept it to move. The extract then depends on a mailbox, a subject line, and a human who owns the report definition.",
        ]},
        {"h": "How it breaks", "p": [
            "Columns move. Dates change format. A totals row is parsed as data. The attachment is missing on a holiday. There is no tombstone and no event id.",
            "Replace it. Ask for a file drop with a schema, or an API. Until then, validate the header row and quarantine surprises. Do not silently shift columns.",
        ]},
    ],
    diagrams=[
        flow("A report is not a feed", nodes(
            ("mail", "Inbox", "queue"),
            ("parse", "Parser", "processing"),
            ("q", "Quarantine", "error"),
            ("lake", "Lake", "storage"),
        ), [
            step("Header changed", "The parser maps column 3 to amount and writes nonsense.", ["mail", "parse"], phase="fail"),
            step("Check the header", "Expected names, or quarantine. Never guess a shifted column.", ["parse", "q"], phase="fix"),
            step("Land only matches", "A known header can load. Record the message id so a redelivery does not double.", ["parse", "lake"], [{"from": "parse", "to": "lake"}], phase="fix"),
        ]),
    ],
    examples=[
        {"domain": "Operations", "name": "Scheduled report exports", "fact": "Pattern: no stable schema, no deletes, no replay contract. Treat as temporary. No vendor mailbox limit is claimed.", "url": "https://datatracker.ietf.org/doc/html/rfc5322", "source": "Email is a message format, not a data contract"},
    ],
    landing="Store the raw attachment and the message id. Silver loads only if the header matches the contract hash.",
))
