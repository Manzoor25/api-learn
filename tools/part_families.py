"""Family modules A-E. Vendor facts are only those checked on 2026-10-28."""

from helpers import flow, mod, nodes, race, seq, sstep, state, step

CHECKED = "2026-10-28"

FAMILIES = []


def add(item):
    FAMILIES.append(item)


add(mod(
    id="rest-pagination",
    family="A1",
    title="REST pagination",
    short="REST pages",
    minutes=18,
    pull=0.12,
    realtime=0.28,
    summary="A page cap is the provider protecting memory, timeouts, and other callers. Offset, page numbers, cursors, keyset, Link headers, and OData nextLink are different ways to say 'come back'.",
    analogy="A librarian will not hand you the whole building. Offset is 'skip 400 shelves'. A cursor is a bookmark they wrote. Keyset is 'the book after this call number'.",
    sections=[
        {"h": "Why it exists", "p": [
            "One response that holds every row can exhaust the server while it builds JSON, die at a gateway timeout, and starve every other client. The cap is a product decision, not a hint that the table has 1,000 rows.",
            "From the provider's side, a page is also a fairness unit. They can rate-limit requests. They cannot fairly rate-limit one client who asked for the universe.",
        ]},
        {"h": "The styles", "p": [
            "Offset and page numbers are easy and parallelizable, and wrong if rows move. Deep offset gets slower because the database often walks the skipped rows and throws them away.",
            "A cursor or an OData @odata.nextLink is an opaque URL or token. You do not parse it, and you cannot invent the next one, so you cannot fan that walk out across threads.",
            "Keyset is WHERE id > last_id. The index seeks, depth stays cheap, and you can cut the key space into ranges. A Link header is the same idea hiding in RFC 5988. Clients that only read JSON stop after page one.",
        ]},
        {"h": "How not to lose rows", "p": [
            "Stop on an empty page or has_more=false, not on a total counted at the start. Advance by the number of rows you actually received. Write each page before you checkpoint. Dedup on the primary key and keep the newest updated_at.",
            "If the table is live, do not trust offset. Ask for a cursor, a keyset, or a snapshot export.",
        ]},
    ],
    diagrams=[
        flow("Page, land, next page", nodes(
            ("client", "Client", "ingestion"),
            ("api", "API", "source"),
            ("disk", "Page file", "storage"),
        ), [
            step("Ask", "One request. One page. Not the table.", ["client", "api"], [{"from": "client", "to": "api"}]),
            step("Return", "The server caps the body and returns a next hint.", ["api", "client"], [{"from": "api", "to": "client"}]),
            step("Land", "Write the page before the next request. A crash keeps finished pages.", ["client", "disk"], [{"from": "client", "to": "disk"}]),
            step("Continue", "Follow the hint. Do not hold the whole dataset in a list.", ["client", "api"], [{"from": "client", "to": "api"}]),
        ]),
        state("Pagination loop", ["ask", "write", "checkpoint", "next", "done"], [
            step("Ask", "Send limit plus offset, cursor, or after_id.", state_name="ask"),
            step("Write", "Stream the page to disk. Memory stays flat.", state_name="write"),
            step("Checkpoint", "Save the cursor after the write, so a kill can resume.", state_name="checkpoint"),
            step("Next", "If the hint says more, loop. If not, stop.", state_name="next"),
            step("Done", "Validate unique keys against the reported total.", state_name="done"),
        ]),
        seq("Offset versus a cursor", ["Client", "API"], [
            sstep(0, 1, "GET limit=1000&offset=0", "First offset page", "Easy to start. The next offset is arithmetic."),
            sstep(1, 0, "rows plus has_more", "Page back", "If a row is inserted above you, the next skip repeats one row and drops another."),
            sstep(0, 1, "GET cursor=opaque", "Cursor page", "The token was minted by the previous response. You cannot start at page 40."),
            sstep(1, 0, "next cursor or stop", "Consistent walk", "Consistent, and sequential on purpose."),
        ]),
    ],
    examples=[
        {"domain": "Government", "name": "FDIC BankFind", "fact": "Checked " + CHECKED + ": limit and offset, default 10, maximum 10,000, total in meta.total. A live pull of 27,835 institutions at page size 10,000 was 3 requests and 2.9 seconds. limit=10001 returned HTTP 400.", "url": "https://api.fdic.gov/banks/docs/swagger.yaml", "source": "OpenAPI spec"},
        {"domain": "Identity", "name": "Microsoft Graph", "fact": "Checked " + CHECKED + ": collections page. GET /users returns a default of 100. Further pages are an @odata.nextLink URL you call as-is.", "url": "https://learn.microsoft.com/en-us/graph/paging", "source": "Microsoft Learn"},
        {"domain": "Payments", "name": "Stripe lists", "fact": "Checked " + CHECKED + ": list methods take limit (default 10, range 1 to 100), starting_after, and ending_before. has_more says whether another page exists.", "url": "https://docs.stripe.com/api/pagination", "source": "Stripe API"},
        {"domain": "Developer tools", "name": "GitHub REST pagination", "fact": "Checked " + CHECKED + ": GitHub paginates with a Link header (rel=next, prev, first, last). The issues example on that page returns 30 results even when more exist. per_page changes the page size. This course does not quote a maximum it did not copy from the page.", "url": "https://docs.github.com/en/rest/using-the-rest-api/using-pagination-in-the-rest-api", "source": "GitHub Docs"},
    ],
    landing="Raw pages as NDJSON or the original JSON, plus the request URL and cursor in the file name. Silver is deduped on the primary key. Gold is the business table. Do not compact before the page is durable.",
))

add(mod(
    id="rate-limits",
    family="A2",
    title="Rate limits and quotas",
    short="Rate limits",
    minutes=16,
    pull=0.18,
    realtime=0.34,
    summary="A limit is a budget, and the window matters more than the number. Concurrency helps until pages / allowed_rate is the larger term. After that, threads only buy 429s.",
    analogy="A turnstile that lets 5 people through every 30 seconds. Bringing 40 friends does not make the museum faster. It makes a crowd at the door.",
    sections=[
        {"h": "Why providers throttle", "p": [
            "The API is a shared machine. One noisy client can take the CPU, the database, and the egress. Limits are per user, per app, per tenant, per IP, or per token, and some endpoints have a second, stricter bucket.",
            "Cost-based limits charge points per query instead of one point per call. A wide GraphQL query can spend the budget of a hundred cheap calls. Daily quotas are a different clock from per-second limits.",
        ]},
        {"h": "What to do", "p": [
            "Read Retry-After and the rate-limit headers. Do not invent the window if the header is only a number. A client-side token bucket keeps you under a budget you already know. Retry 429 and 5xx with exponential backoff and jitter. Do not retry 400.",
            "Minimum pull time is pages divided by the allowed rate. If that number is an hour, the fix is a larger page, a bulk export, an incremental filter, or a higher quota. Not more threads.",
            "Multiple credentials can raise throughput only if the terms allow it. Splitting one customer's pull across borrowed keys to dodge a limit is often a terms violation, not an architecture.",
        ]},
    ],
    diagrams=[
        seq("A 429 is information", ["Client", "API"], [
            sstep(0, 1, "GET page", "Under budget", "The call is cheap until the window is full."),
            sstep(1, 0, "429 Retry-After", "Over budget", "The header is the earliest legal retry. Ignoring it creates a retry storm."),
            sstep(0, 0, "sleep plus jitter", "Back off", "Jitter stops a fleet of clients from waking up together."),
            sstep(0, 1, "GET page again", "Resume", "The page was not lost. It was delayed."),
        ]),
        flow("Where time goes", nodes(
            ("pages", "Pages", "source"),
            ("limit", "Limiter", "queue"),
            ("api", "API", "processing"),
        ), [
            step("Count pages", "pages = ceil(records / page_size).", ["pages"]),
            step("Two clocks", "Time is the max of pages × latency / concurrency and pages / rate.", ["pages", "limit"]),
            step("Cap", "If the rate term wins, extra concurrency highlights the limiter, not the API.", ["limit", "api"], [{"from": "limit", "to": "api"}]),
        ]),
    ],
    examples=[
        {"domain": "Developer tools", "name": "GitHub REST", "fact": "Checked " + CHECKED + " on the official rate-limit page: unauthenticated requests are 60 per hour per IP. Authenticated personal access tokens are 5,000 per hour. Secondary limits include no more than 100 concurrent requests. Search and GraphQL have their own budgets.", "url": "https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api", "source": "GitHub Docs"},
        {"domain": "Government", "name": "FDIC BankFind", "fact": "Checked " + CHECKED + " with live calls: every response included X-Ratelimit-Limit: 20. The header did not name the window. Eight quick calls succeeded, so it is not a one-per-second cap, and the window is still unpublished. Do not invent it.", "url": "https://api.fdic.gov/banks/docs/", "source": "FDIC docs plus live headers"},
        {"domain": "Government", "name": "NVD CVE API", "fact": "The developers pages are a client-rendered app. On " + CHECKED + " the static HTML did not include the numeric rate limit, so this course does not quote one. A live call the same day returned startIndex, resultsPerPage, and totalResults. Read the developers page the day you build the pull.", "url": "https://nvd.nist.gov/developers/start-here", "source": "NVD, numbers not extracted"},
    ],
    landing="Land pages as they succeed. A checkpoint plus a client limiter means a multi-hour pull can stop and resume without duplicating finished pages.",
))

add(mod(
    id="graphql",
    family="A3",
    title="GraphQL",
    short="GraphQL",
    minutes=14,
    pull=0.16,
    realtime=0.62,
    summary="GraphQL lets the client name the fields and walk connections with cursors. The provider's defense is query cost, depth, and sometimes persisted queries. Subscriptions are a push channel on top of the same schema.",
    analogy="Instead of taking a pre-packed shelf, you hand the librarian a shopping list. They still refuse a list that would empty the building.",
    sections=[
        {"h": "Why it exists", "p": [
            "REST often over-fetches or forces a second call for a nested object. GraphQL returns the shape you asked for. That is good for mobile clients and dangerous for extract jobs, because one query can fan out across the database.",
            "Connections are the pagination pattern: edges, node, cursor, pageInfo.hasNextPage, endCursor. You still cannot parallelize an opaque cursor.",
        ]},
        {"h": "Limits and landing", "p": [
            "Complexity limits, depth limits, and point budgets exist so a nested query cannot become a denial of service. Persisted queries let the server allow only known documents. Partial errors can return data and errors in the same body. Treat errors as a failed page unless you know the missing field is optional.",
            "Subscriptions are not a backfill. You still need a query or a bulk export for history, then a subscription or a delta for what happens next.",
        ]},
    ],
    diagrams=[
        seq("Connection cursor", ["Client", "GraphQL"], [
            sstep(0, 1, "items(first: 100)", "First page", "Ask for a page, not the whole graph."),
            sstep(1, 0, "edges, endCursor", "Cursors", "The cursor is opaque. Store it. Do not decode it."),
            sstep(0, 1, "items(after: cursor)", "Next page", "Same rule as REST cursors: page N needs page N-1."),
            sstep(1, 0, "hasNextPage false", "Stop", "Stop on the flag, not on a guessed count."),
        ]),
        flow("Cost limit", nodes(
            ("query", "Query", "ingestion"),
            ("cost", "Cost check", "queue"),
            ("data", "Resolver", "source"),
        ), [
            step("Score", "The server scores fields, depth, or points before it runs the expensive work.", ["query", "cost"], [{"from": "query", "to": "cost"}]),
            step("Reject", "Over budget is a client error. Retrying the same query will not help.", ["cost"], phase="fail"),
            step("Narrow", "Select fewer fields, a smaller page, or a persisted query the server already allows.", ["query", "data"], [{"from": "query", "to": "data"}], phase="fix"),
        ]),
    ],
    examples=[
        {"domain": "Developer tools", "name": "GitHub GraphQL", "fact": "GitHub documents a separate primary rate limit and query limits for GraphQL, distinct from the REST 5,000/hour budget. Check that page before you estimate a pull. This course does not copy a point formula it did not re-read line by line.", "url": "https://docs.github.com/en/graphql/overview/rate-limits-and-query-limits-for-the-graphql-api", "source": "GitHub Docs"},
        {"domain": "Pattern", "name": "Relay connections", "fact": "General pattern, not a vendor limit: edges, node, cursor, pageInfo. Use it when the schema offers it. Do not invent cursors the server did not return.", "url": "https://graphql.org/learn/pagination/", "source": "GraphQL.org"},
    ],
    landing="Store the raw response, the query document hash, and the end cursor. Silver projects the nodes you asked for. If the query changes, treat it as a new stream, not a continuation.",
))

add(mod(
    id="soap",
    family="A4",
    title="SOAP and legacy APIs",
    short="SOAP",
    minutes=10,
    pull=0.1,
    realtime=0.12,
    summary="SOAP is still how many banks, governments, and ERPs expose data. You get a WSDL contract, an XML envelope, and paging conventions that predate JSON. The extraction rules do not change.",
    analogy="A form with a cover sheet. The cover sheet is the envelope. The form is the body. Losing the cover sheet means the other side will not read the form.",
    sections=[
        {"h": "Why it is still here", "p": [
            "Enterprises bought these systems when XML contracts and WS-Security were the interoperability story. Replacing them is a multi-year program. Your pipeline does not get to wait.",
            "Paging may be a page number inside the body, a continuation token, or a maximum rows element. Read the WSDL and a captured response. Do not assume limit and offset.",
        ]},
        {"h": "How to extract it", "p": [
            "Send the envelope, parse the body, write the page, repeat. Watch SOAP faults separately from HTTP status. A HTTP 200 can still carry a fault. Namespaces will break a naive string search.",
            "Prefer the vendor's bulk or file interface if one exists. SOAP paging a million rows is the same hour-long problem as REST, with more XML.",
        ]},
    ],
    diagrams=[
        seq("Envelope in, page out", ["Client", "SOAP service"], [
            sstep(0, 1, "SOAP envelope", "Request", "Action, auth header, and page token live in XML, not always in the URL."),
            sstep(1, 0, "body or fault", "Response", "HTTP 200 plus a Fault is still a failure. Do not land it as data."),
            sstep(0, 1, "next page token", "Continue", "The token is in the body. Checkpoint that, not the HTTP status."),
        ]),
    ],
    examples=[
        {"domain": "Enterprise", "name": "ERP and bank cores", "fact": "Pattern, not a measured limit: many core systems still publish WSDL. Confirm page size in that WSDL. This course does not invent a vendor maximum.", "url": "https://www.w3.org/TR/soap12-part1/", "source": "W3C SOAP 1.2"},
    ],
    landing="Store the raw XML page and a parsed NDJSON projection. Keep the raw envelope until silver validation passes. Schema changes show up as new elements, not as a friendly JSON field.",
))

add(mod(
    id="grpc",
    family="A5",
    title="gRPC",
    short="gRPC",
    minutes=12,
    pull=0.22,
    realtime=0.72,
    summary="gRPC is a contract in protobuf and four call shapes: unary, server streaming, client streaming, and bidirectional. Deadlines replace the vague hope that a call will finish.",
    analogy="A phone call with a strict time limit. Unary is one question, one answer. Server streaming is them reading a list while you listen. Bidirectional is both people talking.",
    sections=[
        {"h": "Why it exists", "p": [
            "Internal platforms want small binary messages, generated clients, and streams that do not pretend to be web pages. Public internet APIs are still mostly JSON. You will meet gRPC at service boundaries and some vendor SDKs.",
            "A deadline is part of the request. When it passes, the call is cancelled. Retrying without a new deadline just fails faster.",
        ]},
        {"h": "Extraction", "p": [
            "Unary pagination looks like RPC page tokens. Server streaming can deliver a snapshot or a tail of events. You still checkpoint the last id or offset the server defines. A stream is not durable storage.",
            "Load balancing, TLS, and message size limits are operational. A giant message hits the same wall as a giant JSON page.",
        ]},
    ],
    diagrams=[
        flow("Server stream", nodes(
            ("client", "Client", "ingestion"),
            ("rpc", "gRPC", "source"),
            ("disk", "Landing", "storage"),
        ), [
            step("Open", "One RPC, many messages. Set a deadline.", ["client", "rpc"], [{"from": "client", "to": "rpc"}]),
            step("Messages", "Each message is a record or a batch. Write it. Do not buffer the stream in a list.", ["rpc", "disk"], [{"from": "rpc", "to": "disk"}]),
            step("Resume", "On disconnect, reopen with the last committed id. The stream itself forgot you.", ["client", "rpc"], [{"from": "client", "to": "rpc"}]),
        ]),
    ],
    examples=[
        {"domain": "Platform", "name": "gRPC call shapes", "fact": "Pattern from the gRPC project: unary, server-streaming, client-streaming, bidirectional. No numeric vendor limit is claimed here.", "url": "https://grpc.io/docs/what-is-grpc/core-concepts/", "source": "grpc.io"},
    ],
    landing="Append messages to a durable log or object files with the last id. Silver starts after the checkpoint advances. A cancelled RPC is a retry, not a successful empty extract.",
))

add(mod(
    id="batch-requests",
    family="A6",
    title="Batch request APIs",
    short="Batch calls",
    minutes=10,
    pull=0.2,
    realtime=0.3,
    summary="A batch endpoint bundles many operations into one HTTP call. It saves round trips. It does not raise the rate limit, and part of the batch can fail while the rest succeeds.",
    analogy="One envelope with twenty letters. The post office can reject three letters and deliver seventeen. You still have to open the envelope.",
    sections=[
        {"h": "Why it exists", "p": [
            "Chatty APIs punish latency. A batch collapses twenty GETs into one request. Providers then throttle the inner operations, or count the batch as N calls, so you cannot smuggle a million reads through one HTTP status.",
        ]},
        {"h": "Partial failure", "p": [
            "Inspect each item status. Retry only the failed items. Landing the whole batch because the outer call was HTTP 200 will hide missing records.",
            "Order is not a transaction unless the docs say it is. Do not assume item 8 sees the write from item 3.",
        ]},
    ],
    diagrams=[
        seq("One call, many outcomes", ["Client", "Batch API"], [
            sstep(0, 1, "POST 20 operations", "Bundle", "Fewer round trips. Same business limits."),
            sstep(1, 0, "200 with item errors", "Partial", "The envelope succeeded. Three items did not. Read the item codes."),
            sstep(0, 1, "retry the 3", "Selective retry", "Retrying the whole batch can duplicate the 17 that worked."),
        ]),
    ],
    examples=[
        {"domain": "Identity", "name": "JSON batching pattern", "fact": "General pattern: outer HTTP success does not mean every inner call succeeded. Confirm whether the vendor counts inner calls against the quota. This course does not invent that count.", "url": "https://learn.microsoft.com/en-us/graph/json-batching", "source": "Graph JSON batching overview"},
    ],
    landing="Write a result row per inner request, including status and error. Silver keeps only the successes. The retry job reads the failures, not the whole batch.",
))

add(mod(
    id="query-apis",
    family="A7",
    title="Query APIs",
    short="Query APIs",
    minutes=12,
    pull=0.24,
    realtime=0.4,
    summary="You send a query, a search, or SQL-over-HTTP. The provider caps rows, bytes, and time. Big questions have to be sliced, or turned into an async job.",
    analogy="Asking a researcher one enormous question and being told the answer will not fit on a page, and they will hang up after a minute.",
    sections=[
        {"h": "Why the cap exists", "p": [
            "A log or warehouse query can scan terabytes. The API is a front door, not the engine. Row caps, byte caps, and timeouts keep one question from owning the cluster.",
            "Search APIs add relevance windows and deep-paging bans. Offset 100000 in search is often rejected on purpose.",
        ]},
        {"h": "Workaround", "p": [
            "Time-slice: one query per hour, or per partition key. Or submit an async query job, poll, and download the file. Do not loop offset until the server refuses.",
            "Save the query text and the slice bounds with the output. A rerun must be the same question or you cannot explain a different count.",
        ]},
    ],
    diagrams=[
        flow("Slice a query that will not fit", nodes(
            ("q", "Query", "ingestion"),
            ("slice", "Time slice", "processing"),
            ("job", "Async job", "queue"),
            ("file", "Result file", "storage"),
        ), [
            step("Too big", "The synchronous call hits a row cap or a timeout.", ["q"], phase="fail"),
            step("Slice", "Same query, narrower time or key range.", ["q", "slice"], [{"from": "q", "to": "slice"}], phase="fix"),
            step("Or export", "If the API offers a job, poll and download instead of paging.", ["slice", "job"], [{"from": "slice", "to": "job"}]),
            step("Land", "Each slice is a file with its bounds in the name.", ["job", "file"], [{"from": "job", "to": "file"}]),
        ]),
    ],
    examples=[
        {"domain": "Pattern", "name": "SQL-over-HTTP and search", "fact": "Pattern: row caps, byte caps, and timeouts are normal. Read the specific engine's docs before you cite a number. None is invented here.", "url": "https://www.elastic.co/guide/en/elasticsearch/reference/current/paginate-search-results.html", "source": "Search pagination pattern"},
    ],
    landing="One object per slice, plus a manifest of slices. Completeness is 'every slice succeeded', not 'the last call returned fewer than the cap' if a middle slice failed.",
))

add(mod(
    id="bulk-export",
    family="B8",
    title="Async bulk export",
    short="Bulk export",
    minutes=16,
    pull=0.28,
    realtime=0.08,
    summary="Ask for a job, poll or wait for a callback, download compressed files, sometimes from URLs that expire. This is usually the right tool once paging would take an hour.",
    analogy="The library mailing you boxes instead of handing you one shelf at a time. The boxes have a pickup deadline.",
    sections=[
        {"h": "Why providers offer it", "p": [
            "They can scan once, write files, and hand you object storage. That is cheaper for them than a thousand interactive queries, and kinder to other tenants.",
            "The file is a point-in-time snapshot. It is not a live tail. Freshness is 'as of job start', which you should store.",
        ]},
        {"h": "Failure modes", "p": [
            "Signed URLs expire. A downloader that starts late gets 403 and must ask for fresh URLs, not invent a retry of the old URL forever.",
            "Download files in parallel only up to the documented concurrency. Poll politely. A job that is still running is not a failure.",
            "Partial files and truncated gzip are real. Check size, checksum, or a manifest before you archive the job as done.",
        ]},
    ],
    diagrams=[
        state("Export job", ["requested", "running", "complete", "downloaded", "expired"], [
            step("Requested", "You asked. You do not have data yet.", state_name="requested"),
            step("Running", "Poll, or wait for a callback. Do not start the download.", state_name="running"),
            step("Complete", "URLs are ready. Note the expiry.", state_name="complete"),
            step("Downloaded", "Files checked, then landed. Checkpoint the job id.", state_name="downloaded"),
            step("Expired", "The URL died. Ask for a new URL. Do not treat 403 as an empty file.", state_name="expired"),
        ]),
        seq("Poll, then download", ["Client", "Export API", "Object store"], [
            sstep(0, 1, "POST job", "Start", "Filters and format go in the request. Save the job id."),
            sstep(1, 0, "state=running", "Poll", "Running is progress. Back off the poll."),
            sstep(1, 0, "URLs", "Ready", "URLs are capabilities with a clock on them."),
            sstep(0, 2, "GET file", "Download", "Parallel downloads, checksum, then mark the job landed."),
        ]),
        flow("Expired URL, then the fix", nodes(
            ("job", "Job", "queue"),
            ("url", "Signed URL", "source"),
            ("disk", "Landing", "storage"),
        ), [
            step("URL dies", "The download starts after expiry and gets 403. The snapshot still exists.", ["url"], phase="fail"),
            step("Refresh", "Ask the job API for new URLs. Do not keep the dead one.", ["job", "url"], [{"from": "job", "to": "url"}], phase="fix"),
            step("Land", "Download, verify, checkpoint.", ["url", "disk"], [{"from": "url", "to": "disk"}], phase="fix"),
        ]),
    ],
    examples=[
        {"domain": "CRM", "name": "Salesforce Bulk API 2.0", "fact": "Checked " + CHECKED + ": both Bulk APIs are asynchronous. Salesforce says any operation of more than 2,000 records is a good candidate for Bulk API 2.0, and jobs under 2,000 should use synchronous REST or SOAP. There is no SLA because the work is background.", "url": "https://developer.salesforce.com/docs/platform/api-asynch/guide/asynch-api-intro.html", "source": "Salesforce developers"},
        {"domain": "Security", "name": "Defender Vulnerability Management", "fact": "Checked " + CHECKED + ": JSON response is described as best for small organizations with less than 100-K devices. Via files is recommended for large organizations with more than 100-K devices. The payload is a current snapshot, not history. A separate delta export is a date range, not a full export.", "url": "https://learn.microsoft.com/en-us/defender-endpoint/api/get-assessment-software-vulnerabilities", "source": "Microsoft Learn"},
    ],
    landing="Land the files untouched in bronze, with job id, snapshot time, and URL expiry. Silver parses after checksum. Do not delete the source file until silver succeeds.",
))

add(mod(
    id="file-drops",
    family="B9",
    title="File drops",
    short="File drops",
    minutes=14,
    pull=0.32,
    realtime=0.06,
    summary="A partner drops CSV, JSON lines, Parquet, or Avro on SFTP, S3, or a file share. The hard part is knowing the file is finished, and not loading a half-written one.",
    analogy="A courier leaving a box. If you open it while they are still packing, you inventory half the books and call it the shipment.",
    sections=[
        {"h": "Why files", "p": [
            "Some partners have no API. A nightly file is the contract. It is simple, replayable, and awful at freshness. Agree the schedule, the name, the format, and the done signal in writing.",
        ]},
        {"h": "Done markers", "p": [
            "Writers should write to a temporary name and rename, or write a manifest and a .done file after the bytes are flushed. Readers ignore files without the marker. A size that is still changing is not done.",
            "Quarantine files that fail schema or checksum. Do not poison the silver table. Archive only after a successful load, so a rerun can find the raw file.",
        ]},
    ],
    diagrams=[
        state("File-drop states", ["arrived", "validated", "loaded", "archived", "quarantine"], [
            step("Arrived", "Bytes exist. That is not the same as finished.", state_name="arrived"),
            step("Validated", "Done marker, size, and schema checked.", state_name="validated"),
            step("Loaded", "Idempotent load on the file id or a business key.", state_name="loaded"),
            step("Archived", "Raw file kept. The load record says which file produced which rows.", state_name="archived"),
            step("Quarantine", "Bad file parked with the error. The pipeline continues.", state_name="quarantine"),
        ]),
        flow("Half-written file", nodes(
            ("tmp", "Partial", "error"),
            ("done", "Done marker", "queue"),
            ("loader", "Loader", "processing"),
            ("lake", "Lake", "storage"),
        ), [
            step("Too early", "The loader sees data.csv while the writer still has it open. The row count is a lie.", ["tmp", "loader"], phase="fail"),
            step("Marker", "The writer closes the file, then writes data.csv.done.", ["done"], phase="fix"),
            step("Load", "The loader only picks files with a marker, then lands them.", ["done", "loader", "lake"], [{"from": "done", "to": "loader"}], phase="fix"),
        ]),
    ],
    examples=[
        {"domain": "Partner exchange", "name": "SFTP and object drops", "fact": "Pattern: temporary name plus rename, or a manifest, is the usual done signal. Formats you will see are CSV, JSON lines, Parquet, and Avro. No vendor file-size limit is claimed.", "url": "https://www.rfc-editor.org/rfc/rfc4180", "source": "CSV is a convention; confirm the partner spec"},
    ],
    landing="Bronze is the file plus arrival metadata. Silver is parsed rows with the source file name. A rerun of the same file id must not double the facts.",
))

add(mod(
    id="data-sharing",
    family="B10",
    title="Sharing without copying",
    short="Data sharing",
    minutes=10,
    pull=0.4,
    realtime=0.18,
    summary="Sometimes the right extract is no extract. Delta Sharing and warehouse-native shares let a consumer query the provider's tables under a grant. You still need to know freshness, schema, and what happens when the share is revoked.",
    analogy="A library card instead of a photocopy. You can read the shelf. You do not own the building, and the card can be taken back.",
    sections=[
        {"h": "When not to copy", "p": [
            "Copying a 10 TB table every night is egress, time, and a stale twin. A share lets the consumer read in place, or replicate on its own schedule. Open-data portals are the public version: a dataset you query, sometimes with an API in front.",
            "You trade control. The provider can change schema, delay a refresh, or revoke access. Your gold models need a contract and a test, not a hope.",
        ]},
        {"h": "Still land something", "p": [
            "If downstream jobs need a stable snapshot, materialize one on your side and record the share version or timestamp. A dashboard that queries a live share will change under a meeting.",
        ]},
    ],
    diagrams=[
        flow("Share, then optional copy", nodes(
            ("provider", "Provider", "source"),
            ("share", "Share", "processing"),
            ("consumer", "Consumer", "consumer"),
            ("snap", "Snapshot", "storage"),
        ), [
            step("Grant", "Access is a policy, not a file in your bucket yet.", ["provider", "share"], [{"from": "provider", "to": "share"}]),
            step("Query", "The consumer reads through the share.", ["share", "consumer"], [{"from": "share", "to": "consumer"}]),
            step("Materialize", "If you need a frozen input, copy a versioned snapshot.", ["consumer", "snap"], [{"from": "consumer", "to": "snap"}]),
        ]),
    ],
    examples=[
        {"domain": "Lakehouse", "name": "Delta Sharing", "fact": "Pattern: an open protocol for sharing lakehouse tables without a custom pipeline per consumer. Confirm the current protocol and recipient model on the project site. No throughput number is claimed here.", "url": "https://delta.io/sharing/", "source": "Delta Lake"},
        {"domain": "Government", "name": "Open data portals", "fact": "Pattern: a portal plus an API. FDIC BankFind, measured in the pagination module, is one public example of API access rather than a private share.", "url": "https://api.fdic.gov/banks/docs/", "source": "FDIC"},
    ],
    landing="If you copy, land a versioned snapshot. If you do not copy, record the share version your gold model was certified against.",
))
