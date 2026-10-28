# Performance techniques

Make each request cheaper before you add threads. Page size, fields, compression, and connection reuse come first. Concurrency is last, and only under the rate limit.

Analogy: Packing the box fuller, and reusing the same truck, before you hire a fleet that the loading dock will turn away.

## Order of operations

Raise the page size to the documented maximum. Drop fields you do not land. Accept gzip. Reuse connections. HTTP/2 multiplexes when the server supports it.

Async I/O helps when you are waiting on the network. Threads help for the same reason, with more overhead. Processes help when you are CPU-bound on parse. None of them help when the rate limit is the ceiling.

Partitioned parallelism is the safe fan-out: independent key or time ranges, a shared limiter, a shared sink that dedups.

## Diagram: Cheap calls, then parallel ranges

```mermaid
flowchart LR
  page[Bigger page]
  pool[Pool]
  cap[Limiter]
  lake[Lake]
  page --> pool
  pool --> cap
  cap --> lake
```

1. **Fewer calls.** A larger page and fewer fields cut the request count.
2. **Reuse.** A connection pool avoids a new handshake per page.
3. **Cap.** Parallel ranges share one limiter.

## Landing

Measure one page before you multiply. diagnose the latency, the page size, and the limit. Then estimate.
