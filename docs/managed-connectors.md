# Managed connectors

Airbyte, Fivetran, Azure Data Factory, Databricks Lakeflow Connect, and their relatives already built the pagination, CDC, and retries. Buy them when the source is common and your edge is the model, not the socket.

Analogy: Hiring a courier instead of building a truck. You still have to say where the boxes go, and you still check that nothing was left on the dock.

## When to buy

The source is Salesforce, a database, or another system with a maintained connector. Your team is small. The connector's latency and cost fit. You still own schema tests, credentials, and the reconciliation count.

Build when the source is odd, the connector hides a limit you cannot accept, or the data cannot leave a network the vendor's cloud cannot see.

## What you still do

Compare control, cost, and latency in a table for the actual source, not from a slogan. A managed CDC product can be minutes. A nightly file connector is a day. Read the current product page.

Do not point a managed connector at production credentials with write scope. Least privilege still applies.

## Diagram: Buy the pipe, own the check

```mermaid
flowchart LR
  src[Source]
  conn[Connector]
  lake[Lake]
  you[Your tests]
  src --> conn
  conn --> lake
  lake --> you
```

1. **Sync.** The product pages, tails a log, or copies a file.
2. **Land.** Rows arrive in your lake under their schema.
3. **Verify.** You still compare counts and keys. A green connector check is not your business rule.

## Examples

- Integration: Hosted and platform connectors. Names checked as product categories, not as a feature matrix: Fivetran, Airbyte, Azure Data Factory, Databricks Lakeflow Connect. Capabilities and prices change. Compare the current docs for the source you have. No price is quoted here. Source: https://docs.airbyte.com/

## Landing

Land where the product writes, then run your own silver tests. Keep a source-of-record count outside the connector's success flag.
