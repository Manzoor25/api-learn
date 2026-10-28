"""Cross-cutting modules, the race, and the failure gallery."""

from helpers import flow, mod, nodes, race, seq, sstep, state, step

CHECKED = "2026-10-28"
CONCEPTS = []


def add(item):
    CONCEPTS.append(item)


add(mod(
    id="delivery-guarantees",
    title="Delivery guarantees",
    short="Guarantees",
    minutes=12,
    summary="At-most-once drops data on a crash. At-least-once retries and can duplicate. Exactly-once, in practice, is at-least-once plus an idempotent write.",
    analogy="A courier who throws the parcel away if they are unsure, versus one who might deliver twice, versus a shelf that ignores the second identical parcel.",
    sections=[
        {"h": "The three words", "p": [
            "At-most-once: send or commit before you know the write landed. A crash loses the record and nobody retries.",
            "At-least-once: retry until the receiver acks. A crash after the write and before the ack duplicates.",
            "Exactly-once is usually a marketing sentence for 'the sink dedups'. End-to-end exactly-once across a database, a bus, and a lake is rare. Design for at-least-once and make the write idempotent.",
        ]},
    ],
    diagrams=[
        flow("Same event, twice, one row", nodes(
            ("bus", "Bus", "source"),
            ("sink", "Sink", "processing"),
            ("row", "Row", "storage"),
        ), [
            step("First write", "The event lands. The ack is lost.", ["bus", "sink"], [{"from": "bus", "to": "sink"}]),
            step("Replay", "The same key arrives again.", ["bus", "sink"], [{"from": "bus", "to": "sink"}], phase="fail"),
            step("Dedup", "Primary key plus version. The second write is a no-op or a newer version, not a second fact.", ["sink", "row"], [{"from": "sink", "to": "row"}], phase="fix"),
        ]),
    ],
    examples=[],
    landing="The sink key is the delivery guarantee. Without it, retries are data corruption.",
))

add(mod(
    id="idempotency",
    title="Idempotency, checkpoints, replay",
    short="Idempotency",
    minutes=14,
    summary="A write is idempotent when doing it twice leaves the same rows. Checkpoints say where to resume. Replay is how you fix a bug without asking the source to remember you.",
    analogy="A rubber stamp that says 'this invoice number already exists' instead of printing a second invoice.",
    sections=[
        {"h": "Keys", "p": [
            "Dedup on a stable id. If two versions exist, keep the newer updated_at or the higher log position. A random UUID per retry is not a key. It manufactures duplicates.",
            "Watermarks are for incremental pulls. Checkpoints are for the cursor, offset, file, or log position inside a run. Reconciliation compares the source count to the landed unique keys.",
        ]},
        {"h": "Backfills", "p": [
            "A backfill is a deliberate replay of a range. Isolate it so it does not move the live watermark backward. Write to the same keys so the live stream and the backfill converge.",
        ]},
    ],
    diagrams=[
        seq("Write, then checkpoint", ["Worker", "Disk", "State"], [
            sstep(0, 1, "page file", "Durable page", "The data hits disk first."),
            sstep(0, 2, "cursor", "Checkpoint", "Now a kill can resume. The reverse order can skip a page."),
            sstep(2, 0, "resume cursor", "Replay", "The next process starts at the cursor, not at zero."),
        ]),
    ],
    examples=[],
    landing="State store holds the cursor. The lake holds the rows. They advance together, data first.",
))

add(mod(
    id="snapshot-merge",
    title="Snapshot, incremental, history",
    short="Merge",
    minutes=12,
    summary="A snapshot is the world at one time. An incremental feed is what changed. An event history is every fact. Merging them is a full refresh, an upsert, or a slowly changing dimension, plus a plan for deletes.",
    analogy="A photograph, a list of edits, and a diary. You cannot reconstruct the diary from the photograph.",
    sections=[
        {"h": "Choose the grain", "p": [
            "Full refresh replaces the table. It is correct for small dimensions and painful for billions of rows. Upsert or MERGE applies changes and needs tombstones for deletes.",
            "Slowly changing dimensions keep history on purpose. That is a modeling choice, not something CDC gives you for free. Store the effective time.",
        ]},
    ],
    diagrams=[
        flow("Merge a change onto a snapshot", nodes(
            ("snap", "Snapshot", "storage"),
            ("chg", "Changes", "source"),
            ("merge", "MERGE", "processing"),
            ("cur", "Current", "storage"),
        ), [
            step("Base", "The snapshot is the starting picture.", ["snap", "merge"]),
            step("Apply", "Updates replace. Tombstones delete. Inserts add.", ["chg", "merge"], [{"from": "chg", "to": "merge"}]),
            step("Current", "The serving table is the merge, not the raw feed.", ["merge", "cur"], [{"from": "merge", "to": "cur"}]),
        ]),
    ],
    examples=[],
    landing="Keep snapshot and changes in bronze. Silver is the merge. Do not throw away bronze after the first success. You will rerun it.",
))

add(mod(
    id="backpressure",
    title="Memory and backpressure",
    short="Backpressure",
    minutes=10,
    summary="If the producer is faster than the sink, something has to slow down, buffer, or drop. Dropping is data loss. An unbounded list is a future crash.",
    analogy="A funnel. If you keep pouring and the neck is narrow, the counter floods. A good funnel tells the tap to wait.",
    sections=[
        {"h": "What to do", "p": [
            "Stream pages and files. Bound every queue. When the queue is full, stop reading. That is backpressure. It shows up as consumer lag or a paused HTTP client, which is healthier than an out-of-memory kill.",
            "Chunk large files. Never fetchall(). A million small Python dicts is a memory tax you do not need.",
        ]},
    ],
    diagrams=[
        flow("Bounded queue", nodes(
            ("src", "Source", "source"),
            ("q", "Bounded queue", "queue"),
            ("sink", "Sink", "storage"),
        ), [
            step("Fast source", "Events arrive faster than the sink writes.", ["src", "q"], [{"from": "src", "to": "q"}]),
            step("Full", "The queue refuses more. The reader pauses. Nothing is dropped.", ["q"], phase="fix"),
            step("Drain", "The sink catches up. Reading resumes.", ["q", "sink"], [{"from": "q", "to": "sink"}]),
        ]),
    ],
    examples=[],
    landing="Spill a full queue to disk if you must buffer a burst. An in-memory backlog is not a design.",
))

add(mod(
    id="performance",
    title="Performance techniques",
    short="Performance",
    minutes=12,
    summary="Make each request cheaper before you add threads. Page size, fields, compression, and connection reuse come first. Concurrency is last, and only under the rate limit.",
    analogy="Packing the box fuller, and reusing the same truck, before you hire a fleet that the loading dock will turn away.",
    sections=[
        {"h": "Order of operations", "p": [
            "Raise the page size to the documented maximum. Drop fields you do not land. Accept gzip. Reuse connections. HTTP/2 multiplexes when the server supports it.",
            "Async I/O helps when you are waiting on the network. Threads help for the same reason, with more overhead. Processes help when you are CPU-bound on parse. None of them help when the rate limit is the ceiling.",
            "Partitioned parallelism is the safe fan-out: independent key or time ranges, a shared limiter, a shared sink that dedups.",
        ]},
    ],
    diagrams=[
        flow("Cheap calls, then parallel ranges", nodes(
            ("page", "Bigger page", "source"),
            ("pool", "Pool", "ingestion"),
            ("cap", "Limiter", "queue"),
            ("lake", "Lake", "storage"),
        ), [
            step("Fewer calls", "A larger page and fewer fields cut the request count.", ["page"]),
            step("Reuse", "A connection pool avoids a new handshake per page.", ["page", "pool"], [{"from": "page", "to": "pool"}]),
            step("Cap", "Parallel ranges share one limiter.", ["pool", "cap", "lake"], [{"from": "pool", "to": "cap"}]),
        ]),
    ],
    examples=[],
    landing="Measure one page before you multiply. diagnose the latency, the page size, and the limit. Then estimate.",
))

add(mod(
    id="resilience",
    title="Timeouts, retries, circuit breakers",
    short="Resilience",
    minutes=14,
    summary="Timeouts bound a wait. Retries cover a blip. A circuit breaker stops you from retrying a source that is down. A bulkhead stops one source from eating every thread.",
    analogy="Knocking again if nobody heard you. If the building is on fire, stop knocking and try later. Do not send the whole company to knock.",
    sections=[
        {"h": "Rules", "p": [
            "Every call has a timeout. Retry 429, 500, 502, 503, 504, timeouts, and connection resets. Honor Retry-After. Otherwise exponential backoff with jitter. Do not retry 400 or 401.",
            "A circuit opens after repeated failures and fails fast. Half-open lets one trial through. Closed is healthy. Dead-letter the events you cannot apply, with the error, so a human can replay them.",
        ]},
    ],
    diagrams=[
        state("Circuit breaker", ["closed", "open", "half-open"], [
            step("Closed", "Calls go through. Failures are counted.", state_name="closed"),
            step("Open", "Too many failures. Calls fail fast. The source gets a rest.", state_name="open"),
            step("Half-open", "One trial. Success closes. Failure opens again.", state_name="half-open"),
        ]),
        seq("Retry only what can succeed later", ["Client", "API"], [
            sstep(0, 1, "GET", "Call", "Timeout or 503."),
            sstep(0, 0, "backoff + jitter", "Wait", "Do not stampede."),
            sstep(0, 1, "GET", "Retry", "A 400 would have stopped here. The request was wrong, not unlucky."),
        ]),
    ],
    examples=[],
    landing="Dead letters are a landing zone too. They are how you avoid losing a poison event inside a retry loop.",
))

add(mod(
    id="auth",
    title="Auth and token expiry",
    short="Auth",
    minutes=14,
    summary="API keys, OAuth client credentials, authorization code with refresh, managed identities, mTLS, and signed URLs are different ways to prove you may read. A token that dies mid-pull is a resume problem, not a new extract.",
    analogy="A visitor badge that expires at noon. You do not start the museum tour over. You get a new badge and continue at the room you were in.",
    sections=[
        {"h": "Patterns", "p": [
            "API keys are simple and easy to leak. OAuth client credentials fit a daemon. Authorization code fits a user. Refresh tokens exist so you do not ask the user again. Managed identities avoid a stored secret in clouds that support them. mTLS is a certificate instead of a header. Signed URLs are a capability for one object, for a few minutes.",
            "Store secrets in a secret store. Do not commit them. Do not log them. Scope them to read.",
        ]},
        {"h": "Mid-run expiry", "p": [
            "On 401, refresh once and retry the same page. If refresh fails, stop and keep the checkpoint. The next run continues. Do not restart from page zero because a badge expired.",
        ]},
    ],
    diagrams=[
        seq("Refresh, then the same page", ["Worker", "Token endpoint", "API"], [
            sstep(0, 2, "GET page", "Expired", "401. The page was not applied."),
            sstep(0, 1, "refresh", "New token", "One refresh. Do not loop if the refresh itself is denied."),
            sstep(0, 2, "GET same page", "Continue", "The checkpoint has not moved. The page is retried, not skipped."),
        ]),
        flow("Token dies mid-pull", nodes(
            ("run", "Run", "ingestion"),
            ("tok", "Token", "error"),
            ("api", "API", "source"),
            ("ckpt", "Checkpoint", "storage"),
        ), [
            step("401", "The badge expired between pages. Rows already landed are fine.", ["tok"], phase="fail"),
            step("Refresh and resume", "New token, same cursor.", ["run", "api", "ckpt"], [{"from": "run", "to": "api"}], phase="fix"),
        ]),
    ],
    examples=[
        {"domain": "Standard", "name": "OAuth 2.0", "fact": "Pattern: client credentials, authorization code, and refresh tokens are in the OAuth 2.0 framework. Confirm the vendor's token lifetime. Do not hard-code one.", "url": "https://datatracker.ietf.org/doc/html/rfc6749", "source": "RFC 6749"},
    ],
    landing="The checkpoint is independent of the token. Tokens are not data. Do not land them.",
))

add(mod(
    id="schema",
    title="Schema drift and contracts",
    short="Schema",
    minutes=10,
    summary="Sources add fields, rename fields, and change types. A pipeline that assumes yesterday's shape will either crash or silently shift meaning. A contract says which change is allowed.",
    analogy="A form that grows a new box. If you read by column number, the amount becomes the phone number.",
    sections=[
        {"h": "What to do", "p": [
            "Land the raw payload so a new field is not lost even if silver does not know it yet. Evolve silver explicitly. Additive fields are usually safe. Type changes and renames are breaking.",
            "A data contract is the agreement: required fields, types, and who may change them. Test it on every batch. Quarantine violations.",
        ]},
    ],
    diagrams=[
        flow("Schema change", nodes(
            ("src", "Source", "source"),
            ("raw", "Raw", "storage"),
            ("silver", "Silver", "processing"),
            ("q", "Quarantine", "error"),
        ), [
            step("New field", "Raw still stores it. Silver ignores unknown fields until you opt in.", ["src", "raw"], [{"from": "src", "to": "raw"}]),
            step("Breaking change", "A type change fails the contract. Quarantine the batch. Do not coerce quietly.", ["silver", "q"], phase="fail"),
            step("Evolve", "Update the contract, backfill if needed, resume.", ["raw", "silver"], [{"from": "raw", "to": "silver"}], phase="fix"),
        ]),
    ],
    examples=[],
    landing="Bronze is schemaless or self-describing. Silver is contracted. Gold is stable names the business uses.",
))

add(mod(
    id="observability",
    title="Observability",
    short="Observability",
    minutes=10,
    summary="You cannot operate a pull you cannot see. Each family has a few metrics that tell you it is stuck, losing data, or about to hit a cliff.",
    analogy="The fuel gauge and the warning light. Arriving is not the same as knowing you arrived with every parcel.",
    sections=[
        {"h": "What to count", "p": [
            "Pages, records, 429 rate, retry count, job duration, export URL expiry misses, webhook drop rate, consumer lag, DLQ depth, schema failures, and the gap between source count and landed unique keys.",
            "Structured logs include the run id, the cursor, and the source, never the secret. Alert on lag versus retention, on zero rows when yesterday was not zero, and on reconciliation mismatches.",
        ]},
    ],
    diagrams=[
        flow("A metric before a silent gap", nodes(
            ("job", "Job", "ingestion"),
            ("metric", "Metrics", "processing"),
            ("alert", "Alert", "error"),
        ), [
            step("Emit", "Records, retries, lag, and the completeness gap, every run.", ["job", "metric"], [{"from": "job", "to": "metric"}]),
            step("Page", "A gap or a lag cliff pages a human before the retention window deletes the evidence.", ["metric", "alert"], [{"from": "metric", "to": "alert"}]),
        ]),
    ],
    examples=[],
    landing="Metrics are not a substitute for the reconciliation table. Keep both.",
))

add(mod(
    id="cost",
    title="Cost",
    short="Cost",
    minutes=8,
    summary="APIs charge per call or per row. Egress charges per byte. Streams charge for throughput and retention. Storage and compute charge for landing and transforming. The cheapest design is often the one that moves less, less often.",
    analogy="Postage. A thousand small letters cost more than one box, and the box still has a weight fee.",
    sections=[
        {"h": "Levers", "p": [
            "Fewer calls: larger pages, bulk export, incremental filters. Fewer bytes: field selection and compression. Less often: a share instead of a copy, or a daily file instead of a per-second stream you do not read.",
            "Prices change and are vendor-specific. This course does not quote a price. Read the current price page and multiply by your measured volume.",
        ]},
    ],
    diagrams=[
        flow("Move less", nodes(
            ("all", "Full copy", "error"),
            ("delta", "Delta", "source"),
            ("bill", "Bill", "consumer"),
        ), [
            step("Expensive", "A full copy every hour pays for bytes nobody reads.", ["all", "bill"], phase="fail"),
            step("Cheaper", "A snapshot once, then changes. Confirm the vendor's meter.", ["delta", "bill"], [{"from": "delta", "to": "bill"}], phase="fix"),
        ]),
    ],
    examples=[],
    landing="Cost is a design input. Record the meter you are optimizing, so a later 'optimization' does not increase a different bill.",
))

add(mod(
    id="security",
    title="Security and compliance",
    short="Security",
    minutes=10,
    summary="Least privilege, no secrets in git, a plan for personal data, an audit trail of who pulled what, and a residency rule for where bytes may sit.",
    analogy="A key that opens one cupboard, not the building, and a log of who used it.",
    sections=[
        {"h": "Minimum", "p": [
            "Read-only credentials. Separate credentials per environment. Rotate them. Do not log payloads that contain personal data unless the log store is approved for that data.",
            "Residency is a placement rule: some datasets cannot leave a region or a tenant boundary. A convenient SaaS extractor can violate it. Ask before you connect.",
            "Audit the run: who, what source, what time range, how many rows. That is how you answer an incident.",
        ]},
    ],
    diagrams=[
        flow("Least privilege", nodes(
            ("id", "Identity", "ingestion"),
            ("src", "Source", "source"),
            ("lake", "Lake", "storage"),
        ), [
            step("Read only", "The credential can list and read the one collection. It cannot write or see the rest of the tenant.", ["id", "src"], [{"from": "id", "to": "src"}]),
            step("Land in bounds", "The lake is in the allowed region. The audit row records the pull.", ["src", "lake"], [{"from": "src", "to": "lake"}]),
        ]),
    ],
    examples=[],
    landing="Bronze may contain personal data. Access to bronze is narrower than access to gold. Mask or drop fields in silver if gold does not need them.",
))

add(mod(
    id="landing",
    title="Landing architecture",
    short="Landing",
    minutes=12,
    summary="Bronze is what you received, plus metadata. Silver is cleaned and deduped. Gold is what the business queries. The destination might be a lakehouse, a warehouse, or a search index. The layers still apply.",
    analogy="The loading dock, the sorting room, and the shop floor. You do not let customers walk the dock, and you do not throw away the packing slip.",
    sections=[
        {"h": "Layers", "p": [
            "Bronze keeps the raw payload, the source URL or offset, the ingest time, and the run id. You can rebuild silver from it.",
            "Silver dedups, types fields, applies tombstones, and passes contracts. Gold is joined, aggregated, and named for a decision.",
            "A lakehouse keeps files and transactions. A warehouse is SQL-first. A search or vector store is a serving copy, not the system of record, unless you designed it to be.",
        ]},
    ],
    diagrams=[
        flow("Bronze, silver, gold", nodes(
            ("src", "Source", "source"),
            ("bronze", "Bronze", "storage"),
            ("silver", "Silver", "processing"),
            ("gold", "Gold", "consumer"),
        ), [
            step("As received", "Raw plus metadata. No business rules yet.", ["src", "bronze"], [{"from": "src", "to": "bronze"}]),
            step("Clean", "Dedup, types, deletes, contract.", ["bronze", "silver"], [{"from": "bronze", "to": "silver"}]),
            step("Serve", "Gold is rebuildable from silver. Consumers do not read bronze.", ["silver", "gold"], [{"from": "silver", "to": "gold"}]),
        ]),
    ],
    examples=[],
    landing="This page is the landing pattern. Every family module ends by saying what bronze must keep so silver can be rebuilt.",
))

add(mod(
    id="orchestration",
    title="Orchestration",
    short="Orchestration",
    minutes=10,
    summary="Something has to start the job, wait for its dependencies, retry the run, and backfill a day. Cron, Airflow, Data Factory, and job schedulers are that something. A webhook can start a run too.",
    analogy="A dispatcher. The trucks still do the driving. The dispatcher decides when, and what happens if a truck does not return.",
    sections=[
        {"h": "Scheduled versus triggered", "p": [
            "A schedule is right for a nightly file or a daily incremental. An event trigger is right when a webhook or a file arrival should start the load. Dependencies matter: do not build gold until silver for that run succeeded.",
            "Backfills are orchestrated replays of a date range, with the live schedule left alone or paused for that dataset. A failed run should be visible, not a cron line that nobody reads.",
        ]},
    ],
    diagrams=[
        flow("Trigger or schedule, then depend", nodes(
            ("clock", "Schedule", "queue"),
            ("hook", "File or hook", "source"),
            ("silver", "Silver", "processing"),
            ("gold", "Gold", "consumer"),
        ), [
            step("Start", "A clock or an arrival starts the extract. Not both, unless you dedup the run.", ["clock", "hook"]),
            step("Silver first", "Gold waits. A partial silver is not a signal to publish.", ["silver", "gold"], [{"from": "silver", "to": "gold"}]),
        ]),
    ],
    examples=[
        {"domain": "Orchestrators", "name": "Cron, Airflow, platform jobs", "fact": "Pattern: cron for a single machine, a workflow tool when you have dependencies and backfills. Product names change. No schedule SLA is claimed.", "url": "https://airflow.apache.org/docs/", "source": "Apache Airflow"},
    ],
    landing="The orchestrator stores run state. The lake stores data. Do not use a green task as the only copy of the watermark.",
))

add(mod(
    id="connectors",
    title="Build a connector",
    short="Connectors",
    minutes=18,
    summary="A connector is config, auth, a pagination strategy, incremental state, a rate limiter, retries, a schema check, a writer, and metrics. Frameworks differ in how much of that they already built.",
    analogy="A truck with a standard loading dock. Singer, Airbyte, dlt, and Kafka Connect are different docks. The cargo rules are the same.",
    sections=[
        {"h": "Anatomy", "p": [
            "Strategy pattern for pagination: offset, cursor, keyset, link, bulk job. Pluggable auth. A state store for the cursor. An idempotent sink. Metrics for pages, 429s, and records.",
            "Singer is a spec of taps and targets over JSON lines. Airbyte's connector kit is a framework with a catalog and state. dlt is a Python library that infers schema and loads. Kafka Connect is for moving between a Kafka log and another system. Use Singer or Airbyte when you want a catalog of connectors. Use dlt when you want a Python pipeline. Use Kafka Connect when the log is already the center.",
        ]},
        {"h": "Testing and agents", "p": [
            "Mock the server. Record responses. Inject 429s, 500s, timeouts, and partial files. A connector that only passes the happy path will lose a weekend.",
            "Exposing extracted data as a tool for an AI agent, for example an MCP server, adds a new caller that can loop. Put the same rate limit, the same read-only scope, and a row cap in front of it. An agent is not a reason to turn off pagination.",
        ]},
    ],
    diagrams=[
        flow("Connector parts", nodes(
            ("cfg", "Config", "ingestion"),
            ("auth", "Auth", "processing"),
            ("page", "Pager", "source"),
            ("sink", "Sink", "storage"),
        ), [
            step("Configure", "Base URL, page size, auth, and the state path. No secrets in the repo.", ["cfg", "auth"]),
            step("Page", "The strategy yields records. The limiter and retry wrap every call.", ["auth", "page"], [{"from": "auth", "to": "page"}]),
            step("Write", "The sink is idempotent. State advances after the write.", ["page", "sink"], [{"from": "page", "to": "sink"}]),
        ]),
    ],
    examples=[
        {"domain": "Frameworks", "name": "Singer, Airbyte, dlt, Kafka Connect", "fact": "Categories, not a ranked benchmark. Read the current docs before you adopt one. This repo includes a small Python template under labs/connector_template.", "url": "https://dlthub.com/docs/intro", "source": "dlt intro"},
    ],
    landing="The template writes NDJSON and a state file. Swap the sink for Parquet or a warehouse when the shape is proven.",
))

add(mod(
    id="failures",
    title="Failure replay",
    short="Failures",
    minutes=16,
    summary="Eight failures, then the fix. Step through each diagram. The first steps are the break. The later steps are the repair.",
    analogy="A flight recorder. You watch the crash, then you watch the checklist that would have prevented it.",
    sections=[
        {"h": "How to use this page", "p": [
            "Each diagram is a replay. Steps marked failure show the loss or the duplicate. Steps marked fix show the checkpoint, the key, the refresh, or the reconciliation that closes it.",
        ]},
    ],
    diagrams=[
        flow("Crash mid-pull", nodes(("c", "Client", "ingestion"), ("a", "API", "source"), ("d", "Disk", "storage")), [
            step("Died holding a list", "Pages lived in memory. The process died. You have nothing.", ["c"], phase="fail"),
            step("Page on disk", "Each page was a file. The checkpoint has the cursor.", ["c", "d"], [{"from": "c", "to": "d"}], phase="fix"),
            step("Resume", "The next process continues. Finished files are not fetched again.", ["c", "a"], [{"from": "c", "to": "a"}], phase="fix"),
        ]),
        flow("Offset drift", nodes(("o", "Offset", "error"), ("k", "Keyset", "source"), ("d", "Disk", "storage")), [
            step("Skip N", "An insert above the window repeats a row and hides another.", ["o"], phase="fail"),
            step("Seek", "id greater than last id does not care about the shifting window.", ["k", "d"], [{"from": "k", "to": "d"}], phase="fix"),
        ]),
        flow("Expired signed URL", nodes(("u", "Old URL", "error"), ("j", "Job", "queue"), ("f", "File", "storage")), [
            step("403", "The URL expired. The snapshot is not empty. The URL is.", ["u"], phase="fail"),
            step("New URL", "Ask the job for fresh URLs and download those.", ["j", "f"], [{"from": "j", "to": "f"}], phase="fix"),
        ]),
        flow("Missed webhook", nodes(("h", "Hook", "error"), ("r", "Reconcile", "processing"), ("s", "Source", "source")), [
            step("No ring", "The event never arrived. Your table is short.", ["h"], phase="fail"),
            step("Pull", "Reconciliation reads the source and fills the id.", ["s", "r"], [{"from": "s", "to": "r"}], phase="fix"),
        ]),
        flow("Commit too early", nodes(("c", "Consumer", "ingestion"), ("o", "Offset", "queue"), ("l", "Lake", "storage")), [
            step("Offset moved, write did not", "A crash now skips events that never landed.", ["o"], phase="fail"),
            step("Write, then commit", "A crash replays. The sink dedups.", ["c", "l"], [{"from": "c", "to": "l"}], phase="fix"),
        ]),
        flow("Half-written file", nodes(("p", "Partial", "error"), ("m", "Done marker", "queue"), ("l", "Loader", "processing")), [
            step("Loaded early", "The loader read a file the writer had not closed.", ["p"], phase="fail"),
            step("Wait for done", "No marker, no load.", ["m", "l"], [{"from": "m", "to": "l"}], phase="fix"),
        ]),
        flow("Schema break", nodes(("s", "Source", "source"), ("q", "Quarantine", "error"), ("v", "Contract", "processing")), [
            step("Silent shift", "Column 3 changed meaning. Gold is wrong and green.", ["s"], phase="fail"),
            step("Quarantine", "The contract fails the batch. Raw is kept. Silver does not move.", ["v", "q"], phase="fix"),
        ]),
        flow("Token expiry", nodes(("t", "Token", "error"), ("r", "Refresh", "processing"), ("p", "Same page", "source")), [
            step("401", "The run stopped. Restarting from zero wastes the landed pages and can duplicate them.", ["t"], phase="fail"),
            step("Refresh and resume", "New token, same checkpoint.", ["r", "p"], [{"from": "r", "to": "p"}], phase="fix"),
        ]),
    ],
    examples=[],
    landing="Every fix lands the same way: durable page, then checkpoint, idempotent key, quarantine for poison.",
))

add(mod(
    id="race",
    title="The race",
    short="The race",
    minutes=10,
    summary="The same dataset can arrive by paging, by a bulk file, by a stream, by CDC, or by a nightly drop. They finish at different times and they mean different things by fresh.",
    analogy="Five ways to get the same books. One is a person walking the shelves. One is a truck. One is a conveyor that never stops.",
    sections=[
        {"h": "Read the lanes", "p": [
            "The times in the diagram are illustrative, labeled as a model, not a benchmark. Paging pays latency per page. Export pays a job plus a download. A stream is already moving, so 'finish' means caught up, and freshness is seconds if you keep up. CDC is similar, after the snapshot. A file drop is as fresh as the partner's schedule, often a day, and then it finishes in one load.",
        ]},
    ],
    diagrams=[
        race("Illustrative finish and freshness", [
            {"name": "Paged API", "seconds": 58, "freshness": "Stale by the time page 1 was fetched. Model: 10,000 pages at a tight rate limit.", "kind": "source"},
            {"name": "Bulk export", "seconds": 12, "freshness": "Point-in-time as of job start. Fresh enough for a daily decision.", "kind": "storage"},
            {"name": "Stream", "seconds": 4, "freshness": "Caught up means seconds behind, if lag stays inside retention.", "kind": "queue"},
            {"name": "CDC", "seconds": 8, "freshness": "Snapshot first, then near-real-time changes, including deletes.", "kind": "processing"},
            {"name": "Nightly file", "seconds": 20, "freshness": "Fresh as of last night. Fast to load, late to know.", "kind": "consumer"},
        ], [
            step("Start", "All five start when you notice you need the data. The stream and the file may have been moving already."),
            step("Early finishers", "A stream that is already populated looks fastest because you did not backfill. A backfill is a different race."),
            step("Paging still walking", "The paged API is still in the rate-limit math. Threads will not change that term."),
            step("What fresh means", "Export and files are snapshots. Streams and CDC are changes. Do not compare their clocks as if they were the same question."),
            step("Pick", "If you need history once, export or CDC snapshot. If you need tomorrow morning, a file may be enough. If you need minutes, a stream, CDC, or delta plus webhook."),
        ]),
    ],
    examples=[],
    landing="Land each lane in bronze with a 'as of' or an offset. Do not mix a snapshot and a stream into gold without a merge rule.",
))

add(mod(
    id="decision",
    title="Decision guide",
    short="Decide",
    minutes=20,
    summary="Pick the pattern from volume, freshness, what the source actually offers, and the constraint that will not move. The tree is a starting point. The scenarios below use illustrative numbers, labeled as such.",
    analogy="Choosing a vehicle. Distance, deadline, and whether the road is even open.",
    sections=[
        {"h": "Worked scenarios", "p": [
            "CRM, 50 million records, both REST and a bulk export. Illustrative: 50 million / 1,000 pages is 50,000 calls. At 200 ms that is hours, before limits. Use the bulk export for the snapshot. Use incremental or CDC-like deltas after that. Paging is the fallback.",
            "Government open data, 1,000 rows per page, strict limit. Illustrative: 1 million rows is 1,000 calls. If the limit is a handful per 30 seconds, the floor is hours. Raise the page size if allowed, get a key, or take a file. Do not add threads.",
            "Security telemetry, 250,000 devices. A daily snapshot file or the vendor's via-files export fits a morning report. Near-real-time detections need the event stream, not a nightly vulnerability table. Defender's own docs split JSON and via-files around 100-K devices. That is a verified vendor hint, not a universal law.",
            "Identity changes within minutes. Delta query plus a change notification. A nightly full pull will miss the minute. A webhook alone will miss an event.",
            "E-commerce order webhooks. Dedup, signature, queue, and a reconciliation pull of the orders API. The webhook is the hint.",
            "On-premises SQL Server to a lakehouse, near real time. Log-based CDC or a managed connector, after a snapshot. Direct full queries will hurt the primary and miss deletes.",
            "IoT, one reading a second. MQTT or a stream, partitioned by device. A REST pull per reading will fall behind and may be against the terms.",
            "Partner nightly CSV on SFTP. A done marker, schema check, idempotent load. Do not build a fake API in front of a file you already have, unless more than one team needs a contract.",
            "A website with no API. Ask for a feed. If the page is public and the terms allow reading, a careful scrape of a practice-style page is a last resort. If the terms forbid it, stop.",
        ]},
    ],
    diagrams=[
        state("Which pattern", ["file?", "fresh?", "cursor?", "limit?", "build"], [
            step("File or export?", "If yes, take it for the snapshot.", state_name="file?"),
            step("How fresh?", "Minutes means stream, CDC, or delta. A day means a schedule.", state_name="fresh?"),
            step("Cursor only?", "Then you cannot parallelize. Ask for keyset or a file.", state_name="cursor?"),
            step("Rate limit the ceiling?", "Threads will not help. Change the quota or the pattern.", state_name="limit?"),
            step("Then build", "Checkpoint, idempotent sink, reconciliation.", state_name="build"),
        ]),
    ],
    examples=[],
    landing="Write the choice down: pattern, freshness target, and the constraint you measured. Revisit it when the volume grows by 10x.",
))

add(mod(
    id="simulators",
    title="Simulators",
    short="Simulators",
    minutes=15,
    summary="Four models: throughput, a consumer group, offset drift, and webhook drops. They are models. They are not vendor limits.",
    analogy="A wind tunnel. Useful, and not the sky.",
    sections=[
        {"h": "Open the simulators", "p": [
            "This page is a pointer. The interactive simulators are mounted when the page id is simulators. If you are reading the markdown, run the HTML page instead.",
        ]},
    ],
    diagrams=[],
    examples=[],
    landing="A simulator does not land data. The labs do.",
))
