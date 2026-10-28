# Observability

You cannot operate a pull you cannot see. Each family has a few metrics that tell you it is stuck, losing data, or about to hit a cliff.

Analogy: The fuel gauge and the warning light. Arriving is not the same as knowing you arrived with every parcel.

## What to count

Pages, records, 429 rate, retry count, job duration, export URL expiry misses, webhook drop rate, consumer lag, DLQ depth, schema failures, and the gap between source count and landed unique keys.

Structured logs include the run id, the cursor, and the source, never the secret. Alert on lag versus retention, on zero rows when yesterday was not zero, and on reconciliation mismatches.

## Diagram: A metric before a silent gap

```mermaid
flowchart LR
  job[Job]
  metric[Metrics]
  alert[Alert]
  job --> metric
  metric --> alert
```

1. **Emit.** Records, retries, lag, and the completeness gap, every run.
2. **Page.** A gap or a lag cliff pages a human before the retention window deletes the evidence.

## Landing

Metrics are not a substitute for the reconciliation table. Keep both.
