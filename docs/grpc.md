# gRPC

gRPC is a contract in protobuf and four call shapes: unary, server streaming, client streaming, and bidirectional. Deadlines replace the vague hope that a call will finish.

Analogy: A phone call with a strict time limit. Unary is one question, one answer. Server streaming is them reading a list while you listen. Bidirectional is both people talking.

## Why it exists

Internal platforms want small binary messages, generated clients, and streams that do not pretend to be web pages. Public internet APIs are still mostly JSON. You will meet gRPC at service boundaries and some vendor SDKs.

A deadline is part of the request. When it passes, the call is cancelled. Retrying without a new deadline just fails faster.

## Extraction

Unary pagination looks like RPC page tokens. Server streaming can deliver a snapshot or a tail of events. You still checkpoint the last id or offset the server defines. A stream is not durable storage.

Load balancing, TLS, and message size limits are operational. A giant message hits the same wall as a giant JSON page.

## Diagram: Server stream

```mermaid
flowchart LR
  client[Client]
  rpc[gRPC]
  disk[Landing]
  client --> rpc
  rpc --> disk
```

1. **Open.** One RPC, many messages. Set a deadline.
2. **Messages.** Each message is a record or a batch. Write it. Do not buffer the stream in a list.
3. **Resume.** On disconnect, reopen with the last committed id. The stream itself forgot you.

## Examples

- Platform: gRPC call shapes. Pattern from the gRPC project: unary, server-streaming, client-streaming, bidirectional. No numeric vendor limit is claimed here. Source: https://grpc.io/docs/what-is-grpc/core-concepts/

## Landing

Append messages to a durable log or object files with the last id. Silver starts after the checkpoint advances. A cancelled RPC is a retry, not a successful empty extract.
