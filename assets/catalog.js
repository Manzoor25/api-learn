window.API_LEARN_MODULES = [
  {
    "id": "common-apis",
    "title": "The API types you will actually meet",
    "short": "Common APIs",
    "minutes": 20,
    "summary": "Six shapes cover almost every pull. REST JSON is the default. GraphQL, webhooks, and bulk export are the other three you should recognize on sight. SOAP and gRPC are common too, but in older enterprises and inside companies, not on most public data APIs.",
    "analogy": "Six doors. You do not need the floor plan of the building until you know which door you are standing in front of.",
    "sections": [
      {
        "h": "This is a teaching judgment, not a census",
        "p": [
          "Nobody publishes a reliable 'percent of all APIs' number that is worth quoting. What follows is the set a data engineer hits in the first year: public data, SaaS, and the internal platform. If the docs do not match one of these, use the full map. Do not force a source into a type because it is familiar."
        ]
      },
      {
        "h": "1. REST JSON. The default",
        "p": [
          "A URL, an HTTP verb, and a JSON body. This is GitHub, Stripe, FDIC BankFind, and most SaaS products. You ask. They return a page. You come back.",
          "The variation that matters is pagination, not the word REST. Offset or page number, a cursor, a Link header, or an OData @odata.nextLink. Microsoft Graph is REST with nextLink. Stripe's list API is REST with a cursor hiding in starting_after. FDIC is REST with limit and offset, maximum 10,000.",
          "The usual pain is a page cap plus a rate limit. Read the maximum page size and the rate-limit window before you add threads. The deeper lesson is the REST pagination and rate-limit modules."
        ]
      },
      {
        "h": "2. GraphQL. You name the fields",
        "p": [
          "One POST, usually to /graphql, with a query document. You ask for the fields you want, including nested objects, and you page with a connection cursor: edges, node, pageInfo, endCursor.",
          "You meet it on GitHub's GraphQL API, Shopify, and a lot of product APIs built after about 2018. It is less common than REST for bulk extracts, and more common when a product team got tired of clients over-fetching.",
          "The provider's defense is query cost, not a page-size sentence. A wide query can be rejected even if the page is small. You still cannot parallelize an opaque cursor."
        ]
      },
      {
        "h": "3. Webhooks. They call you",
        "p": [
          "You give them a URL. When something happens, they POST a JSON body to it, usually with a signature. Stripe, GitHub, Slack, and shop platforms do this for orders, pushes, and messages.",
          "This is not an extract. It is a doorbell. Events drop, duplicate, and arrive late. A webhook feed without a reconciliation pull against the REST API will lose rows. Verify the signature, dedup on the event id, ack fast."
        ]
      },
      {
        "h": "4. Bulk export. A job, then a file",
        "p": [
          "You POST a job, poll until it is complete, then download a compressed file. Sometimes the download URL expires. Salesforce Bulk API 2.0 is the textbook: more than 2,000 records is their own hint to stop using synchronous calls. Defender Vulnerability Management says the same thing in different words: JSON pages for smaller estates, files past about 100,000 devices.",
          "If the docs mention jobs, exports, or download URLs, take that path for the snapshot. Page only if they do not offer it."
        ]
      },
      {
        "h": "5. SOAP. Still in the building",
        "p": [
          "XML envelope, a WSDL contract, and paging fields inside the body. You will meet it in banks, governments, and older ERP systems. New public APIs are rarely SOAP. Old systems that hold the money often are.",
          "HTTP 200 can still carry a SOAP fault. Do not land a fault as a row. If they also drop a nightly file, take the file."
        ]
      },
      {
        "h": "6. gRPC. Inside the company",
        "p": [
          "A protobuf contract and HTTP/2. Unary calls look like a function. Server streaming looks like a list that never becomes a web page. Common between internal services. Uncommon as the public API a partner gives you for a nightly extract.",
          "A stream is not storage. Checkpoint the last id, and set a deadline. If the public door is REST and the internal door is gRPC, pull from whichever one your team is allowed to call."
        ]
      },
      {
        "h": "How to name it in ten minutes",
        "p": [
          "Open the docs and find one example that returns two records. Look at the URL and the body. POST /graphql means GraphQL. A WSDL or an XML envelope means SOAP. A .proto file means gRPC. A job id and a download URL means bulk export. A 'we will POST to your server' section means webhooks. Everything else that returns JSON from a URL you call is REST. Then find the pagination parameters and the rate-limit sentence before you write a loop."
        ]
      }
    ],
    "diagrams": [
      {
        "type": "sequence",
        "title": "Name the door from one example call",
        "blurb": "Each arrow is one interaction. Step through it.",
        "actors": [
          "You",
          "Docs"
        ],
        "steps": [
          {
            "from": 0,
            "to": 1,
            "label": "one example, two rows",
            "title": "Read one call",
            "text": "Ignore the marketing page. You want a real request and a real response."
          },
          {
            "from": 1,
            "to": 0,
            "label": "URL, body, headers",
            "title": "Look at the shape",
            "text": "JSON from a URL you call is REST. A query document is GraphQL. XML plus WSDL is SOAP."
          },
          {
            "from": 0,
            "to": 1,
            "label": "pagination and limit",
            "title": "Find the constraint",
            "text": "Page size, cursor or offset, rate-limit window, and whether a file export exists."
          },
          {
            "from": 1,
            "to": 0,
            "label": "named type",
            "title": "Stop guessing",
            "text": "Then open that module. Do not start with threads."
          }
        ]
      },
      {
        "type": "flow",
        "title": "The four you will use on a pull",
        "blurb": "Packets move only on the highlighted hop.",
        "nodes": [
          {
            "id": "rest",
            "label": "REST page",
            "kind": "source",
            "x": 16,
            "y": 96
          },
          {
            "id": "hook",
            "label": "Webhook",
            "kind": "consumer",
            "x": 166,
            "y": 96
          },
          {
            "id": "job",
            "label": "Export job",
            "kind": "queue",
            "x": 316,
            "y": 96
          },
          {
            "id": "file",
            "label": "File",
            "kind": "storage",
            "x": 466,
            "y": 96
          }
        ],
        "steps": [
          {
            "title": "REST is the daily door",
            "text": "Most extracts start here. Page, land, checkpoint.",
            "hot": [
              "rest"
            ]
          },
          {
            "title": "Webhook is a hint",
            "text": "It tells you something changed. It is not the ledger.",
            "hot": [
              "hook",
              "rest"
            ],
            "packets": [
              {
                "from": "hook",
                "to": "rest"
              }
            ]
          },
          {
            "title": "Export when paging is the hour",
            "text": "A job writes the file. You download it once.",
            "hot": [
              "rest",
              "job"
            ],
            "packets": [
              {
                "from": "rest",
                "to": "job"
              }
            ]
          },
          {
            "title": "Land the file",
            "text": "Checksum, then bronze. The page loop was the fallback.",
            "hot": [
              "job",
              "file"
            ],
            "packets": [
              {
                "from": "job",
                "to": "file"
              }
            ]
          }
        ]
      },
      {
        "type": "state",
        "title": "Which common type is this?",
        "blurb": "The glowing state is where you are.",
        "states": [
          "REST",
          "GraphQL",
          "webhook",
          "export",
          "SOAP",
          "gRPC"
        ],
        "steps": [
          {
            "title": "REST",
            "text": "You call a URL. JSON comes back. Look for limit, offset, cursor, Link, or nextLink.",
            "state": "REST"
          },
          {
            "title": "GraphQL",
            "text": "You POST a query. Page with endCursor. Watch the cost limit.",
            "state": "GraphQL"
          },
          {
            "title": "Webhook",
            "text": "They POST to you. Signature, dedup, then reconcile.",
            "state": "webhook"
          },
          {
            "title": "Export",
            "text": "Job, poll, download. URLs expire.",
            "state": "export"
          },
          {
            "title": "SOAP",
            "text": "XML envelope. A fault can hide in HTTP 200.",
            "state": "SOAP"
          },
          {
            "title": "gRPC",
            "text": "Protobuf and a stream or a unary call. Checkpoint the last id.",
            "state": "gRPC"
          }
        ]
      }
    ],
    "examples": [
      {
        "domain": "REST",
        "name": "FDIC, GitHub, Stripe",
        "fact": "Checked 2026-10-28: FDIC is limit/offset, max 10,000. GitHub pages with a Link header and limits 60/hour unauthenticated, 5,000/hour with a token. Stripe lists use limit 1-100 and starting_after.",
        "url": "https://docs.github.com/en/rest/using-the-rest-api/using-pagination-in-the-rest-api",
        "source": "GitHub pagination docs"
      },
      {
        "domain": "GraphQL",
        "name": "GitHub GraphQL",
        "fact": "GitHub documents a separate query-cost limit from the REST budget. Confirm the current points on that page before you estimate a pull.",
        "url": "https://docs.github.com/en/graphql/overview/rate-limits-and-query-limits-for-the-graphql-api",
        "source": "GitHub GraphQL limits"
      },
      {
        "domain": "Bulk",
        "name": "Salesforce and Defender",
        "fact": "Checked 2026-10-28: Salesforce says more than 2,000 records is a Bulk API 2.0 candidate. Defender says JSON pages under 100-K devices and files above that.",
        "url": "https://developer.salesforce.com/docs/platform/api-asynch/guide/asynch-api-intro.html",
        "source": "Salesforce Bulk API intro"
      }
    ],
    "landing": "Whatever the type, bronze is the raw response or file plus the cursor, job id, or event id. Silver dedups on the primary key. The type tells you how the bytes arrive. It does not change that rule."
  },
  {
    "id": "rest-pagination",
    "family": "A1",
    "title": "REST pagination",
    "short": "REST pages",
    "minutes": 18,
    "pull": 0.12,
    "realtime": 0.28,
    "summary": "A page cap is the provider protecting memory, timeouts, and other callers. Offset, page numbers, cursors, keyset, Link headers, and OData nextLink are different ways to say 'come back'.",
    "analogy": "A librarian will not hand you the whole building. Offset is 'skip 400 shelves'. A cursor is a bookmark they wrote. Keyset is 'the book after this call number'.",
    "sections": [
      {
        "h": "Why it exists",
        "p": [
          "One response that holds every row can exhaust the server while it builds JSON, die at a gateway timeout, and starve every other client. The cap is a product decision, not a hint that the table has 1,000 rows.",
          "From the provider's side, a page is also a fairness unit. They can rate-limit requests. They cannot fairly rate-limit one client who asked for the universe."
        ]
      },
      {
        "h": "The styles",
        "p": [
          "Offset and page numbers are easy and parallelizable, and wrong if rows move. Deep offset gets slower because the database often walks the skipped rows and throws them away.",
          "A cursor or an OData @odata.nextLink is an opaque URL or token. You do not parse it, and you cannot invent the next one, so you cannot fan that walk out across threads.",
          "Keyset is WHERE id > last_id. The index seeks, depth stays cheap, and you can cut the key space into ranges. A Link header is the same idea hiding in RFC 5988. Clients that only read JSON stop after page one."
        ]
      },
      {
        "h": "How not to lose rows",
        "p": [
          "Stop on an empty page or has_more=false, not on a total counted at the start. Advance by the number of rows you actually received. Write each page before you checkpoint. Dedup on the primary key and keep the newest updated_at.",
          "If the table is live, do not trust offset. Ask for a cursor, a keyset, or a snapshot export."
        ]
      }
    ],
    "diagrams": [
      {
        "type": "flow",
        "title": "Page, land, next page",
        "blurb": "Packets move only on the highlighted hop.",
        "nodes": [
          {
            "id": "client",
            "label": "Client",
            "kind": "ingestion",
            "x": 16,
            "y": 96
          },
          {
            "id": "api",
            "label": "API",
            "kind": "source",
            "x": 166,
            "y": 96
          },
          {
            "id": "disk",
            "label": "Page file",
            "kind": "storage",
            "x": 316,
            "y": 96
          }
        ],
        "steps": [
          {
            "title": "Ask",
            "text": "One request. One page. Not the table.",
            "hot": [
              "client",
              "api"
            ],
            "packets": [
              {
                "from": "client",
                "to": "api"
              }
            ]
          },
          {
            "title": "Return",
            "text": "The server caps the body and returns a next hint.",
            "hot": [
              "api",
              "client"
            ],
            "packets": [
              {
                "from": "api",
                "to": "client"
              }
            ]
          },
          {
            "title": "Land",
            "text": "Write the page before the next request. A crash keeps finished pages.",
            "hot": [
              "client",
              "disk"
            ],
            "packets": [
              {
                "from": "client",
                "to": "disk"
              }
            ]
          },
          {
            "title": "Continue",
            "text": "Follow the hint. Do not hold the whole dataset in a list.",
            "hot": [
              "client",
              "api"
            ],
            "packets": [
              {
                "from": "client",
                "to": "api"
              }
            ]
          }
        ]
      },
      {
        "type": "state",
        "title": "Pagination loop",
        "blurb": "The glowing state is where you are.",
        "states": [
          "ask",
          "write",
          "checkpoint",
          "next",
          "done"
        ],
        "steps": [
          {
            "title": "Ask",
            "text": "Send limit plus offset, cursor, or after_id.",
            "state": "ask"
          },
          {
            "title": "Write",
            "text": "Stream the page to disk. Memory stays flat.",
            "state": "write"
          },
          {
            "title": "Checkpoint",
            "text": "Save the cursor after the write, so a kill can resume.",
            "state": "checkpoint"
          },
          {
            "title": "Next",
            "text": "If the hint says more, loop. If not, stop.",
            "state": "next"
          },
          {
            "title": "Done",
            "text": "Validate unique keys against the reported total.",
            "state": "done"
          }
        ]
      },
      {
        "type": "sequence",
        "title": "Offset versus a cursor",
        "blurb": "Each arrow is one interaction. Step through it.",
        "actors": [
          "Client",
          "API"
        ],
        "steps": [
          {
            "from": 0,
            "to": 1,
            "label": "GET limit=1000&offset=0",
            "title": "First offset page",
            "text": "Easy to start. The next offset is arithmetic."
          },
          {
            "from": 1,
            "to": 0,
            "label": "rows plus has_more",
            "title": "Page back",
            "text": "If a row is inserted above you, the next skip repeats one row and drops another."
          },
          {
            "from": 0,
            "to": 1,
            "label": "GET cursor=opaque",
            "title": "Cursor page",
            "text": "The token was minted by the previous response. You cannot start at page 40."
          },
          {
            "from": 1,
            "to": 0,
            "label": "next cursor or stop",
            "title": "Consistent walk",
            "text": "Consistent, and sequential on purpose."
          }
        ]
      }
    ],
    "examples": [
      {
        "domain": "Government",
        "name": "FDIC BankFind",
        "fact": "Checked 2026-10-28: limit and offset, default 10, maximum 10,000, total in meta.total. A live pull of 27,835 institutions at page size 10,000 was 3 requests and 2.9 seconds. limit=10001 returned HTTP 400.",
        "url": "https://api.fdic.gov/banks/docs/swagger.yaml",
        "source": "OpenAPI spec"
      },
      {
        "domain": "Identity",
        "name": "Microsoft Graph",
        "fact": "Checked 2026-10-28: collections page. GET /users returns a default of 100. Further pages are an @odata.nextLink URL you call as-is.",
        "url": "https://learn.microsoft.com/en-us/graph/paging",
        "source": "Microsoft Learn"
      },
      {
        "domain": "Payments",
        "name": "Stripe lists",
        "fact": "Checked 2026-10-28: list methods take limit (default 10, range 1 to 100), starting_after, and ending_before. has_more says whether another page exists.",
        "url": "https://docs.stripe.com/api/pagination",
        "source": "Stripe API"
      },
      {
        "domain": "Developer tools",
        "name": "GitHub REST pagination",
        "fact": "Checked 2026-10-28: GitHub paginates with a Link header (rel=next, prev, first, last). The issues example on that page returns 30 results even when more exist. per_page changes the page size. This course does not quote a maximum it did not copy from the page.",
        "url": "https://docs.github.com/en/rest/using-the-rest-api/using-pagination-in-the-rest-api",
        "source": "GitHub Docs"
      }
    ],
    "landing": "Raw pages as NDJSON or the original JSON, plus the request URL and cursor in the file name. Silver is deduped on the primary key. Gold is the business table. Do not compact before the page is durable.",
    "map": {
      "pull": 0.12,
      "realtime": 0.28
    }
  },
  {
    "id": "rate-limits",
    "family": "A2",
    "title": "Rate limits and quotas",
    "short": "Rate limits",
    "minutes": 16,
    "pull": 0.18,
    "realtime": 0.34,
    "summary": "A limit is a budget, and the window matters more than the number. Concurrency helps until pages / allowed_rate is the larger term. After that, threads only buy 429s.",
    "analogy": "A turnstile that lets 5 people through every 30 seconds. Bringing 40 friends does not make the museum faster. It makes a crowd at the door.",
    "sections": [
      {
        "h": "Why providers throttle",
        "p": [
          "The API is a shared machine. One noisy client can take the CPU, the database, and the egress. Limits are per user, per app, per tenant, per IP, or per token, and some endpoints have a second, stricter bucket.",
          "Cost-based limits charge points per query instead of one point per call. A wide GraphQL query can spend the budget of a hundred cheap calls. Daily quotas are a different clock from per-second limits."
        ]
      },
      {
        "h": "What to do",
        "p": [
          "Read Retry-After and the rate-limit headers. Do not invent the window if the header is only a number. A client-side token bucket keeps you under a budget you already know. Retry 429 and 5xx with exponential backoff and jitter. Do not retry 400.",
          "Minimum pull time is pages divided by the allowed rate. If that number is an hour, the fix is a larger page, a bulk export, an incremental filter, or a higher quota. Not more threads.",
          "Multiple credentials can raise throughput only if the terms allow it. Splitting one customer's pull across borrowed keys to dodge a limit is often a terms violation, not an architecture."
        ]
      }
    ],
    "diagrams": [
      {
        "type": "sequence",
        "title": "A 429 is information",
        "blurb": "Each arrow is one interaction. Step through it.",
        "actors": [
          "Client",
          "API"
        ],
        "steps": [
          {
            "from": 0,
            "to": 1,
            "label": "GET page",
            "title": "Under budget",
            "text": "The call is cheap until the window is full."
          },
          {
            "from": 1,
            "to": 0,
            "label": "429 Retry-After",
            "title": "Over budget",
            "text": "The header is the earliest legal retry. Ignoring it creates a retry storm."
          },
          {
            "from": 0,
            "to": 0,
            "label": "sleep plus jitter",
            "title": "Back off",
            "text": "Jitter stops a fleet of clients from waking up together."
          },
          {
            "from": 0,
            "to": 1,
            "label": "GET page again",
            "title": "Resume",
            "text": "The page was not lost. It was delayed."
          }
        ]
      },
      {
        "type": "flow",
        "title": "Where time goes",
        "blurb": "Packets move only on the highlighted hop.",
        "nodes": [
          {
            "id": "pages",
            "label": "Pages",
            "kind": "source",
            "x": 16,
            "y": 96
          },
          {
            "id": "limit",
            "label": "Limiter",
            "kind": "queue",
            "x": 166,
            "y": 96
          },
          {
            "id": "api",
            "label": "API",
            "kind": "processing",
            "x": 316,
            "y": 96
          }
        ],
        "steps": [
          {
            "title": "Count pages",
            "text": "pages = ceil(records / page_size).",
            "hot": [
              "pages"
            ]
          },
          {
            "title": "Two clocks",
            "text": "Time is the max of pages \u00d7 latency / concurrency and pages / rate.",
            "hot": [
              "pages",
              "limit"
            ]
          },
          {
            "title": "Cap",
            "text": "If the rate term wins, extra concurrency highlights the limiter, not the API.",
            "hot": [
              "limit",
              "api"
            ],
            "packets": [
              {
                "from": "limit",
                "to": "api"
              }
            ]
          }
        ]
      }
    ],
    "examples": [
      {
        "domain": "Developer tools",
        "name": "GitHub REST",
        "fact": "Checked 2026-10-28 on the official rate-limit page: unauthenticated requests are 60 per hour per IP. Authenticated personal access tokens are 5,000 per hour. Secondary limits include no more than 100 concurrent requests. Search and GraphQL have their own budgets.",
        "url": "https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api",
        "source": "GitHub Docs"
      },
      {
        "domain": "Government",
        "name": "FDIC BankFind",
        "fact": "Checked 2026-10-28 with live calls: every response included X-Ratelimit-Limit: 20. The header did not name the window. Eight quick calls succeeded, so it is not a one-per-second cap, and the window is still unpublished. Do not invent it.",
        "url": "https://api.fdic.gov/banks/docs/",
        "source": "FDIC docs plus live headers"
      },
      {
        "domain": "Government",
        "name": "NVD CVE API",
        "fact": "The developers pages are a client-rendered app. On 2026-10-28 the static HTML did not include the numeric rate limit, so this course does not quote one. A live call the same day returned startIndex, resultsPerPage, and totalResults. Read the developers page the day you build the pull.",
        "url": "https://nvd.nist.gov/developers/start-here",
        "source": "NVD, numbers not extracted"
      }
    ],
    "landing": "Land pages as they succeed. A checkpoint plus a client limiter means a multi-hour pull can stop and resume without duplicating finished pages.",
    "map": {
      "pull": 0.18,
      "realtime": 0.34
    }
  },
  {
    "id": "graphql",
    "family": "A3",
    "title": "GraphQL",
    "short": "GraphQL",
    "minutes": 14,
    "pull": 0.16,
    "realtime": 0.62,
    "summary": "GraphQL lets the client name the fields and walk connections with cursors. The provider's defense is query cost, depth, and sometimes persisted queries. Subscriptions are a push channel on top of the same schema.",
    "analogy": "Instead of taking a pre-packed shelf, you hand the librarian a shopping list. They still refuse a list that would empty the building.",
    "sections": [
      {
        "h": "Why it exists",
        "p": [
          "REST often over-fetches or forces a second call for a nested object. GraphQL returns the shape you asked for. That is good for mobile clients and dangerous for extract jobs, because one query can fan out across the database.",
          "Connections are the pagination pattern: edges, node, cursor, pageInfo.hasNextPage, endCursor. You still cannot parallelize an opaque cursor."
        ]
      },
      {
        "h": "Limits and landing",
        "p": [
          "Complexity limits, depth limits, and point budgets exist so a nested query cannot become a denial of service. Persisted queries let the server allow only known documents. Partial errors can return data and errors in the same body. Treat errors as a failed page unless you know the missing field is optional.",
          "Subscriptions are not a backfill. You still need a query or a bulk export for history, then a subscription or a delta for what happens next."
        ]
      }
    ],
    "diagrams": [
      {
        "type": "sequence",
        "title": "Connection cursor",
        "blurb": "Each arrow is one interaction. Step through it.",
        "actors": [
          "Client",
          "GraphQL"
        ],
        "steps": [
          {
            "from": 0,
            "to": 1,
            "label": "items(first: 100)",
            "title": "First page",
            "text": "Ask for a page, not the whole graph."
          },
          {
            "from": 1,
            "to": 0,
            "label": "edges, endCursor",
            "title": "Cursors",
            "text": "The cursor is opaque. Store it. Do not decode it."
          },
          {
            "from": 0,
            "to": 1,
            "label": "items(after: cursor)",
            "title": "Next page",
            "text": "Same rule as REST cursors: page N needs page N-1."
          },
          {
            "from": 1,
            "to": 0,
            "label": "hasNextPage false",
            "title": "Stop",
            "text": "Stop on the flag, not on a guessed count."
          }
        ]
      },
      {
        "type": "flow",
        "title": "Cost limit",
        "blurb": "Packets move only on the highlighted hop.",
        "nodes": [
          {
            "id": "query",
            "label": "Query",
            "kind": "ingestion",
            "x": 16,
            "y": 96
          },
          {
            "id": "cost",
            "label": "Cost check",
            "kind": "queue",
            "x": 166,
            "y": 96
          },
          {
            "id": "data",
            "label": "Resolver",
            "kind": "source",
            "x": 316,
            "y": 96
          }
        ],
        "steps": [
          {
            "title": "Score",
            "text": "The server scores fields, depth, or points before it runs the expensive work.",
            "hot": [
              "query",
              "cost"
            ],
            "packets": [
              {
                "from": "query",
                "to": "cost"
              }
            ]
          },
          {
            "title": "Reject",
            "text": "Over budget is a client error. Retrying the same query will not help.",
            "hot": [
              "cost"
            ],
            "phase": "fail"
          },
          {
            "title": "Narrow",
            "text": "Select fewer fields, a smaller page, or a persisted query the server already allows.",
            "hot": [
              "query",
              "data"
            ],
            "packets": [
              {
                "from": "query",
                "to": "data"
              }
            ],
            "phase": "fix"
          }
        ]
      }
    ],
    "examples": [
      {
        "domain": "Developer tools",
        "name": "GitHub GraphQL",
        "fact": "GitHub documents a separate primary rate limit and query limits for GraphQL, distinct from the REST 5,000/hour budget. Check that page before you estimate a pull. This course does not copy a point formula it did not re-read line by line.",
        "url": "https://docs.github.com/en/graphql/overview/rate-limits-and-query-limits-for-the-graphql-api",
        "source": "GitHub Docs"
      },
      {
        "domain": "Pattern",
        "name": "Relay connections",
        "fact": "General pattern, not a vendor limit: edges, node, cursor, pageInfo. Use it when the schema offers it. Do not invent cursors the server did not return.",
        "url": "https://graphql.org/learn/pagination/",
        "source": "GraphQL.org"
      }
    ],
    "landing": "Store the raw response, the query document hash, and the end cursor. Silver projects the nodes you asked for. If the query changes, treat it as a new stream, not a continuation.",
    "map": {
      "pull": 0.16,
      "realtime": 0.62
    }
  },
  {
    "id": "soap",
    "family": "A4",
    "title": "SOAP and legacy APIs",
    "short": "SOAP",
    "minutes": 10,
    "pull": 0.1,
    "realtime": 0.12,
    "summary": "SOAP is still how many banks, governments, and ERPs expose data. You get a WSDL contract, an XML envelope, and paging conventions that predate JSON. The extraction rules do not change.",
    "analogy": "A form with a cover sheet. The cover sheet is the envelope. The form is the body. Losing the cover sheet means the other side will not read the form.",
    "sections": [
      {
        "h": "Why it is still here",
        "p": [
          "Enterprises bought these systems when XML contracts and WS-Security were the interoperability story. Replacing them is a multi-year program. Your pipeline does not get to wait.",
          "Paging may be a page number inside the body, a continuation token, or a maximum rows element. Read the WSDL and a captured response. Do not assume limit and offset."
        ]
      },
      {
        "h": "How to extract it",
        "p": [
          "Send the envelope, parse the body, write the page, repeat. Watch SOAP faults separately from HTTP status. A HTTP 200 can still carry a fault. Namespaces will break a naive string search.",
          "Prefer the vendor's bulk or file interface if one exists. SOAP paging a million rows is the same hour-long problem as REST, with more XML."
        ]
      }
    ],
    "diagrams": [
      {
        "type": "sequence",
        "title": "Envelope in, page out",
        "blurb": "Each arrow is one interaction. Step through it.",
        "actors": [
          "Client",
          "SOAP service"
        ],
        "steps": [
          {
            "from": 0,
            "to": 1,
            "label": "SOAP envelope",
            "title": "Request",
            "text": "Action, auth header, and page token live in XML, not always in the URL."
          },
          {
            "from": 1,
            "to": 0,
            "label": "body or fault",
            "title": "Response",
            "text": "HTTP 200 plus a Fault is still a failure. Do not land it as data."
          },
          {
            "from": 0,
            "to": 1,
            "label": "next page token",
            "title": "Continue",
            "text": "The token is in the body. Checkpoint that, not the HTTP status."
          }
        ]
      }
    ],
    "examples": [
      {
        "domain": "Enterprise",
        "name": "ERP and bank cores",
        "fact": "Pattern, not a measured limit: many core systems still publish WSDL. Confirm page size in that WSDL. This course does not invent a vendor maximum.",
        "url": "https://www.w3.org/TR/soap12-part1/",
        "source": "W3C SOAP 1.2"
      }
    ],
    "landing": "Store the raw XML page and a parsed NDJSON projection. Keep the raw envelope until silver validation passes. Schema changes show up as new elements, not as a friendly JSON field.",
    "map": {
      "pull": 0.1,
      "realtime": 0.12
    }
  },
  {
    "id": "grpc",
    "family": "A5",
    "title": "gRPC",
    "short": "gRPC",
    "minutes": 12,
    "pull": 0.22,
    "realtime": 0.72,
    "summary": "gRPC is a contract in protobuf and four call shapes: unary, server streaming, client streaming, and bidirectional. Deadlines replace the vague hope that a call will finish.",
    "analogy": "A phone call with a strict time limit. Unary is one question, one answer. Server streaming is them reading a list while you listen. Bidirectional is both people talking.",
    "sections": [
      {
        "h": "Why it exists",
        "p": [
          "Internal platforms want small binary messages, generated clients, and streams that do not pretend to be web pages. Public internet APIs are still mostly JSON. You will meet gRPC at service boundaries and some vendor SDKs.",
          "A deadline is part of the request. When it passes, the call is cancelled. Retrying without a new deadline just fails faster."
        ]
      },
      {
        "h": "Extraction",
        "p": [
          "Unary pagination looks like RPC page tokens. Server streaming can deliver a snapshot or a tail of events. You still checkpoint the last id or offset the server defines. A stream is not durable storage.",
          "Load balancing, TLS, and message size limits are operational. A giant message hits the same wall as a giant JSON page."
        ]
      }
    ],
    "diagrams": [
      {
        "type": "flow",
        "title": "Server stream",
        "blurb": "Packets move only on the highlighted hop.",
        "nodes": [
          {
            "id": "client",
            "label": "Client",
            "kind": "ingestion",
            "x": 16,
            "y": 96
          },
          {
            "id": "rpc",
            "label": "gRPC",
            "kind": "source",
            "x": 166,
            "y": 96
          },
          {
            "id": "disk",
            "label": "Landing",
            "kind": "storage",
            "x": 316,
            "y": 96
          }
        ],
        "steps": [
          {
            "title": "Open",
            "text": "One RPC, many messages. Set a deadline.",
            "hot": [
              "client",
              "rpc"
            ],
            "packets": [
              {
                "from": "client",
                "to": "rpc"
              }
            ]
          },
          {
            "title": "Messages",
            "text": "Each message is a record or a batch. Write it. Do not buffer the stream in a list.",
            "hot": [
              "rpc",
              "disk"
            ],
            "packets": [
              {
                "from": "rpc",
                "to": "disk"
              }
            ]
          },
          {
            "title": "Resume",
            "text": "On disconnect, reopen with the last committed id. The stream itself forgot you.",
            "hot": [
              "client",
              "rpc"
            ],
            "packets": [
              {
                "from": "client",
                "to": "rpc"
              }
            ]
          }
        ]
      }
    ],
    "examples": [
      {
        "domain": "Platform",
        "name": "gRPC call shapes",
        "fact": "Pattern from the gRPC project: unary, server-streaming, client-streaming, bidirectional. No numeric vendor limit is claimed here.",
        "url": "https://grpc.io/docs/what-is-grpc/core-concepts/",
        "source": "grpc.io"
      }
    ],
    "landing": "Append messages to a durable log or object files with the last id. Silver starts after the checkpoint advances. A cancelled RPC is a retry, not a successful empty extract.",
    "map": {
      "pull": 0.22,
      "realtime": 0.72
    }
  },
  {
    "id": "batch-requests",
    "family": "A6",
    "title": "Batch request APIs",
    "short": "Batch calls",
    "minutes": 10,
    "pull": 0.2,
    "realtime": 0.3,
    "summary": "A batch endpoint bundles many operations into one HTTP call. It saves round trips. It does not raise the rate limit, and part of the batch can fail while the rest succeeds.",
    "analogy": "One envelope with twenty letters. The post office can reject three letters and deliver seventeen. You still have to open the envelope.",
    "sections": [
      {
        "h": "Why it exists",
        "p": [
          "Chatty APIs punish latency. A batch collapses twenty GETs into one request. Providers then throttle the inner operations, or count the batch as N calls, so you cannot smuggle a million reads through one HTTP status."
        ]
      },
      {
        "h": "Partial failure",
        "p": [
          "Inspect each item status. Retry only the failed items. Landing the whole batch because the outer call was HTTP 200 will hide missing records.",
          "Order is not a transaction unless the docs say it is. Do not assume item 8 sees the write from item 3."
        ]
      }
    ],
    "diagrams": [
      {
        "type": "sequence",
        "title": "One call, many outcomes",
        "blurb": "Each arrow is one interaction. Step through it.",
        "actors": [
          "Client",
          "Batch API"
        ],
        "steps": [
          {
            "from": 0,
            "to": 1,
            "label": "POST 20 operations",
            "title": "Bundle",
            "text": "Fewer round trips. Same business limits."
          },
          {
            "from": 1,
            "to": 0,
            "label": "200 with item errors",
            "title": "Partial",
            "text": "The envelope succeeded. Three items did not. Read the item codes."
          },
          {
            "from": 0,
            "to": 1,
            "label": "retry the 3",
            "title": "Selective retry",
            "text": "Retrying the whole batch can duplicate the 17 that worked."
          }
        ]
      }
    ],
    "examples": [
      {
        "domain": "Identity",
        "name": "JSON batching pattern",
        "fact": "General pattern: outer HTTP success does not mean every inner call succeeded. Confirm whether the vendor counts inner calls against the quota. This course does not invent that count.",
        "url": "https://learn.microsoft.com/en-us/graph/json-batching",
        "source": "Graph JSON batching overview"
      }
    ],
    "landing": "Write a result row per inner request, including status and error. Silver keeps only the successes. The retry job reads the failures, not the whole batch.",
    "map": {
      "pull": 0.2,
      "realtime": 0.3
    }
  },
  {
    "id": "query-apis",
    "family": "A7",
    "title": "Query APIs",
    "short": "Query APIs",
    "minutes": 12,
    "pull": 0.24,
    "realtime": 0.4,
    "summary": "You send a query, a search, or SQL-over-HTTP. The provider caps rows, bytes, and time. Big questions have to be sliced, or turned into an async job.",
    "analogy": "Asking a researcher one enormous question and being told the answer will not fit on a page, and they will hang up after a minute.",
    "sections": [
      {
        "h": "Why the cap exists",
        "p": [
          "A log or warehouse query can scan terabytes. The API is a front door, not the engine. Row caps, byte caps, and timeouts keep one question from owning the cluster.",
          "Search APIs add relevance windows and deep-paging bans. Offset 100000 in search is often rejected on purpose."
        ]
      },
      {
        "h": "Workaround",
        "p": [
          "Time-slice: one query per hour, or per partition key. Or submit an async query job, poll, and download the file. Do not loop offset until the server refuses.",
          "Save the query text and the slice bounds with the output. A rerun must be the same question or you cannot explain a different count."
        ]
      }
    ],
    "diagrams": [
      {
        "type": "flow",
        "title": "Slice a query that will not fit",
        "blurb": "Packets move only on the highlighted hop.",
        "nodes": [
          {
            "id": "q",
            "label": "Query",
            "kind": "ingestion",
            "x": 16,
            "y": 96
          },
          {
            "id": "slice",
            "label": "Time slice",
            "kind": "processing",
            "x": 166,
            "y": 96
          },
          {
            "id": "job",
            "label": "Async job",
            "kind": "queue",
            "x": 316,
            "y": 96
          },
          {
            "id": "file",
            "label": "Result file",
            "kind": "storage",
            "x": 466,
            "y": 96
          }
        ],
        "steps": [
          {
            "title": "Too big",
            "text": "The synchronous call hits a row cap or a timeout.",
            "hot": [
              "q"
            ],
            "phase": "fail"
          },
          {
            "title": "Slice",
            "text": "Same query, narrower time or key range.",
            "hot": [
              "q",
              "slice"
            ],
            "packets": [
              {
                "from": "q",
                "to": "slice"
              }
            ],
            "phase": "fix"
          },
          {
            "title": "Or export",
            "text": "If the API offers a job, poll and download instead of paging.",
            "hot": [
              "slice",
              "job"
            ],
            "packets": [
              {
                "from": "slice",
                "to": "job"
              }
            ]
          },
          {
            "title": "Land",
            "text": "Each slice is a file with its bounds in the name.",
            "hot": [
              "job",
              "file"
            ],
            "packets": [
              {
                "from": "job",
                "to": "file"
              }
            ]
          }
        ]
      }
    ],
    "examples": [
      {
        "domain": "Pattern",
        "name": "SQL-over-HTTP and search",
        "fact": "Pattern: row caps, byte caps, and timeouts are normal. Read the specific engine's docs before you cite a number. None is invented here.",
        "url": "https://www.elastic.co/guide/en/elasticsearch/reference/current/paginate-search-results.html",
        "source": "Search pagination pattern"
      }
    ],
    "landing": "One object per slice, plus a manifest of slices. Completeness is 'every slice succeeded', not 'the last call returned fewer than the cap' if a middle slice failed.",
    "map": {
      "pull": 0.24,
      "realtime": 0.4
    }
  },
  {
    "id": "bulk-export",
    "family": "B8",
    "title": "Async bulk export",
    "short": "Bulk export",
    "minutes": 16,
    "pull": 0.28,
    "realtime": 0.08,
    "summary": "Ask for a job, poll or wait for a callback, download compressed files, sometimes from URLs that expire. This is usually the right tool once paging would take an hour.",
    "analogy": "The library mailing you boxes instead of handing you one shelf at a time. The boxes have a pickup deadline.",
    "sections": [
      {
        "h": "Why providers offer it",
        "p": [
          "They can scan once, write files, and hand you object storage. That is cheaper for them than a thousand interactive queries, and kinder to other tenants.",
          "The file is a point-in-time snapshot. It is not a live tail. Freshness is 'as of job start', which you should store."
        ]
      },
      {
        "h": "Failure modes",
        "p": [
          "Signed URLs expire. A downloader that starts late gets 403 and must ask for fresh URLs, not invent a retry of the old URL forever.",
          "Download files in parallel only up to the documented concurrency. Poll politely. A job that is still running is not a failure.",
          "Partial files and truncated gzip are real. Check size, checksum, or a manifest before you archive the job as done."
        ]
      }
    ],
    "diagrams": [
      {
        "type": "state",
        "title": "Export job",
        "blurb": "The glowing state is where you are.",
        "states": [
          "requested",
          "running",
          "complete",
          "downloaded",
          "expired"
        ],
        "steps": [
          {
            "title": "Requested",
            "text": "You asked. You do not have data yet.",
            "state": "requested"
          },
          {
            "title": "Running",
            "text": "Poll, or wait for a callback. Do not start the download.",
            "state": "running"
          },
          {
            "title": "Complete",
            "text": "URLs are ready. Note the expiry.",
            "state": "complete"
          },
          {
            "title": "Downloaded",
            "text": "Files checked, then landed. Checkpoint the job id.",
            "state": "downloaded"
          },
          {
            "title": "Expired",
            "text": "The URL died. Ask for a new URL. Do not treat 403 as an empty file.",
            "state": "expired"
          }
        ]
      },
      {
        "type": "sequence",
        "title": "Poll, then download",
        "blurb": "Each arrow is one interaction. Step through it.",
        "actors": [
          "Client",
          "Export API",
          "Object store"
        ],
        "steps": [
          {
            "from": 0,
            "to": 1,
            "label": "POST job",
            "title": "Start",
            "text": "Filters and format go in the request. Save the job id."
          },
          {
            "from": 1,
            "to": 0,
            "label": "state=running",
            "title": "Poll",
            "text": "Running is progress. Back off the poll."
          },
          {
            "from": 1,
            "to": 0,
            "label": "URLs",
            "title": "Ready",
            "text": "URLs are capabilities with a clock on them."
          },
          {
            "from": 0,
            "to": 2,
            "label": "GET file",
            "title": "Download",
            "text": "Parallel downloads, checksum, then mark the job landed."
          }
        ]
      },
      {
        "type": "flow",
        "title": "Expired URL, then the fix",
        "blurb": "Packets move only on the highlighted hop.",
        "nodes": [
          {
            "id": "job",
            "label": "Job",
            "kind": "queue",
            "x": 16,
            "y": 96
          },
          {
            "id": "url",
            "label": "Signed URL",
            "kind": "source",
            "x": 166,
            "y": 96
          },
          {
            "id": "disk",
            "label": "Landing",
            "kind": "storage",
            "x": 316,
            "y": 96
          }
        ],
        "steps": [
          {
            "title": "URL dies",
            "text": "The download starts after expiry and gets 403. The snapshot still exists.",
            "hot": [
              "url"
            ],
            "phase": "fail"
          },
          {
            "title": "Refresh",
            "text": "Ask the job API for new URLs. Do not keep the dead one.",
            "hot": [
              "job",
              "url"
            ],
            "packets": [
              {
                "from": "job",
                "to": "url"
              }
            ],
            "phase": "fix"
          },
          {
            "title": "Land",
            "text": "Download, verify, checkpoint.",
            "hot": [
              "url",
              "disk"
            ],
            "packets": [
              {
                "from": "url",
                "to": "disk"
              }
            ],
            "phase": "fix"
          }
        ]
      }
    ],
    "examples": [
      {
        "domain": "CRM",
        "name": "Salesforce Bulk API 2.0",
        "fact": "Checked 2026-10-28: both Bulk APIs are asynchronous. Salesforce says any operation of more than 2,000 records is a good candidate for Bulk API 2.0, and jobs under 2,000 should use synchronous REST or SOAP. There is no SLA because the work is background.",
        "url": "https://developer.salesforce.com/docs/platform/api-asynch/guide/asynch-api-intro.html",
        "source": "Salesforce developers"
      },
      {
        "domain": "Security",
        "name": "Defender Vulnerability Management",
        "fact": "Checked 2026-10-28: JSON response is described as best for small organizations with less than 100-K devices. Via files is recommended for large organizations with more than 100-K devices. The payload is a current snapshot, not history. A separate delta export is a date range, not a full export.",
        "url": "https://learn.microsoft.com/en-us/defender-endpoint/api/get-assessment-software-vulnerabilities",
        "source": "Microsoft Learn"
      }
    ],
    "landing": "Land the files untouched in bronze, with job id, snapshot time, and URL expiry. Silver parses after checksum. Do not delete the source file until silver succeeds.",
    "map": {
      "pull": 0.28,
      "realtime": 0.08
    }
  },
  {
    "id": "file-drops",
    "family": "B9",
    "title": "File drops",
    "short": "File drops",
    "minutes": 14,
    "pull": 0.32,
    "realtime": 0.06,
    "summary": "A partner drops CSV, JSON lines, Parquet, or Avro on SFTP, S3, or a file share. The hard part is knowing the file is finished, and not loading a half-written one.",
    "analogy": "A courier leaving a box. If you open it while they are still packing, you inventory half the books and call it the shipment.",
    "sections": [
      {
        "h": "Why files",
        "p": [
          "Some partners have no API. A nightly file is the contract. It is simple, replayable, and awful at freshness. Agree the schedule, the name, the format, and the done signal in writing."
        ]
      },
      {
        "h": "Done markers",
        "p": [
          "Writers should write to a temporary name and rename, or write a manifest and a .done file after the bytes are flushed. Readers ignore files without the marker. A size that is still changing is not done.",
          "Quarantine files that fail schema or checksum. Do not poison the silver table. Archive only after a successful load, so a rerun can find the raw file."
        ]
      }
    ],
    "diagrams": [
      {
        "type": "state",
        "title": "File-drop states",
        "blurb": "The glowing state is where you are.",
        "states": [
          "arrived",
          "validated",
          "loaded",
          "archived",
          "quarantine"
        ],
        "steps": [
          {
            "title": "Arrived",
            "text": "Bytes exist. That is not the same as finished.",
            "state": "arrived"
          },
          {
            "title": "Validated",
            "text": "Done marker, size, and schema checked.",
            "state": "validated"
          },
          {
            "title": "Loaded",
            "text": "Idempotent load on the file id or a business key.",
            "state": "loaded"
          },
          {
            "title": "Archived",
            "text": "Raw file kept. The load record says which file produced which rows.",
            "state": "archived"
          },
          {
            "title": "Quarantine",
            "text": "Bad file parked with the error. The pipeline continues.",
            "state": "quarantine"
          }
        ]
      },
      {
        "type": "flow",
        "title": "Half-written file",
        "blurb": "Packets move only on the highlighted hop.",
        "nodes": [
          {
            "id": "tmp",
            "label": "Partial",
            "kind": "error",
            "x": 16,
            "y": 96
          },
          {
            "id": "done",
            "label": "Done marker",
            "kind": "queue",
            "x": 166,
            "y": 96
          },
          {
            "id": "loader",
            "label": "Loader",
            "kind": "processing",
            "x": 316,
            "y": 96
          },
          {
            "id": "lake",
            "label": "Lake",
            "kind": "storage",
            "x": 466,
            "y": 96
          }
        ],
        "steps": [
          {
            "title": "Too early",
            "text": "The loader sees data.csv while the writer still has it open. The row count is a lie.",
            "hot": [
              "tmp",
              "loader"
            ],
            "phase": "fail"
          },
          {
            "title": "Marker",
            "text": "The writer closes the file, then writes data.csv.done.",
            "hot": [
              "done"
            ],
            "phase": "fix"
          },
          {
            "title": "Load",
            "text": "The loader only picks files with a marker, then lands them.",
            "hot": [
              "done",
              "loader",
              "lake"
            ],
            "packets": [
              {
                "from": "done",
                "to": "loader"
              }
            ],
            "phase": "fix"
          }
        ]
      }
    ],
    "examples": [
      {
        "domain": "Partner exchange",
        "name": "SFTP and object drops",
        "fact": "Pattern: temporary name plus rename, or a manifest, is the usual done signal. Formats you will see are CSV, JSON lines, Parquet, and Avro. No vendor file-size limit is claimed.",
        "url": "https://www.rfc-editor.org/rfc/rfc4180",
        "source": "CSV is a convention; confirm the partner spec"
      }
    ],
    "landing": "Bronze is the file plus arrival metadata. Silver is parsed rows with the source file name. A rerun of the same file id must not double the facts.",
    "map": {
      "pull": 0.32,
      "realtime": 0.06
    }
  },
  {
    "id": "data-sharing",
    "family": "B10",
    "title": "Sharing without copying",
    "short": "Data sharing",
    "minutes": 10,
    "pull": 0.4,
    "realtime": 0.18,
    "summary": "Sometimes the right extract is no extract. Delta Sharing and warehouse-native shares let a consumer query the provider's tables under a grant. You still need to know freshness, schema, and what happens when the share is revoked.",
    "analogy": "A library card instead of a photocopy. You can read the shelf. You do not own the building, and the card can be taken back.",
    "sections": [
      {
        "h": "When not to copy",
        "p": [
          "Copying a 10 TB table every night is egress, time, and a stale twin. A share lets the consumer read in place, or replicate on its own schedule. Open-data portals are the public version: a dataset you query, sometimes with an API in front.",
          "You trade control. The provider can change schema, delay a refresh, or revoke access. Your gold models need a contract and a test, not a hope."
        ]
      },
      {
        "h": "Still land something",
        "p": [
          "If downstream jobs need a stable snapshot, materialize one on your side and record the share version or timestamp. A dashboard that queries a live share will change under a meeting."
        ]
      }
    ],
    "diagrams": [
      {
        "type": "flow",
        "title": "Share, then optional copy",
        "blurb": "Packets move only on the highlighted hop.",
        "nodes": [
          {
            "id": "provider",
            "label": "Provider",
            "kind": "source",
            "x": 16,
            "y": 96
          },
          {
            "id": "share",
            "label": "Share",
            "kind": "processing",
            "x": 166,
            "y": 96
          },
          {
            "id": "consumer",
            "label": "Consumer",
            "kind": "consumer",
            "x": 316,
            "y": 96
          },
          {
            "id": "snap",
            "label": "Snapshot",
            "kind": "storage",
            "x": 466,
            "y": 96
          }
        ],
        "steps": [
          {
            "title": "Grant",
            "text": "Access is a policy, not a file in your bucket yet.",
            "hot": [
              "provider",
              "share"
            ],
            "packets": [
              {
                "from": "provider",
                "to": "share"
              }
            ]
          },
          {
            "title": "Query",
            "text": "The consumer reads through the share.",
            "hot": [
              "share",
              "consumer"
            ],
            "packets": [
              {
                "from": "share",
                "to": "consumer"
              }
            ]
          },
          {
            "title": "Materialize",
            "text": "If you need a frozen input, copy a versioned snapshot.",
            "hot": [
              "consumer",
              "snap"
            ],
            "packets": [
              {
                "from": "consumer",
                "to": "snap"
              }
            ]
          }
        ]
      }
    ],
    "examples": [
      {
        "domain": "Lakehouse",
        "name": "Delta Sharing",
        "fact": "Pattern: an open protocol for sharing lakehouse tables without a custom pipeline per consumer. Confirm the current protocol and recipient model on the project site. No throughput number is claimed here.",
        "url": "https://delta.io/sharing/",
        "source": "Delta Lake"
      },
      {
        "domain": "Government",
        "name": "Open data portals",
        "fact": "Pattern: a portal plus an API. FDIC BankFind, measured in the pagination module, is one public example of API access rather than a private share.",
        "url": "https://api.fdic.gov/banks/docs/",
        "source": "FDIC"
      }
    ],
    "landing": "If you copy, land a versioned snapshot. If you do not copy, record the share version your gold model was certified against.",
    "map": {
      "pull": 0.4,
      "realtime": 0.18
    }
  },
  {
    "id": "webhooks",
    "family": "C11",
    "title": "Webhooks",
    "short": "Webhooks",
    "minutes": 16,
    "pull": 0.78,
    "realtime": 0.66,
    "summary": "A webhook is a doorbell. The sender retries, signatures prove who rang, and some rings never arrive. A webhook feed without a reconciliation pull will lose data.",
    "analogy": "A doorbell that sometimes does not ring, sometimes rings twice, and can be mimicked by a stranger unless you check the signature.",
    "sections": [
      {
        "h": "Why providers push",
        "p": [
          "They already know the row changed. Pushing is fresher than you polling every minute, and cheaper for them if you are idle. It is a hint, not a ledger.",
          "Subscriptions expire. Handshake validation proves you own the URL. Ordering is not guaranteed. Duplicates are normal because the sender retries when your endpoint times out."
        ]
      },
      {
        "h": "The reliable shape",
        "p": [
          "Verify HMAC or the vendor signature before you parse. Dedup on the event id. Ack fast, process later from a queue. Renew subscriptions before they expire.",
          "Run a reconciliation job that pulls the source of truth and fills gaps. Missed events are expected. A system that only listens will silently drift."
        ]
      }
    ],
    "diagrams": [
      {
        "type": "state",
        "title": "Subscription",
        "blurb": "The glowing state is where you are.",
        "states": [
          "pending",
          "active",
          "expiring",
          "renewed",
          "dead"
        ],
        "steps": [
          {
            "title": "Pending",
            "text": "Handshake: the provider calls you and expects a specific response.",
            "state": "pending"
          },
          {
            "title": "Active",
            "text": "Events arrive. Verify, dedup, enqueue.",
            "state": "active"
          },
          {
            "title": "Expiring",
            "text": "The subscription has a clock. Notice it before it dies.",
            "state": "expiring"
          },
          {
            "title": "Renewed",
            "text": "Renew, or the doorbell is disconnected and you will not hear a failure.",
            "state": "renewed"
          },
          {
            "title": "Dead",
            "text": "Expired or revoked. Reconciliation is the only remaining path.",
            "state": "dead"
          }
        ]
      },
      {
        "type": "sequence",
        "title": "Validate, then maybe miss one",
        "blurb": "Each arrow is one interaction. Step through it.",
        "actors": [
          "Sender",
          "Receiver",
          "Source API"
        ],
        "steps": [
          {
            "from": 0,
            "to": 1,
            "label": "POST event + signature",
            "title": "Delivery",
            "text": "Reject a bad signature before you touch the database."
          },
          {
            "from": 1,
            "to": 0,
            "label": "2xx fast",
            "title": "Ack",
            "text": "Slow work belongs on a queue. A timeout makes the sender retry."
          },
          {
            "from": 0,
            "to": 1,
            "label": "same event again",
            "title": "Duplicate",
            "text": "The event id is the dedup key."
          },
          {
            "from": 1,
            "to": 2,
            "label": "list changes since watermark",
            "title": "Reconcile",
            "text": "The pull finds the ring that never arrived."
          }
        ]
      },
      {
        "type": "flow",
        "title": "Missed webhook",
        "blurb": "Packets move only on the highlighted hop.",
        "nodes": [
          {
            "id": "src",
            "label": "Source",
            "kind": "source",
            "x": 16,
            "y": 96
          },
          {
            "id": "hook",
            "label": "Webhook",
            "kind": "error",
            "x": 166,
            "y": 96
          },
          {
            "id": "recv",
            "label": "Receiver",
            "kind": "ingestion",
            "x": 316,
            "y": 96
          },
          {
            "id": "pull",
            "label": "Reconcile",
            "kind": "processing",
            "x": 466,
            "y": 96
          }
        ],
        "steps": [
          {
            "title": "Dropped",
            "text": "The sender tried. Your side never stored the event. The row still exists at the source.",
            "hot": [
              "src",
              "hook"
            ],
            "phase": "fail"
          },
          {
            "title": "Notice",
            "text": "A completeness check compares source ids to received ids.",
            "hot": [
              "recv",
              "pull"
            ],
            "phase": "fix"
          },
          {
            "title": "Fill",
            "text": "The reconciliation pull lands the missing row. The webhook was a hint.",
            "hot": [
              "src",
              "pull"
            ],
            "packets": [
              {
                "from": "src",
                "to": "pull"
              }
            ],
            "phase": "fix"
          }
        ]
      }
    ],
    "examples": [
      {
        "domain": "Collaboration",
        "name": "Signed webhooks",
        "fact": "Pattern: HMAC over the raw body, plus a timestamp to limit replay. Confirm the exact header and base string in the vendor docs. No sample secret belongs in this repo.",
        "url": "https://docs.github.com/en/webhooks/using-webhooks/validating-webhook-deliveries",
        "source": "GitHub webhook signatures"
      },
      {
        "domain": "E-commerce",
        "name": "Order webhooks",
        "fact": "Pattern, not a store's SLA: treat each event as at-least-once, dedup on the event id, and reconcile against the orders API. Illustrative drop rates belong in the simulator, not in a contract.",
        "url": "https://en.wikipedia.org/wiki/Webhook",
        "source": "Pattern"
      }
    ],
    "landing": "Bronze is the raw body, signature result, and event id. Silver is the business object after dedup. Reconciliation writes the same silver key so a late webhook and a pull converge.",
    "map": {
      "pull": 0.78,
      "realtime": 0.66
    }
  },
  {
    "id": "delta-incremental",
    "family": "C12",
    "title": "Delta and incremental APIs",
    "short": "Deltas",
    "minutes": 14,
    "pull": 0.36,
    "realtime": 0.55,
    "summary": "After the first snapshot, ask for what changed. Watermarks, delta tokens, and change feeds exist so tomorrow's pull is not another full scan. Deletes arrive as tombstones, or they do not arrive at all.",
    "analogy": "Asking the librarian what was checked out since yesterday, instead of recounting every book.",
    "sections": [
      {
        "h": "The combination pattern",
        "p": [
          "A webhook or a schedule says 'something changed'. The delta API says what. Notification alone misses events. Delta alone can be delayed if you only poll nightly. Together they are the usual near-real-time design when a stream is not offered.",
          "Store the server's delta token or the server time at the start of a successful run. Using the max updated_at you happened to see can skip a row committed during the run."
        ]
      },
      {
        "h": "Deletes and overlap",
        "p": [
          "If the API has tombstones, apply them. If it does not, you cannot discover deletes from an updated_since filter. You need a periodic full reconcile.",
          "Overlap the window by a few minutes and dedup. Late events are cheaper than gaps."
        ]
      }
    ],
    "diagrams": [
      {
        "type": "sequence",
        "title": "Token, then changes",
        "blurb": "Each arrow is one interaction. Step through it.",
        "actors": [
          "Client",
          "Delta API"
        ],
        "steps": [
          {
            "from": 0,
            "to": 1,
            "label": "initial delta",
            "title": "Snapshot",
            "text": "The first call is the slow one. Save nextLink until it becomes a deltaLink."
          },
          {
            "from": 1,
            "to": 0,
            "label": "deltaLink",
            "title": "Checkpoint",
            "text": "The token is the watermark. Lose it and you full-scan again."
          },
          {
            "from": 0,
            "to": 1,
            "label": "GET deltaLink",
            "title": "Changes",
            "text": "Adds, updates, and tombstones. Apply them in order if the API orders them."
          },
          {
            "from": 1,
            "to": 0,
            "label": "new deltaLink",
            "title": "Advance",
            "text": "Advance the token only after the page is durable."
          }
        ]
      },
      {
        "type": "flow",
        "title": "Notification plus pull",
        "blurb": "Packets move only on the highlighted hop.",
        "nodes": [
          {
            "id": "hook",
            "label": "Notify",
            "kind": "consumer",
            "x": 16,
            "y": 96
          },
          {
            "id": "delta",
            "label": "Delta API",
            "kind": "source",
            "x": 166,
            "y": 96
          },
          {
            "id": "lake",
            "label": "Lake",
            "kind": "storage",
            "x": 316,
            "y": 96
          }
        ],
        "steps": [
          {
            "title": "Hint",
            "text": "The webhook says the collection changed. It may not include the row.",
            "hot": [
              "hook",
              "delta"
            ],
            "packets": [
              {
                "from": "hook",
                "to": "delta"
              }
            ]
          },
          {
            "title": "Pull",
            "text": "The delta call returns the actual changes since the token.",
            "hot": [
              "delta",
              "lake"
            ],
            "packets": [
              {
                "from": "delta",
                "to": "lake"
              }
            ]
          }
        ]
      }
    ],
    "examples": [
      {
        "domain": "Identity",
        "name": "Microsoft Graph delta",
        "fact": "Checked via the official overview URL on 2026-10-28: a delta query pages with @odata.nextLink and, when the round is done, returns @odata.deltaLink. Later calls to that link return changes, not the full collection. Read the page for resource-specific limits before you code one.",
        "url": "https://learn.microsoft.com/en-us/graph/delta-query-overview",
        "source": "Microsoft Learn"
      }
    ],
    "landing": "Bronze stores each delta page and the token that produced it. Silver merges on the primary key, applies tombstones, and records the token only after the merge commits.",
    "map": {
      "pull": 0.36,
      "realtime": 0.55
    }
  },
  {
    "id": "streaming",
    "family": "C13",
    "title": "Streaming platforms",
    "short": "Streams",
    "minutes": 18,
    "pull": 0.7,
    "realtime": 0.86,
    "summary": "Kafka, Event Hubs, Kinesis, and Pub/Sub are logs. Producers append. Consumers read at their own pace, in a group, from a checkpoint. Retention is how long you can replay. Lag is how far behind you are.",
    "analogy": "A conveyor belt with several lanes. If you blink, the belt does not rewind unless you kept a note of the last box you put on the shelf.",
    "sections": [
      {
        "h": "Why a log",
        "p": [
          "Many consumers need the same events, and they need to replay after a bug. A queue that deletes on read cannot do that. A log keeps events for the retention window and lets each group keep its own offset.",
          "Ordering is per partition, not global. Choose the partition key to be the entity that must stay in order, usually the account or device id, not a random value."
        ]
      },
      {
        "h": "How not to lose or double",
        "p": [
          "At-least-once is the normal contract. Commit the offset after the sink write. Commit before the write and a crash loses events. A crash after the write and before the commit replays them. Idempotent sinks make the replay safe.",
          "Lag, retention, and dead-letter queues are the operating picture. If lag exceeds retention, those events are gone. That is data loss. Alert before that.",
          "Schema registries exist so a new field does not break every consumer. Capture connectors can land the log in the lake. That is a copy, still not a business model."
        ]
      }
    ],
    "diagrams": [
      {
        "type": "state",
        "title": "Consumer",
        "blurb": "The glowing state is where you are.",
        "states": [
          "connected",
          "consuming",
          "lagging",
          "rebalancing",
          "recovered"
        ],
        "steps": [
          {
            "title": "Connected",
            "text": "The group assigned partitions. You have not read yet.",
            "state": "connected"
          },
          {
            "title": "Consuming",
            "text": "Read, write, then commit the offset.",
            "state": "consuming"
          },
          {
            "title": "Lagging",
            "text": "The producer is faster than you. Lag is visible. Retention is the cliff.",
            "state": "lagging"
          },
          {
            "title": "Rebalancing",
            "text": "A member died or joined. Partitions move. Pause writes until you know your assignment.",
            "state": "rebalancing"
          },
          {
            "title": "Recovered",
            "text": "Resume from the committed offset, not from the start, and not from the tip, unless you chose that.",
            "state": "recovered"
          }
        ]
      },
      {
        "type": "sequence",
        "title": "Commit after the write",
        "blurb": "Each arrow is one interaction. Step through it.",
        "actors": [
          "Consumer",
          "Log",
          "Lake"
        ],
        "steps": [
          {
            "from": 1,
            "to": 0,
            "label": "records",
            "title": "Read",
            "text": "The log still has them. Reading is not consuming them away."
          },
          {
            "from": 0,
            "to": 2,
            "label": "upsert",
            "title": "Sink",
            "text": "Idempotent write on the event key."
          },
          {
            "from": 0,
            "to": 1,
            "label": "commit offset",
            "title": "Checkpoint",
            "text": "Only now may a crash skip ahead. Before this, a crash replays."
          }
        ]
      },
      {
        "type": "flow",
        "title": "Crash before checkpoint",
        "blurb": "Packets move only on the highlighted hop.",
        "nodes": [
          {
            "id": "log",
            "label": "Log",
            "kind": "source",
            "x": 16,
            "y": 96
          },
          {
            "id": "app",
            "label": "Consumer",
            "kind": "ingestion",
            "x": 166,
            "y": 96
          },
          {
            "id": "off",
            "label": "Offset",
            "kind": "queue",
            "x": 316,
            "y": 96
          },
          {
            "id": "lake",
            "label": "Lake",
            "kind": "storage",
            "x": 466,
            "y": 96
          }
        ],
        "steps": [
          {
            "title": "Wrote, did not commit",
            "text": "The row is in the lake. The offset is old. A restart will write the row again.",
            "hot": [
              "app",
              "lake"
            ],
            "phase": "fail"
          },
          {
            "title": "Idempotent sink",
            "text": "The second write matches the same key and updated_at. The table does not double.",
            "hot": [
              "lake"
            ],
            "phase": "fix"
          },
          {
            "title": "Then commit",
            "text": "Offset moves. Replay window closes.",
            "hot": [
              "app",
              "off"
            ],
            "packets": [
              {
                "from": "app",
                "to": "off"
              }
            ],
            "phase": "fix"
          }
        ]
      }
    ],
    "examples": [
      {
        "domain": "Platform",
        "name": "Kafka and relatives",
        "fact": "Pattern: topics, partitions, consumer groups, offsets, retention, replay. Kafka, Event Hubs, Kinesis, and Pub/Sub rhyme. Their exact retention defaults and throughput units differ. Read the current service page before you cite a number. None is invented here.",
        "url": "https://kafka.apache.org/documentation/",
        "source": "Apache Kafka"
      },
      {
        "domain": "Security and markets",
        "name": "Vendor streams into a bus",
        "fact": "Pattern: a product streams events to Event Hubs, Pub/Sub, or storage. You consume the bus. You do not page the product's REST API for every event. Confirm the vendor's retention and schema in their docs.",
        "url": "https://learn.microsoft.com/en-us/azure/event-hubs/event-hubs-about",
        "source": "Event Hubs overview"
      }
    ],
    "landing": "Bronze can be the captured log. Silver is deduped events. Gold is aggregates. Keep the consumer group offset outside the gold table so a rebuild can replay.",
    "map": {
      "pull": 0.7,
      "realtime": 0.86
    }
  },
  {
    "id": "realtime-protocols",
    "family": "C14",
    "title": "WebSockets, SSE, long polling, MQTT",
    "short": "Live sockets",
    "minutes": 12,
    "pull": 0.82,
    "realtime": 0.92,
    "summary": "Some sources keep a connection open. WebSockets and MQTT are bidirectional. Server-Sent Events are a one-way stream. Long polling is a loop of requests that wait. None of them is a database.",
    "analogy": "Holding the phone instead of sending letters. If the call drops, you need a sentence number to know what you missed.",
    "sections": [
      {
        "h": "Why a live connection",
        "p": [
          "IoT devices and trading screens cannot wait for a nightly file. A socket is low latency. It is also fragile: proxies time out, laptops sleep, and brokers restart.",
          "Heartbeats tell you the connection is alive. A resume token or a last message id tells you what to replay. Without that, a reconnect is a hole."
        ]
      },
      {
        "h": "Landing",
        "p": [
          "Write events as they arrive, with the resume token. On disconnect, buffer is gone unless you persisted it. Backfill from a REST or file API for the gap, then resume the socket.",
          "MQTT topics and QoS levels change the duplicate story. QoS 1 can duplicate. Design the sink as idempotent anyway."
        ]
      }
    ],
    "diagrams": [
      {
        "type": "flow",
        "title": "Disconnect and resume",
        "blurb": "Packets move only on the highlighted hop.",
        "nodes": [
          {
            "id": "dev",
            "label": "Device",
            "kind": "source",
            "x": 16,
            "y": 96
          },
          {
            "id": "sock",
            "label": "Socket",
            "kind": "ingestion",
            "x": 166,
            "y": 96
          },
          {
            "id": "disk",
            "label": "Log",
            "kind": "storage",
            "x": 316,
            "y": 96
          }
        ],
        "steps": [
          {
            "title": "Live",
            "text": "Events flow. Persist the resume token with each batch.",
            "hot": [
              "dev",
              "sock"
            ],
            "packets": [
              {
                "from": "dev",
                "to": "sock"
              }
            ]
          },
          {
            "title": "Drop",
            "text": "The socket dies. Events during the gap are not in your process memory.",
            "hot": [
              "sock"
            ],
            "phase": "fail"
          },
          {
            "title": "Resume",
            "text": "Reconnect with the token, and backfill from the API if the token cannot cover the gap.",
            "hot": [
              "dev",
              "disk"
            ],
            "packets": [
              {
                "from": "dev",
                "to": "disk"
              }
            ],
            "phase": "fix"
          }
        ]
      }
    ],
    "examples": [
      {
        "domain": "IoT",
        "name": "MQTT",
        "fact": "Pattern: pub/sub for devices, with QoS and sessions. Confirm the broker's session expiry. No device-rate number is claimed.",
        "url": "https://mqtt.org/",
        "source": "MQTT.org"
      },
      {
        "domain": "Web",
        "name": "SSE and WebSockets",
        "fact": "Pattern: SSE is server to client over HTTP. WebSockets are bidirectional. Both need heartbeats and a resume story. Long polling is the fallback when a socket is blocked.",
        "url": "https://html.spec.whatwg.org/multipage/server-sent-events.html",
        "source": "WHATWG SSE"
      }
    ],
    "landing": "Append-only event files with the resume token in the manifest. Do not treat an open socket as proof of completeness.",
    "map": {
      "pull": 0.82,
      "realtime": 0.92
    }
  },
  {
    "id": "database-extract",
    "family": "D15",
    "title": "Direct database extraction",
    "short": "Database reads",
    "minutes": 14,
    "pull": 0.14,
    "realtime": 0.22,
    "summary": "JDBC or ODBC can read a table or a query. It is fast and dangerous. You share the source database with the application that keeps the business running.",
    "analogy": "Counting books by walking into the stacks while people are still shelving. You can block them, or they can move a book between your two hands.",
    "sections": [
      {
        "h": "Why teams do it",
        "p": [
          "There is no API, or the API is a toy in front of a real table. A SQL query is the shortest path. It is also the path that can lock rows, fill temp space, and show up in the on-call channel."
        ]
      },
      {
        "h": "How to be a polite reader",
        "p": [
          "Use a read replica when you can. Incremental queries on an indexed updated_at or an increasing key beat SELECT *. Parallel range reads split the key space, the same idea as partitioned keyset, and they still hit one database.",
          "Snapshot isolation or a consistent read matters if you need a point in time. A query that runs for an hour on a live table is not one moment.",
          "Never extract through the primary at peak if a replica exists. Agree a query budget with the source team."
        ]
      }
    ],
    "diagrams": [
      {
        "type": "flow",
        "title": "Replica, range, land",
        "blurb": "Packets move only on the highlighted hop.",
        "nodes": [
          {
            "id": "app",
            "label": "Primary",
            "kind": "source",
            "x": 16,
            "y": 96
          },
          {
            "id": "rep",
            "label": "Replica",
            "kind": "source",
            "x": 166,
            "y": 96
          },
          {
            "id": "job",
            "label": "Extractor",
            "kind": "ingestion",
            "x": 316,
            "y": 96
          },
          {
            "id": "lake",
            "label": "Lake",
            "kind": "storage",
            "x": 466,
            "y": 96
          }
        ],
        "steps": [
          {
            "title": "Do not hit primary",
            "text": "The application owns the primary. Read the replica.",
            "hot": [
              "app",
              "rep"
            ]
          },
          {
            "title": "Ranges",
            "text": "Split on an indexed key. Each worker seeks, it does not offset.",
            "hot": [
              "rep",
              "job"
            ],
            "packets": [
              {
                "from": "rep",
                "to": "job"
              }
            ]
          },
          {
            "title": "Land",
            "text": "Stream rows. A fetch size is a page. Do not fetchall() a billion rows.",
            "hot": [
              "job",
              "lake"
            ],
            "packets": [
              {
                "from": "job",
                "to": "lake"
              }
            ]
          }
        ]
      }
    ],
    "examples": [
      {
        "domain": "Enterprise",
        "name": "JDBC and ODBC",
        "fact": "Pattern: full and incremental queries, read replicas, range reads. Locking and source impact are the reason managed CDC exists. No row-rate number is claimed.",
        "url": "https://docs.oracle.com/javase/tutorial/jdbc/basics/index.html",
        "source": "JDBC basics"
      }
    ],
    "landing": "Bronze is the query text, the replica timestamp, and the files. Silver merges on the primary key. A full refresh is allowed when the table is small and deletes must be exact.",
    "map": {
      "pull": 0.14,
      "realtime": 0.22
    }
  },
  {
    "id": "cdc",
    "family": "D16",
    "title": "Change data capture",
    "short": "CDC",
    "minutes": 16,
    "pull": 0.48,
    "realtime": 0.74,
    "summary": "Log-based CDC reads the database's own change log. You get inserts, updates, and deletes in commit order, after an initial snapshot. You are not polling the table.",
    "analogy": "Reading the library's checkout log instead of recounting the shelves every hour.",
    "sections": [
      {
        "h": "Why the log",
        "p": [
          "The database already writes a durable history of changes so it can recover. CDC readers tail that history. They see deletes. A query on updated_at often does not.",
          "The outbox pattern is the application writing events into a table in the same transaction as the business change, then a publisher reading that table. Use it when you own the application and the log format is not a contract you want to leak."
        ]
      },
      {
        "h": "Snapshot, then stream",
        "p": [
          "The first run copies the current table. Then the reader switches to the log position taken at the snapshot. Miss that handoff and you gap or overlap. Overlap is fine if the sink is idempotent. A gap is not.",
          "Schema changes are events. A new column should not crash the pipeline. Quarantine unknown shapes, do not drop the slot, or the database may be forced to keep logs until the disk fills."
        ]
      }
    ],
    "diagrams": [
      {
        "type": "state",
        "title": "CDC",
        "blurb": "The glowing state is where you are.",
        "states": [
          "snapshot",
          "streaming",
          "schema",
          "resumed"
        ],
        "steps": [
          {
            "title": "Snapshot",
            "text": "Copy the table. Record the log position.",
            "state": "snapshot"
          },
          {
            "title": "Streaming",
            "text": "Apply log events after that position, in order, per transaction.",
            "state": "streaming"
          },
          {
            "title": "Schema change",
            "text": "A new column arrives. Evolve the landing schema or quarantine. Do not abandon the slot.",
            "state": "schema"
          },
          {
            "title": "Resumed",
            "text": "Restart from the stored log position, not from a new snapshot, unless the position expired.",
            "state": "resumed"
          }
        ]
      },
      {
        "type": "sequence",
        "title": "Read the log, commit the position",
        "blurb": "Each arrow is one interaction. Step through it.",
        "actors": [
          "CDC reader",
          "DB log",
          "Lake"
        ],
        "steps": [
          {
            "from": 1,
            "to": 0,
            "label": "change event",
            "title": "Read",
            "text": "The log is the source of truth for what changed."
          },
          {
            "from": 0,
            "to": 2,
            "label": "merge",
            "title": "Apply",
            "text": "Upsert or delete in the lake, idempotent on primary key plus LSN."
          },
          {
            "from": 0,
            "to": 1,
            "label": "store LSN",
            "title": "Checkpoint",
            "text": "Advance the position after the apply. Same rule as a stream offset."
          }
        ]
      }
    ],
    "examples": [
      {
        "domain": "Databases",
        "name": "Debezium and engine CDC",
        "fact": "Pattern: Debezium, SQL Server CDC, and Postgres logical replication are log readers plus a snapshot. Confirm slot retention and snapshot locking on the current connector page. No latency SLA is claimed.",
        "url": "https://debezium.io/documentation/reference/stable/connectors/postgresql.html",
        "source": "Debezium Postgres connector"
      }
    ],
    "landing": "Bronze can store the change events with LSN. Silver is the current row plus a history table if you need it. Gold does not read the log directly.",
    "map": {
      "pull": 0.48,
      "realtime": 0.74
    }
  },
  {
    "id": "managed-connectors",
    "family": "D17",
    "title": "Managed connectors",
    "short": "Buy vs build",
    "minutes": 12,
    "pull": 0.5,
    "realtime": 0.42,
    "summary": "Airbyte, Fivetran, Azure Data Factory, Databricks Lakeflow Connect, and their relatives already built the pagination, CDC, and retries. Buy them when the source is common and your edge is the model, not the socket.",
    "analogy": "Hiring a courier instead of building a truck. You still have to say where the boxes go, and you still check that nothing was left on the dock.",
    "sections": [
      {
        "h": "When to buy",
        "p": [
          "The source is Salesforce, a database, or another system with a maintained connector. Your team is small. The connector's latency and cost fit. You still own schema tests, credentials, and the reconciliation count.",
          "Build when the source is odd, the connector hides a limit you cannot accept, or the data cannot leave a network the vendor's cloud cannot see."
        ]
      },
      {
        "h": "What you still do",
        "p": [
          "Compare control, cost, and latency in a table for the actual source, not from a slogan. A managed CDC product can be minutes. A nightly file connector is a day. Read the current product page.",
          "Do not point a managed connector at production credentials with write scope. Least privilege still applies."
        ]
      }
    ],
    "diagrams": [
      {
        "type": "flow",
        "title": "Buy the pipe, own the check",
        "blurb": "Packets move only on the highlighted hop.",
        "nodes": [
          {
            "id": "src",
            "label": "Source",
            "kind": "source",
            "x": 16,
            "y": 96
          },
          {
            "id": "conn",
            "label": "Connector",
            "kind": "ingestion",
            "x": 166,
            "y": 96
          },
          {
            "id": "lake",
            "label": "Lake",
            "kind": "storage",
            "x": 316,
            "y": 96
          },
          {
            "id": "you",
            "label": "Your tests",
            "kind": "processing",
            "x": 466,
            "y": 96
          }
        ],
        "steps": [
          {
            "title": "Sync",
            "text": "The product pages, tails a log, or copies a file.",
            "hot": [
              "src",
              "conn"
            ],
            "packets": [
              {
                "from": "src",
                "to": "conn"
              }
            ]
          },
          {
            "title": "Land",
            "text": "Rows arrive in your lake under their schema.",
            "hot": [
              "conn",
              "lake"
            ],
            "packets": [
              {
                "from": "conn",
                "to": "lake"
              }
            ]
          },
          {
            "title": "Verify",
            "text": "You still compare counts and keys. A green connector check is not your business rule.",
            "hot": [
              "lake",
              "you"
            ],
            "packets": [
              {
                "from": "lake",
                "to": "you"
              }
            ]
          }
        ]
      }
    ],
    "examples": [
      {
        "domain": "Integration",
        "name": "Hosted and platform connectors",
        "fact": "Names checked as product categories, not as a feature matrix: Fivetran, Airbyte, Azure Data Factory, Databricks Lakeflow Connect. Capabilities and prices change. Compare the current docs for the source you have. No price is quoted here.",
        "url": "https://docs.airbyte.com/",
        "source": "Airbyte docs"
      }
    ],
    "landing": "Land where the product writes, then run your own silver tests. Keep a source-of-record count outside the connector's success flag.",
    "map": {
      "pull": 0.5,
      "realtime": 0.42
    }
  },
  {
    "id": "scraping",
    "family": "E18",
    "title": "Scraping, last",
    "short": "Scraping",
    "minutes": 12,
    "pull": 0.08,
    "realtime": 0.1,
    "summary": "Scraping reads HTML because there is no API. It breaks when the page changes, and it can be illegal or forbidden even when it is technically easy. Prefer an official feed. Use demo sites if you practice.",
    "analogy": "Copying a shop window because they would not give you a catalog. The window changes, and the shop may have a rule against it.",
    "sections": [
      {
        "h": "Rules, before code",
        "p": [
          "Read the terms of service, robots.txt, and copyright. Personal data on a page is still personal data. Rate courtesy is not a legal defense, but hammering a site is how you get blocked and how you cause harm.",
          "If an API, a file, or a data portal exists, use it. Scraping is the last resort for public pages you are allowed to read, not a clever way around a login."
        ]
      },
      {
        "h": "If you still must",
        "p": [
          "Static HTML can be parsed. JavaScript-rendered pages need a browser, which is slower and more fragile. Anti-bot systems will beat a casual script. Do not teach bypasses here, and do not build them.",
          "Store the raw HTML and the URL and the time. Expect the selectors to break. Alert on a sudden drop to zero rows."
        ]
      }
    ],
    "diagrams": [
      {
        "type": "flow",
        "title": "Prefer the official door",
        "blurb": "Packets move only on the highlighted hop.",
        "nodes": [
          {
            "id": "page",
            "label": "HTML page",
            "kind": "error",
            "x": 16,
            "y": 96
          },
          {
            "id": "api",
            "label": "Official API",
            "kind": "source",
            "x": 166,
            "y": 96
          },
          {
            "id": "lake",
            "label": "Lake",
            "kind": "storage",
            "x": 316,
            "y": 96
          }
        ],
        "steps": [
          {
            "title": "Fragile",
            "text": "A selector extract dies when a div is renamed. You also may not be allowed to do it.",
            "hot": [
              "page"
            ],
            "phase": "fail"
          },
          {
            "title": "Official",
            "text": "An API or file feed is the supported contract.",
            "hot": [
              "api",
              "lake"
            ],
            "packets": [
              {
                "from": "api",
                "to": "lake"
              }
            ],
            "phase": "fix"
          }
        ]
      }
    ],
    "examples": [
      {
        "domain": "Practice only",
        "name": "Sites built for scraping practice",
        "fact": "Use sites that invite practice, such as books.toscrape.com, and stay inside their terms. This course does not include bypass techniques.",
        "url": "https://books.toscrape.com/",
        "source": "Practice site"
      }
    ],
    "landing": "If a scrape is allowed, bronze is raw HTML. Silver is parsed fields with the selector version. A zero-row run is an incident, not an empty day.",
    "map": {
      "pull": 0.08,
      "realtime": 0.1
    }
  },
  {
    "id": "email-reports",
    "family": "E19",
    "title": "Email, reports, and spreadsheets",
    "short": "Reports",
    "minutes": 8,
    "pull": 0.55,
    "realtime": 0.05,
    "summary": "A scheduled CSV in an inbox or a spreadsheet on a share is an API with no contract. It works until someone renames a column or the mail rule moves the file.",
    "analogy": "A colleague sliding a printout under your door. Helpful, and not a system.",
    "sections": [
      {
        "h": "Why it happens",
        "p": [
          "The source system can email a report and cannot expose a table. Teams accept it to move. The extract then depends on a mailbox, a subject line, and a human who owns the report definition."
        ]
      },
      {
        "h": "How it breaks",
        "p": [
          "Columns move. Dates change format. A totals row is parsed as data. The attachment is missing on a holiday. There is no tombstone and no event id.",
          "Replace it. Ask for a file drop with a schema, or an API. Until then, validate the header row and quarantine surprises. Do not silently shift columns."
        ]
      }
    ],
    "diagrams": [
      {
        "type": "flow",
        "title": "A report is not a feed",
        "blurb": "Packets move only on the highlighted hop.",
        "nodes": [
          {
            "id": "mail",
            "label": "Inbox",
            "kind": "queue",
            "x": 16,
            "y": 96
          },
          {
            "id": "parse",
            "label": "Parser",
            "kind": "processing",
            "x": 166,
            "y": 96
          },
          {
            "id": "q",
            "label": "Quarantine",
            "kind": "error",
            "x": 316,
            "y": 96
          },
          {
            "id": "lake",
            "label": "Lake",
            "kind": "storage",
            "x": 466,
            "y": 96
          }
        ],
        "steps": [
          {
            "title": "Header changed",
            "text": "The parser maps column 3 to amount and writes nonsense.",
            "hot": [
              "mail",
              "parse"
            ],
            "phase": "fail"
          },
          {
            "title": "Check the header",
            "text": "Expected names, or quarantine. Never guess a shifted column.",
            "hot": [
              "parse",
              "q"
            ],
            "phase": "fix"
          },
          {
            "title": "Land only matches",
            "text": "A known header can load. Record the message id so a redelivery does not double.",
            "hot": [
              "parse",
              "lake"
            ],
            "packets": [
              {
                "from": "parse",
                "to": "lake"
              }
            ],
            "phase": "fix"
          }
        ]
      }
    ],
    "examples": [
      {
        "domain": "Operations",
        "name": "Scheduled report exports",
        "fact": "Pattern: no stable schema, no deletes, no replay contract. Treat as temporary. No vendor mailbox limit is claimed.",
        "url": "https://datatracker.ietf.org/doc/html/rfc5322",
        "source": "Email is a message format, not a data contract"
      }
    ],
    "landing": "Store the raw attachment and the message id. Silver loads only if the header matches the contract hash.",
    "map": {
      "pull": 0.55,
      "realtime": 0.05
    }
  },
  {
    "id": "delivery-guarantees",
    "title": "Delivery guarantees",
    "short": "Guarantees",
    "minutes": 12,
    "summary": "At-most-once drops data on a crash. At-least-once retries and can duplicate. Exactly-once, in practice, is at-least-once plus an idempotent write.",
    "analogy": "A courier who throws the parcel away if they are unsure, versus one who might deliver twice, versus a shelf that ignores the second identical parcel.",
    "sections": [
      {
        "h": "The three words",
        "p": [
          "At-most-once: send or commit before you know the write landed. A crash loses the record and nobody retries.",
          "At-least-once: retry until the receiver acks. A crash after the write and before the ack duplicates.",
          "Exactly-once is usually a marketing sentence for 'the sink dedups'. End-to-end exactly-once across a database, a bus, and a lake is rare. Design for at-least-once and make the write idempotent."
        ]
      }
    ],
    "diagrams": [
      {
        "type": "flow",
        "title": "Same event, twice, one row",
        "blurb": "Packets move only on the highlighted hop.",
        "nodes": [
          {
            "id": "bus",
            "label": "Bus",
            "kind": "source",
            "x": 16,
            "y": 96
          },
          {
            "id": "sink",
            "label": "Sink",
            "kind": "processing",
            "x": 166,
            "y": 96
          },
          {
            "id": "row",
            "label": "Row",
            "kind": "storage",
            "x": 316,
            "y": 96
          }
        ],
        "steps": [
          {
            "title": "First write",
            "text": "The event lands. The ack is lost.",
            "hot": [
              "bus",
              "sink"
            ],
            "packets": [
              {
                "from": "bus",
                "to": "sink"
              }
            ]
          },
          {
            "title": "Replay",
            "text": "The same key arrives again.",
            "hot": [
              "bus",
              "sink"
            ],
            "packets": [
              {
                "from": "bus",
                "to": "sink"
              }
            ],
            "phase": "fail"
          },
          {
            "title": "Dedup",
            "text": "Primary key plus version. The second write is a no-op or a newer version, not a second fact.",
            "hot": [
              "sink",
              "row"
            ],
            "packets": [
              {
                "from": "sink",
                "to": "row"
              }
            ],
            "phase": "fix"
          }
        ]
      }
    ],
    "examples": [],
    "landing": "The sink key is the delivery guarantee. Without it, retries are data corruption."
  },
  {
    "id": "idempotency",
    "title": "Idempotency, checkpoints, replay",
    "short": "Idempotency",
    "minutes": 14,
    "summary": "A write is idempotent when doing it twice leaves the same rows. Checkpoints say where to resume. Replay is how you fix a bug without asking the source to remember you.",
    "analogy": "A rubber stamp that says 'this invoice number already exists' instead of printing a second invoice.",
    "sections": [
      {
        "h": "Keys",
        "p": [
          "Dedup on a stable id. If two versions exist, keep the newer updated_at or the higher log position. A random UUID per retry is not a key. It manufactures duplicates.",
          "Watermarks are for incremental pulls. Checkpoints are for the cursor, offset, file, or log position inside a run. Reconciliation compares the source count to the landed unique keys."
        ]
      },
      {
        "h": "Backfills",
        "p": [
          "A backfill is a deliberate replay of a range. Isolate it so it does not move the live watermark backward. Write to the same keys so the live stream and the backfill converge."
        ]
      }
    ],
    "diagrams": [
      {
        "type": "sequence",
        "title": "Write, then checkpoint",
        "blurb": "Each arrow is one interaction. Step through it.",
        "actors": [
          "Worker",
          "Disk",
          "State"
        ],
        "steps": [
          {
            "from": 0,
            "to": 1,
            "label": "page file",
            "title": "Durable page",
            "text": "The data hits disk first."
          },
          {
            "from": 0,
            "to": 2,
            "label": "cursor",
            "title": "Checkpoint",
            "text": "Now a kill can resume. The reverse order can skip a page."
          },
          {
            "from": 2,
            "to": 0,
            "label": "resume cursor",
            "title": "Replay",
            "text": "The next process starts at the cursor, not at zero."
          }
        ]
      }
    ],
    "examples": [],
    "landing": "State store holds the cursor. The lake holds the rows. They advance together, data first."
  },
  {
    "id": "snapshot-merge",
    "title": "Snapshot, incremental, history",
    "short": "Merge",
    "minutes": 12,
    "summary": "A snapshot is the world at one time. An incremental feed is what changed. An event history is every fact. Merging them is a full refresh, an upsert, or a slowly changing dimension, plus a plan for deletes.",
    "analogy": "A photograph, a list of edits, and a diary. You cannot reconstruct the diary from the photograph.",
    "sections": [
      {
        "h": "Choose the grain",
        "p": [
          "Full refresh replaces the table. It is correct for small dimensions and painful for billions of rows. Upsert or MERGE applies changes and needs tombstones for deletes.",
          "Slowly changing dimensions keep history on purpose. That is a modeling choice, not something CDC gives you for free. Store the effective time."
        ]
      }
    ],
    "diagrams": [
      {
        "type": "flow",
        "title": "Merge a change onto a snapshot",
        "blurb": "Packets move only on the highlighted hop.",
        "nodes": [
          {
            "id": "snap",
            "label": "Snapshot",
            "kind": "storage",
            "x": 16,
            "y": 96
          },
          {
            "id": "chg",
            "label": "Changes",
            "kind": "source",
            "x": 166,
            "y": 96
          },
          {
            "id": "merge",
            "label": "MERGE",
            "kind": "processing",
            "x": 316,
            "y": 96
          },
          {
            "id": "cur",
            "label": "Current",
            "kind": "storage",
            "x": 466,
            "y": 96
          }
        ],
        "steps": [
          {
            "title": "Base",
            "text": "The snapshot is the starting picture.",
            "hot": [
              "snap",
              "merge"
            ]
          },
          {
            "title": "Apply",
            "text": "Updates replace. Tombstones delete. Inserts add.",
            "hot": [
              "chg",
              "merge"
            ],
            "packets": [
              {
                "from": "chg",
                "to": "merge"
              }
            ]
          },
          {
            "title": "Current",
            "text": "The serving table is the merge, not the raw feed.",
            "hot": [
              "merge",
              "cur"
            ],
            "packets": [
              {
                "from": "merge",
                "to": "cur"
              }
            ]
          }
        ]
      }
    ],
    "examples": [],
    "landing": "Keep snapshot and changes in bronze. Silver is the merge. Do not throw away bronze after the first success. You will rerun it."
  },
  {
    "id": "backpressure",
    "title": "Memory and backpressure",
    "short": "Backpressure",
    "minutes": 10,
    "summary": "If the producer is faster than the sink, something has to slow down, buffer, or drop. Dropping is data loss. An unbounded list is a future crash.",
    "analogy": "A funnel. If you keep pouring and the neck is narrow, the counter floods. A good funnel tells the tap to wait.",
    "sections": [
      {
        "h": "What to do",
        "p": [
          "Stream pages and files. Bound every queue. When the queue is full, stop reading. That is backpressure. It shows up as consumer lag or a paused HTTP client, which is healthier than an out-of-memory kill.",
          "Chunk large files. Never fetchall(). A million small Python dicts is a memory tax you do not need."
        ]
      }
    ],
    "diagrams": [
      {
        "type": "flow",
        "title": "Bounded queue",
        "blurb": "Packets move only on the highlighted hop.",
        "nodes": [
          {
            "id": "src",
            "label": "Source",
            "kind": "source",
            "x": 16,
            "y": 96
          },
          {
            "id": "q",
            "label": "Bounded queue",
            "kind": "queue",
            "x": 166,
            "y": 96
          },
          {
            "id": "sink",
            "label": "Sink",
            "kind": "storage",
            "x": 316,
            "y": 96
          }
        ],
        "steps": [
          {
            "title": "Fast source",
            "text": "Events arrive faster than the sink writes.",
            "hot": [
              "src",
              "q"
            ],
            "packets": [
              {
                "from": "src",
                "to": "q"
              }
            ]
          },
          {
            "title": "Full",
            "text": "The queue refuses more. The reader pauses. Nothing is dropped.",
            "hot": [
              "q"
            ],
            "phase": "fix"
          },
          {
            "title": "Drain",
            "text": "The sink catches up. Reading resumes.",
            "hot": [
              "q",
              "sink"
            ],
            "packets": [
              {
                "from": "q",
                "to": "sink"
              }
            ]
          }
        ]
      }
    ],
    "examples": [],
    "landing": "Spill a full queue to disk if you must buffer a burst. An in-memory backlog is not a design."
  },
  {
    "id": "performance",
    "title": "Performance techniques",
    "short": "Performance",
    "minutes": 12,
    "summary": "Make each request cheaper before you add threads. Page size, fields, compression, and connection reuse come first. Concurrency is last, and only under the rate limit.",
    "analogy": "Packing the box fuller, and reusing the same truck, before you hire a fleet that the loading dock will turn away.",
    "sections": [
      {
        "h": "Order of operations",
        "p": [
          "Raise the page size to the documented maximum. Drop fields you do not land. Accept gzip. Reuse connections. HTTP/2 multiplexes when the server supports it.",
          "Async I/O helps when you are waiting on the network. Threads help for the same reason, with more overhead. Processes help when you are CPU-bound on parse. None of them help when the rate limit is the ceiling.",
          "Partitioned parallelism is the safe fan-out: independent key or time ranges, a shared limiter, a shared sink that dedups."
        ]
      }
    ],
    "diagrams": [
      {
        "type": "flow",
        "title": "Cheap calls, then parallel ranges",
        "blurb": "Packets move only on the highlighted hop.",
        "nodes": [
          {
            "id": "page",
            "label": "Bigger page",
            "kind": "source",
            "x": 16,
            "y": 96
          },
          {
            "id": "pool",
            "label": "Pool",
            "kind": "ingestion",
            "x": 166,
            "y": 96
          },
          {
            "id": "cap",
            "label": "Limiter",
            "kind": "queue",
            "x": 316,
            "y": 96
          },
          {
            "id": "lake",
            "label": "Lake",
            "kind": "storage",
            "x": 466,
            "y": 96
          }
        ],
        "steps": [
          {
            "title": "Fewer calls",
            "text": "A larger page and fewer fields cut the request count.",
            "hot": [
              "page"
            ]
          },
          {
            "title": "Reuse",
            "text": "A connection pool avoids a new handshake per page.",
            "hot": [
              "page",
              "pool"
            ],
            "packets": [
              {
                "from": "page",
                "to": "pool"
              }
            ]
          },
          {
            "title": "Cap",
            "text": "Parallel ranges share one limiter.",
            "hot": [
              "pool",
              "cap",
              "lake"
            ],
            "packets": [
              {
                "from": "pool",
                "to": "cap"
              }
            ]
          }
        ]
      }
    ],
    "examples": [],
    "landing": "Measure one page before you multiply. diagnose the latency, the page size, and the limit. Then estimate."
  },
  {
    "id": "resilience",
    "title": "Timeouts, retries, circuit breakers",
    "short": "Resilience",
    "minutes": 14,
    "summary": "Timeouts bound a wait. Retries cover a blip. A circuit breaker stops you from retrying a source that is down. A bulkhead stops one source from eating every thread.",
    "analogy": "Knocking again if nobody heard you. If the building is on fire, stop knocking and try later. Do not send the whole company to knock.",
    "sections": [
      {
        "h": "Rules",
        "p": [
          "Every call has a timeout. Retry 429, 500, 502, 503, 504, timeouts, and connection resets. Honor Retry-After. Otherwise exponential backoff with jitter. Do not retry 400 or 401.",
          "A circuit opens after repeated failures and fails fast. Half-open lets one trial through. Closed is healthy. Dead-letter the events you cannot apply, with the error, so a human can replay them."
        ]
      }
    ],
    "diagrams": [
      {
        "type": "state",
        "title": "Circuit breaker",
        "blurb": "The glowing state is where you are.",
        "states": [
          "closed",
          "open",
          "half-open"
        ],
        "steps": [
          {
            "title": "Closed",
            "text": "Calls go through. Failures are counted.",
            "state": "closed"
          },
          {
            "title": "Open",
            "text": "Too many failures. Calls fail fast. The source gets a rest.",
            "state": "open"
          },
          {
            "title": "Half-open",
            "text": "One trial. Success closes. Failure opens again.",
            "state": "half-open"
          }
        ]
      },
      {
        "type": "sequence",
        "title": "Retry only what can succeed later",
        "blurb": "Each arrow is one interaction. Step through it.",
        "actors": [
          "Client",
          "API"
        ],
        "steps": [
          {
            "from": 0,
            "to": 1,
            "label": "GET",
            "title": "Call",
            "text": "Timeout or 503."
          },
          {
            "from": 0,
            "to": 0,
            "label": "backoff + jitter",
            "title": "Wait",
            "text": "Do not stampede."
          },
          {
            "from": 0,
            "to": 1,
            "label": "GET",
            "title": "Retry",
            "text": "A 400 would have stopped here. The request was wrong, not unlucky."
          }
        ]
      }
    ],
    "examples": [],
    "landing": "Dead letters are a landing zone too. They are how you avoid losing a poison event inside a retry loop."
  },
  {
    "id": "auth",
    "title": "Auth and token expiry",
    "short": "Auth",
    "minutes": 14,
    "summary": "API keys, OAuth client credentials, authorization code with refresh, managed identities, mTLS, and signed URLs are different ways to prove you may read. A token that dies mid-pull is a resume problem, not a new extract.",
    "analogy": "A visitor badge that expires at noon. You do not start the museum tour over. You get a new badge and continue at the room you were in.",
    "sections": [
      {
        "h": "Patterns",
        "p": [
          "API keys are simple and easy to leak. OAuth client credentials fit a daemon. Authorization code fits a user. Refresh tokens exist so you do not ask the user again. Managed identities avoid a stored secret in clouds that support them. mTLS is a certificate instead of a header. Signed URLs are a capability for one object, for a few minutes.",
          "Store secrets in a secret store. Do not commit them. Do not log them. Scope them to read."
        ]
      },
      {
        "h": "Mid-run expiry",
        "p": [
          "On 401, refresh once and retry the same page. If refresh fails, stop and keep the checkpoint. The next run continues. Do not restart from page zero because a badge expired."
        ]
      }
    ],
    "diagrams": [
      {
        "type": "sequence",
        "title": "Refresh, then the same page",
        "blurb": "Each arrow is one interaction. Step through it.",
        "actors": [
          "Worker",
          "Token endpoint",
          "API"
        ],
        "steps": [
          {
            "from": 0,
            "to": 2,
            "label": "GET page",
            "title": "Expired",
            "text": "401. The page was not applied."
          },
          {
            "from": 0,
            "to": 1,
            "label": "refresh",
            "title": "New token",
            "text": "One refresh. Do not loop if the refresh itself is denied."
          },
          {
            "from": 0,
            "to": 2,
            "label": "GET same page",
            "title": "Continue",
            "text": "The checkpoint has not moved. The page is retried, not skipped."
          }
        ]
      },
      {
        "type": "flow",
        "title": "Token dies mid-pull",
        "blurb": "Packets move only on the highlighted hop.",
        "nodes": [
          {
            "id": "run",
            "label": "Run",
            "kind": "ingestion",
            "x": 16,
            "y": 96
          },
          {
            "id": "tok",
            "label": "Token",
            "kind": "error",
            "x": 166,
            "y": 96
          },
          {
            "id": "api",
            "label": "API",
            "kind": "source",
            "x": 316,
            "y": 96
          },
          {
            "id": "ckpt",
            "label": "Checkpoint",
            "kind": "storage",
            "x": 466,
            "y": 96
          }
        ],
        "steps": [
          {
            "title": "401",
            "text": "The badge expired between pages. Rows already landed are fine.",
            "hot": [
              "tok"
            ],
            "phase": "fail"
          },
          {
            "title": "Refresh and resume",
            "text": "New token, same cursor.",
            "hot": [
              "run",
              "api",
              "ckpt"
            ],
            "packets": [
              {
                "from": "run",
                "to": "api"
              }
            ],
            "phase": "fix"
          }
        ]
      }
    ],
    "examples": [
      {
        "domain": "Standard",
        "name": "OAuth 2.0",
        "fact": "Pattern: client credentials, authorization code, and refresh tokens are in the OAuth 2.0 framework. Confirm the vendor's token lifetime. Do not hard-code one.",
        "url": "https://datatracker.ietf.org/doc/html/rfc6749",
        "source": "RFC 6749"
      }
    ],
    "landing": "The checkpoint is independent of the token. Tokens are not data. Do not land them."
  },
  {
    "id": "schema",
    "title": "Schema drift and contracts",
    "short": "Schema",
    "minutes": 10,
    "summary": "Sources add fields, rename fields, and change types. A pipeline that assumes yesterday's shape will either crash or silently shift meaning. A contract says which change is allowed.",
    "analogy": "A form that grows a new box. If you read by column number, the amount becomes the phone number.",
    "sections": [
      {
        "h": "What to do",
        "p": [
          "Land the raw payload so a new field is not lost even if silver does not know it yet. Evolve silver explicitly. Additive fields are usually safe. Type changes and renames are breaking.",
          "A data contract is the agreement: required fields, types, and who may change them. Test it on every batch. Quarantine violations."
        ]
      }
    ],
    "diagrams": [
      {
        "type": "flow",
        "title": "Schema change",
        "blurb": "Packets move only on the highlighted hop.",
        "nodes": [
          {
            "id": "src",
            "label": "Source",
            "kind": "source",
            "x": 16,
            "y": 96
          },
          {
            "id": "raw",
            "label": "Raw",
            "kind": "storage",
            "x": 166,
            "y": 96
          },
          {
            "id": "silver",
            "label": "Silver",
            "kind": "processing",
            "x": 316,
            "y": 96
          },
          {
            "id": "q",
            "label": "Quarantine",
            "kind": "error",
            "x": 466,
            "y": 96
          }
        ],
        "steps": [
          {
            "title": "New field",
            "text": "Raw still stores it. Silver ignores unknown fields until you opt in.",
            "hot": [
              "src",
              "raw"
            ],
            "packets": [
              {
                "from": "src",
                "to": "raw"
              }
            ]
          },
          {
            "title": "Breaking change",
            "text": "A type change fails the contract. Quarantine the batch. Do not coerce quietly.",
            "hot": [
              "silver",
              "q"
            ],
            "phase": "fail"
          },
          {
            "title": "Evolve",
            "text": "Update the contract, backfill if needed, resume.",
            "hot": [
              "raw",
              "silver"
            ],
            "packets": [
              {
                "from": "raw",
                "to": "silver"
              }
            ],
            "phase": "fix"
          }
        ]
      }
    ],
    "examples": [],
    "landing": "Bronze is schemaless or self-describing. Silver is contracted. Gold is stable names the business uses."
  },
  {
    "id": "observability",
    "title": "Observability",
    "short": "Observability",
    "minutes": 10,
    "summary": "You cannot operate a pull you cannot see. Each family has a few metrics that tell you it is stuck, losing data, or about to hit a cliff.",
    "analogy": "The fuel gauge and the warning light. Arriving is not the same as knowing you arrived with every parcel.",
    "sections": [
      {
        "h": "What to count",
        "p": [
          "Pages, records, 429 rate, retry count, job duration, export URL expiry misses, webhook drop rate, consumer lag, DLQ depth, schema failures, and the gap between source count and landed unique keys.",
          "Structured logs include the run id, the cursor, and the source, never the secret. Alert on lag versus retention, on zero rows when yesterday was not zero, and on reconciliation mismatches."
        ]
      }
    ],
    "diagrams": [
      {
        "type": "flow",
        "title": "A metric before a silent gap",
        "blurb": "Packets move only on the highlighted hop.",
        "nodes": [
          {
            "id": "job",
            "label": "Job",
            "kind": "ingestion",
            "x": 16,
            "y": 96
          },
          {
            "id": "metric",
            "label": "Metrics",
            "kind": "processing",
            "x": 166,
            "y": 96
          },
          {
            "id": "alert",
            "label": "Alert",
            "kind": "error",
            "x": 316,
            "y": 96
          }
        ],
        "steps": [
          {
            "title": "Emit",
            "text": "Records, retries, lag, and the completeness gap, every run.",
            "hot": [
              "job",
              "metric"
            ],
            "packets": [
              {
                "from": "job",
                "to": "metric"
              }
            ]
          },
          {
            "title": "Page",
            "text": "A gap or a lag cliff pages a human before the retention window deletes the evidence.",
            "hot": [
              "metric",
              "alert"
            ],
            "packets": [
              {
                "from": "metric",
                "to": "alert"
              }
            ]
          }
        ]
      }
    ],
    "examples": [],
    "landing": "Metrics are not a substitute for the reconciliation table. Keep both."
  },
  {
    "id": "cost",
    "title": "Cost",
    "short": "Cost",
    "minutes": 8,
    "summary": "APIs charge per call or per row. Egress charges per byte. Streams charge for throughput and retention. Storage and compute charge for landing and transforming. The cheapest design is often the one that moves less, less often.",
    "analogy": "Postage. A thousand small letters cost more than one box, and the box still has a weight fee.",
    "sections": [
      {
        "h": "Levers",
        "p": [
          "Fewer calls: larger pages, bulk export, incremental filters. Fewer bytes: field selection and compression. Less often: a share instead of a copy, or a daily file instead of a per-second stream you do not read.",
          "Prices change and are vendor-specific. This course does not quote a price. Read the current price page and multiply by your measured volume."
        ]
      }
    ],
    "diagrams": [
      {
        "type": "flow",
        "title": "Move less",
        "blurb": "Packets move only on the highlighted hop.",
        "nodes": [
          {
            "id": "all",
            "label": "Full copy",
            "kind": "error",
            "x": 16,
            "y": 96
          },
          {
            "id": "delta",
            "label": "Delta",
            "kind": "source",
            "x": 166,
            "y": 96
          },
          {
            "id": "bill",
            "label": "Bill",
            "kind": "consumer",
            "x": 316,
            "y": 96
          }
        ],
        "steps": [
          {
            "title": "Expensive",
            "text": "A full copy every hour pays for bytes nobody reads.",
            "hot": [
              "all",
              "bill"
            ],
            "phase": "fail"
          },
          {
            "title": "Cheaper",
            "text": "A snapshot once, then changes. Confirm the vendor's meter.",
            "hot": [
              "delta",
              "bill"
            ],
            "packets": [
              {
                "from": "delta",
                "to": "bill"
              }
            ],
            "phase": "fix"
          }
        ]
      }
    ],
    "examples": [],
    "landing": "Cost is a design input. Record the meter you are optimizing, so a later 'optimization' does not increase a different bill."
  },
  {
    "id": "security",
    "title": "Security and compliance",
    "short": "Security",
    "minutes": 10,
    "summary": "Least privilege, no secrets in git, a plan for personal data, an audit trail of who pulled what, and a residency rule for where bytes may sit.",
    "analogy": "A key that opens one cupboard, not the building, and a log of who used it.",
    "sections": [
      {
        "h": "Minimum",
        "p": [
          "Read-only credentials. Separate credentials per environment. Rotate them. Do not log payloads that contain personal data unless the log store is approved for that data.",
          "Residency is a placement rule: some datasets cannot leave a region or a tenant boundary. A convenient SaaS extractor can violate it. Ask before you connect.",
          "Audit the run: who, what source, what time range, how many rows. That is how you answer an incident."
        ]
      }
    ],
    "diagrams": [
      {
        "type": "flow",
        "title": "Least privilege",
        "blurb": "Packets move only on the highlighted hop.",
        "nodes": [
          {
            "id": "id",
            "label": "Identity",
            "kind": "ingestion",
            "x": 16,
            "y": 96
          },
          {
            "id": "src",
            "label": "Source",
            "kind": "source",
            "x": 166,
            "y": 96
          },
          {
            "id": "lake",
            "label": "Lake",
            "kind": "storage",
            "x": 316,
            "y": 96
          }
        ],
        "steps": [
          {
            "title": "Read only",
            "text": "The credential can list and read the one collection. It cannot write or see the rest of the tenant.",
            "hot": [
              "id",
              "src"
            ],
            "packets": [
              {
                "from": "id",
                "to": "src"
              }
            ]
          },
          {
            "title": "Land in bounds",
            "text": "The lake is in the allowed region. The audit row records the pull.",
            "hot": [
              "src",
              "lake"
            ],
            "packets": [
              {
                "from": "src",
                "to": "lake"
              }
            ]
          }
        ]
      }
    ],
    "examples": [],
    "landing": "Bronze may contain personal data. Access to bronze is narrower than access to gold. Mask or drop fields in silver if gold does not need them."
  },
  {
    "id": "landing",
    "title": "Landing architecture",
    "short": "Landing",
    "minutes": 12,
    "summary": "Bronze is what you received, plus metadata. Silver is cleaned and deduped. Gold is what the business queries. The destination might be a lakehouse, a warehouse, or a search index. The layers still apply.",
    "analogy": "The loading dock, the sorting room, and the shop floor. You do not let customers walk the dock, and you do not throw away the packing slip.",
    "sections": [
      {
        "h": "Layers",
        "p": [
          "Bronze keeps the raw payload, the source URL or offset, the ingest time, and the run id. You can rebuild silver from it.",
          "Silver dedups, types fields, applies tombstones, and passes contracts. Gold is joined, aggregated, and named for a decision.",
          "A lakehouse keeps files and transactions. A warehouse is SQL-first. A search or vector store is a serving copy, not the system of record, unless you designed it to be."
        ]
      }
    ],
    "diagrams": [
      {
        "type": "flow",
        "title": "Bronze, silver, gold",
        "blurb": "Packets move only on the highlighted hop.",
        "nodes": [
          {
            "id": "src",
            "label": "Source",
            "kind": "source",
            "x": 16,
            "y": 96
          },
          {
            "id": "bronze",
            "label": "Bronze",
            "kind": "storage",
            "x": 166,
            "y": 96
          },
          {
            "id": "silver",
            "label": "Silver",
            "kind": "processing",
            "x": 316,
            "y": 96
          },
          {
            "id": "gold",
            "label": "Gold",
            "kind": "consumer",
            "x": 466,
            "y": 96
          }
        ],
        "steps": [
          {
            "title": "As received",
            "text": "Raw plus metadata. No business rules yet.",
            "hot": [
              "src",
              "bronze"
            ],
            "packets": [
              {
                "from": "src",
                "to": "bronze"
              }
            ]
          },
          {
            "title": "Clean",
            "text": "Dedup, types, deletes, contract.",
            "hot": [
              "bronze",
              "silver"
            ],
            "packets": [
              {
                "from": "bronze",
                "to": "silver"
              }
            ]
          },
          {
            "title": "Serve",
            "text": "Gold is rebuildable from silver. Consumers do not read bronze.",
            "hot": [
              "silver",
              "gold"
            ],
            "packets": [
              {
                "from": "silver",
                "to": "gold"
              }
            ]
          }
        ]
      }
    ],
    "examples": [],
    "landing": "This page is the landing pattern. Every family module ends by saying what bronze must keep so silver can be rebuilt."
  },
  {
    "id": "orchestration",
    "title": "Orchestration",
    "short": "Orchestration",
    "minutes": 10,
    "summary": "Something has to start the job, wait for its dependencies, retry the run, and backfill a day. Cron, Airflow, Data Factory, and job schedulers are that something. A webhook can start a run too.",
    "analogy": "A dispatcher. The trucks still do the driving. The dispatcher decides when, and what happens if a truck does not return.",
    "sections": [
      {
        "h": "Scheduled versus triggered",
        "p": [
          "A schedule is right for a nightly file or a daily incremental. An event trigger is right when a webhook or a file arrival should start the load. Dependencies matter: do not build gold until silver for that run succeeded.",
          "Backfills are orchestrated replays of a date range, with the live schedule left alone or paused for that dataset. A failed run should be visible, not a cron line that nobody reads."
        ]
      }
    ],
    "diagrams": [
      {
        "type": "flow",
        "title": "Trigger or schedule, then depend",
        "blurb": "Packets move only on the highlighted hop.",
        "nodes": [
          {
            "id": "clock",
            "label": "Schedule",
            "kind": "queue",
            "x": 16,
            "y": 96
          },
          {
            "id": "hook",
            "label": "File or hook",
            "kind": "source",
            "x": 166,
            "y": 96
          },
          {
            "id": "silver",
            "label": "Silver",
            "kind": "processing",
            "x": 316,
            "y": 96
          },
          {
            "id": "gold",
            "label": "Gold",
            "kind": "consumer",
            "x": 466,
            "y": 96
          }
        ],
        "steps": [
          {
            "title": "Start",
            "text": "A clock or an arrival starts the extract. Not both, unless you dedup the run.",
            "hot": [
              "clock",
              "hook"
            ]
          },
          {
            "title": "Silver first",
            "text": "Gold waits. A partial silver is not a signal to publish.",
            "hot": [
              "silver",
              "gold"
            ],
            "packets": [
              {
                "from": "silver",
                "to": "gold"
              }
            ]
          }
        ]
      }
    ],
    "examples": [
      {
        "domain": "Orchestrators",
        "name": "Cron, Airflow, platform jobs",
        "fact": "Pattern: cron for a single machine, a workflow tool when you have dependencies and backfills. Product names change. No schedule SLA is claimed.",
        "url": "https://airflow.apache.org/docs/",
        "source": "Apache Airflow"
      }
    ],
    "landing": "The orchestrator stores run state. The lake stores data. Do not use a green task as the only copy of the watermark."
  },
  {
    "id": "connectors",
    "title": "Build a connector",
    "short": "Connectors",
    "minutes": 18,
    "summary": "A connector is config, auth, a pagination strategy, incremental state, a rate limiter, retries, a schema check, a writer, and metrics. Frameworks differ in how much of that they already built.",
    "analogy": "A truck with a standard loading dock. Singer, Airbyte, dlt, and Kafka Connect are different docks. The cargo rules are the same.",
    "sections": [
      {
        "h": "Anatomy",
        "p": [
          "Strategy pattern for pagination: offset, cursor, keyset, link, bulk job. Pluggable auth. A state store for the cursor. An idempotent sink. Metrics for pages, 429s, and records.",
          "Singer is a spec of taps and targets over JSON lines. Airbyte's connector kit is a framework with a catalog and state. dlt is a Python library that infers schema and loads. Kafka Connect is for moving between a Kafka log and another system. Use Singer or Airbyte when you want a catalog of connectors. Use dlt when you want a Python pipeline. Use Kafka Connect when the log is already the center."
        ]
      },
      {
        "h": "Testing and agents",
        "p": [
          "Mock the server. Record responses. Inject 429s, 500s, timeouts, and partial files. A connector that only passes the happy path will lose a weekend.",
          "Exposing extracted data as a tool for an AI agent, for example an MCP server, adds a new caller that can loop. Put the same rate limit, the same read-only scope, and a row cap in front of it. An agent is not a reason to turn off pagination."
        ]
      }
    ],
    "diagrams": [
      {
        "type": "flow",
        "title": "Connector parts",
        "blurb": "Packets move only on the highlighted hop.",
        "nodes": [
          {
            "id": "cfg",
            "label": "Config",
            "kind": "ingestion",
            "x": 16,
            "y": 96
          },
          {
            "id": "auth",
            "label": "Auth",
            "kind": "processing",
            "x": 166,
            "y": 96
          },
          {
            "id": "page",
            "label": "Pager",
            "kind": "source",
            "x": 316,
            "y": 96
          },
          {
            "id": "sink",
            "label": "Sink",
            "kind": "storage",
            "x": 466,
            "y": 96
          }
        ],
        "steps": [
          {
            "title": "Configure",
            "text": "Base URL, page size, auth, and the state path. No secrets in the repo.",
            "hot": [
              "cfg",
              "auth"
            ]
          },
          {
            "title": "Page",
            "text": "The strategy yields records. The limiter and retry wrap every call.",
            "hot": [
              "auth",
              "page"
            ],
            "packets": [
              {
                "from": "auth",
                "to": "page"
              }
            ]
          },
          {
            "title": "Write",
            "text": "The sink is idempotent. State advances after the write.",
            "hot": [
              "page",
              "sink"
            ],
            "packets": [
              {
                "from": "page",
                "to": "sink"
              }
            ]
          }
        ]
      }
    ],
    "examples": [
      {
        "domain": "Frameworks",
        "name": "Singer, Airbyte, dlt, Kafka Connect",
        "fact": "Categories, not a ranked benchmark. Read the current docs before you adopt one. This repo includes a small Python template under labs/connector_template.",
        "url": "https://dlthub.com/docs/intro",
        "source": "dlt intro"
      }
    ],
    "landing": "The template writes NDJSON and a state file. Swap the sink for Parquet or a warehouse when the shape is proven."
  },
  {
    "id": "failures",
    "title": "Failure replay",
    "short": "Failures",
    "minutes": 16,
    "summary": "Eight failures, then the fix. Step through each diagram. The first steps are the break. The later steps are the repair.",
    "analogy": "A flight recorder. You watch the crash, then you watch the checklist that would have prevented it.",
    "sections": [
      {
        "h": "How to use this page",
        "p": [
          "Each diagram is a replay. Steps marked failure show the loss or the duplicate. Steps marked fix show the checkpoint, the key, the refresh, or the reconciliation that closes it."
        ]
      }
    ],
    "diagrams": [
      {
        "type": "flow",
        "title": "Crash mid-pull",
        "blurb": "Packets move only on the highlighted hop.",
        "nodes": [
          {
            "id": "c",
            "label": "Client",
            "kind": "ingestion",
            "x": 16,
            "y": 96
          },
          {
            "id": "a",
            "label": "API",
            "kind": "source",
            "x": 166,
            "y": 96
          },
          {
            "id": "d",
            "label": "Disk",
            "kind": "storage",
            "x": 316,
            "y": 96
          }
        ],
        "steps": [
          {
            "title": "Died holding a list",
            "text": "Pages lived in memory. The process died. You have nothing.",
            "hot": [
              "c"
            ],
            "phase": "fail"
          },
          {
            "title": "Page on disk",
            "text": "Each page was a file. The checkpoint has the cursor.",
            "hot": [
              "c",
              "d"
            ],
            "packets": [
              {
                "from": "c",
                "to": "d"
              }
            ],
            "phase": "fix"
          },
          {
            "title": "Resume",
            "text": "The next process continues. Finished files are not fetched again.",
            "hot": [
              "c",
              "a"
            ],
            "packets": [
              {
                "from": "c",
                "to": "a"
              }
            ],
            "phase": "fix"
          }
        ]
      },
      {
        "type": "flow",
        "title": "Offset drift",
        "blurb": "Packets move only on the highlighted hop.",
        "nodes": [
          {
            "id": "o",
            "label": "Offset",
            "kind": "error",
            "x": 16,
            "y": 96
          },
          {
            "id": "k",
            "label": "Keyset",
            "kind": "source",
            "x": 166,
            "y": 96
          },
          {
            "id": "d",
            "label": "Disk",
            "kind": "storage",
            "x": 316,
            "y": 96
          }
        ],
        "steps": [
          {
            "title": "Skip N",
            "text": "An insert above the window repeats a row and hides another.",
            "hot": [
              "o"
            ],
            "phase": "fail"
          },
          {
            "title": "Seek",
            "text": "id greater than last id does not care about the shifting window.",
            "hot": [
              "k",
              "d"
            ],
            "packets": [
              {
                "from": "k",
                "to": "d"
              }
            ],
            "phase": "fix"
          }
        ]
      },
      {
        "type": "flow",
        "title": "Expired signed URL",
        "blurb": "Packets move only on the highlighted hop.",
        "nodes": [
          {
            "id": "u",
            "label": "Old URL",
            "kind": "error",
            "x": 16,
            "y": 96
          },
          {
            "id": "j",
            "label": "Job",
            "kind": "queue",
            "x": 166,
            "y": 96
          },
          {
            "id": "f",
            "label": "File",
            "kind": "storage",
            "x": 316,
            "y": 96
          }
        ],
        "steps": [
          {
            "title": "403",
            "text": "The URL expired. The snapshot is not empty. The URL is.",
            "hot": [
              "u"
            ],
            "phase": "fail"
          },
          {
            "title": "New URL",
            "text": "Ask the job for fresh URLs and download those.",
            "hot": [
              "j",
              "f"
            ],
            "packets": [
              {
                "from": "j",
                "to": "f"
              }
            ],
            "phase": "fix"
          }
        ]
      },
      {
        "type": "flow",
        "title": "Missed webhook",
        "blurb": "Packets move only on the highlighted hop.",
        "nodes": [
          {
            "id": "h",
            "label": "Hook",
            "kind": "error",
            "x": 16,
            "y": 96
          },
          {
            "id": "r",
            "label": "Reconcile",
            "kind": "processing",
            "x": 166,
            "y": 96
          },
          {
            "id": "s",
            "label": "Source",
            "kind": "source",
            "x": 316,
            "y": 96
          }
        ],
        "steps": [
          {
            "title": "No ring",
            "text": "The event never arrived. Your table is short.",
            "hot": [
              "h"
            ],
            "phase": "fail"
          },
          {
            "title": "Pull",
            "text": "Reconciliation reads the source and fills the id.",
            "hot": [
              "s",
              "r"
            ],
            "packets": [
              {
                "from": "s",
                "to": "r"
              }
            ],
            "phase": "fix"
          }
        ]
      },
      {
        "type": "flow",
        "title": "Commit too early",
        "blurb": "Packets move only on the highlighted hop.",
        "nodes": [
          {
            "id": "c",
            "label": "Consumer",
            "kind": "ingestion",
            "x": 16,
            "y": 96
          },
          {
            "id": "o",
            "label": "Offset",
            "kind": "queue",
            "x": 166,
            "y": 96
          },
          {
            "id": "l",
            "label": "Lake",
            "kind": "storage",
            "x": 316,
            "y": 96
          }
        ],
        "steps": [
          {
            "title": "Offset moved, write did not",
            "text": "A crash now skips events that never landed.",
            "hot": [
              "o"
            ],
            "phase": "fail"
          },
          {
            "title": "Write, then commit",
            "text": "A crash replays. The sink dedups.",
            "hot": [
              "c",
              "l"
            ],
            "packets": [
              {
                "from": "c",
                "to": "l"
              }
            ],
            "phase": "fix"
          }
        ]
      },
      {
        "type": "flow",
        "title": "Half-written file",
        "blurb": "Packets move only on the highlighted hop.",
        "nodes": [
          {
            "id": "p",
            "label": "Partial",
            "kind": "error",
            "x": 16,
            "y": 96
          },
          {
            "id": "m",
            "label": "Done marker",
            "kind": "queue",
            "x": 166,
            "y": 96
          },
          {
            "id": "l",
            "label": "Loader",
            "kind": "processing",
            "x": 316,
            "y": 96
          }
        ],
        "steps": [
          {
            "title": "Loaded early",
            "text": "The loader read a file the writer had not closed.",
            "hot": [
              "p"
            ],
            "phase": "fail"
          },
          {
            "title": "Wait for done",
            "text": "No marker, no load.",
            "hot": [
              "m",
              "l"
            ],
            "packets": [
              {
                "from": "m",
                "to": "l"
              }
            ],
            "phase": "fix"
          }
        ]
      },
      {
        "type": "flow",
        "title": "Schema break",
        "blurb": "Packets move only on the highlighted hop.",
        "nodes": [
          {
            "id": "s",
            "label": "Source",
            "kind": "source",
            "x": 16,
            "y": 96
          },
          {
            "id": "q",
            "label": "Quarantine",
            "kind": "error",
            "x": 166,
            "y": 96
          },
          {
            "id": "v",
            "label": "Contract",
            "kind": "processing",
            "x": 316,
            "y": 96
          }
        ],
        "steps": [
          {
            "title": "Silent shift",
            "text": "Column 3 changed meaning. Gold is wrong and green.",
            "hot": [
              "s"
            ],
            "phase": "fail"
          },
          {
            "title": "Quarantine",
            "text": "The contract fails the batch. Raw is kept. Silver does not move.",
            "hot": [
              "v",
              "q"
            ],
            "phase": "fix"
          }
        ]
      },
      {
        "type": "flow",
        "title": "Token expiry",
        "blurb": "Packets move only on the highlighted hop.",
        "nodes": [
          {
            "id": "t",
            "label": "Token",
            "kind": "error",
            "x": 16,
            "y": 96
          },
          {
            "id": "r",
            "label": "Refresh",
            "kind": "processing",
            "x": 166,
            "y": 96
          },
          {
            "id": "p",
            "label": "Same page",
            "kind": "source",
            "x": 316,
            "y": 96
          }
        ],
        "steps": [
          {
            "title": "401",
            "text": "The run stopped. Restarting from zero wastes the landed pages and can duplicate them.",
            "hot": [
              "t"
            ],
            "phase": "fail"
          },
          {
            "title": "Refresh and resume",
            "text": "New token, same checkpoint.",
            "hot": [
              "r",
              "p"
            ],
            "packets": [
              {
                "from": "r",
                "to": "p"
              }
            ],
            "phase": "fix"
          }
        ]
      }
    ],
    "examples": [],
    "landing": "Every fix lands the same way: durable page, then checkpoint, idempotent key, quarantine for poison."
  },
  {
    "id": "race",
    "title": "The race",
    "short": "The race",
    "minutes": 10,
    "summary": "The same dataset can arrive by paging, by a bulk file, by a stream, by CDC, or by a nightly drop. They finish at different times and they mean different things by fresh.",
    "analogy": "Five ways to get the same books. One is a person walking the shelves. One is a truck. One is a conveyor that never stops.",
    "sections": [
      {
        "h": "Read the lanes",
        "p": [
          "The times in the diagram are illustrative, labeled as a model, not a benchmark. Paging pays latency per page. Export pays a job plus a download. A stream is already moving, so 'finish' means caught up, and freshness is seconds if you keep up. CDC is similar, after the snapshot. A file drop is as fresh as the partner's schedule, often a day, and then it finishes in one load."
        ]
      }
    ],
    "diagrams": [
      {
        "type": "race",
        "title": "Illustrative finish and freshness",
        "blurb": "Same dataset, different delivery. Illustrative times, not a benchmark.",
        "lanes": [
          {
            "name": "Paged API",
            "seconds": 58,
            "freshness": "Stale by the time page 1 was fetched. Model: 10,000 pages at a tight rate limit.",
            "kind": "source"
          },
          {
            "name": "Bulk export",
            "seconds": 12,
            "freshness": "Point-in-time as of job start. Fresh enough for a daily decision.",
            "kind": "storage"
          },
          {
            "name": "Stream",
            "seconds": 4,
            "freshness": "Caught up means seconds behind, if lag stays inside retention.",
            "kind": "queue"
          },
          {
            "name": "CDC",
            "seconds": 8,
            "freshness": "Snapshot first, then near-real-time changes, including deletes.",
            "kind": "processing"
          },
          {
            "name": "Nightly file",
            "seconds": 20,
            "freshness": "Fresh as of last night. Fast to load, late to know.",
            "kind": "consumer"
          }
        ],
        "steps": [
          {
            "title": "Start",
            "text": "All five start when you notice you need the data. The stream and the file may have been moving already."
          },
          {
            "title": "Early finishers",
            "text": "A stream that is already populated looks fastest because you did not backfill. A backfill is a different race."
          },
          {
            "title": "Paging still walking",
            "text": "The paged API is still in the rate-limit math. Threads will not change that term."
          },
          {
            "title": "What fresh means",
            "text": "Export and files are snapshots. Streams and CDC are changes. Do not compare their clocks as if they were the same question."
          },
          {
            "title": "Pick",
            "text": "If you need history once, export or CDC snapshot. If you need tomorrow morning, a file may be enough. If you need minutes, a stream, CDC, or delta plus webhook."
          }
        ]
      }
    ],
    "examples": [],
    "landing": "Land each lane in bronze with a 'as of' or an offset. Do not mix a snapshot and a stream into gold without a merge rule."
  },
  {
    "id": "decision",
    "title": "Decision guide",
    "short": "Decide",
    "minutes": 20,
    "summary": "Pick the pattern from volume, freshness, what the source actually offers, and the constraint that will not move. The tree is a starting point. The scenarios below use illustrative numbers, labeled as such.",
    "analogy": "Choosing a vehicle. Distance, deadline, and whether the road is even open.",
    "sections": [
      {
        "h": "Worked scenarios",
        "p": [
          "CRM, 50 million records, both REST and a bulk export. Illustrative: 50 million / 1,000 pages is 50,000 calls. At 200 ms that is hours, before limits. Use the bulk export for the snapshot. Use incremental or CDC-like deltas after that. Paging is the fallback.",
          "Government open data, 1,000 rows per page, strict limit. Illustrative: 1 million rows is 1,000 calls. If the limit is a handful per 30 seconds, the floor is hours. Raise the page size if allowed, get a key, or take a file. Do not add threads.",
          "Security telemetry, 250,000 devices. A daily snapshot file or the vendor's via-files export fits a morning report. Near-real-time detections need the event stream, not a nightly vulnerability table. Defender's own docs split JSON and via-files around 100-K devices. That is a verified vendor hint, not a universal law.",
          "Identity changes within minutes. Delta query plus a change notification. A nightly full pull will miss the minute. A webhook alone will miss an event.",
          "E-commerce order webhooks. Dedup, signature, queue, and a reconciliation pull of the orders API. The webhook is the hint.",
          "On-premises SQL Server to a lakehouse, near real time. Log-based CDC or a managed connector, after a snapshot. Direct full queries will hurt the primary and miss deletes.",
          "IoT, one reading a second. MQTT or a stream, partitioned by device. A REST pull per reading will fall behind and may be against the terms.",
          "Partner nightly CSV on SFTP. A done marker, schema check, idempotent load. Do not build a fake API in front of a file you already have, unless more than one team needs a contract.",
          "A website with no API. Ask for a feed. If the page is public and the terms allow reading, a careful scrape of a practice-style page is a last resort. If the terms forbid it, stop."
        ]
      }
    ],
    "diagrams": [
      {
        "type": "state",
        "title": "Which pattern",
        "blurb": "The glowing state is where you are.",
        "states": [
          "file?",
          "fresh?",
          "cursor?",
          "limit?",
          "build"
        ],
        "steps": [
          {
            "title": "File or export?",
            "text": "If yes, take it for the snapshot.",
            "state": "file?"
          },
          {
            "title": "How fresh?",
            "text": "Minutes means stream, CDC, or delta. A day means a schedule.",
            "state": "fresh?"
          },
          {
            "title": "Cursor only?",
            "text": "Then you cannot parallelize. Ask for keyset or a file.",
            "state": "cursor?"
          },
          {
            "title": "Rate limit the ceiling?",
            "text": "Threads will not help. Change the quota or the pattern.",
            "state": "limit?"
          },
          {
            "title": "Then build",
            "text": "Checkpoint, idempotent sink, reconciliation.",
            "state": "build"
          }
        ]
      }
    ],
    "examples": [],
    "landing": "Write the choice down: pattern, freshness target, and the constraint you measured. Revisit it when the volume grows by 10x."
  },
  {
    "id": "simulators",
    "title": "Simulators",
    "short": "Simulators",
    "minutes": 15,
    "summary": "Four models: throughput, a consumer group, offset drift, and webhook drops. They are models. They are not vendor limits.",
    "analogy": "A wind tunnel. Useful, and not the sky.",
    "sections": [
      {
        "h": "Open the simulators",
        "p": [
          "This page is a pointer. The interactive simulators are mounted when the page id is simulators. If you are reading the markdown, run the HTML page instead."
        ]
      }
    ],
    "diagrams": [],
    "examples": [],
    "landing": "A simulator does not land data. The labs do."
  }
];
