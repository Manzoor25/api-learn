# LinkedIn post

## Post

I used to think a slow data pull meant I needed more threads. A page of 1,000 rows is not the table. It is the provider protecting memory, timeouts, and everyone else on the machine.

I built a small course to force the rest of the picture into the open. Who moves the data, how much moves, how fresh it has to be, and what the source refuses to do. Offset pagination drifts if rows move. A cursor cannot be parallelized because you do not have the next token yet. A rate limit is a floor: past it, threads only create 429s. Webhooks drop. Signed download URLs expire. A stream that commits its offset before the write loses data. A file you read before the writer is done is a lie.

The useful rule is boring. Write the page, then the checkpoint. Dedup on a stable key. Reconcile against the source count. If a bulk file exists, take the file.

I put the diagrams, the simulators, and the labs in one repo so I can replay the failures instead of memorizing them.

https://manzoor25.github.io/api-learn/

## Alternate hooks

1. More threads did not fix the hour-long pull. The rate limit was the floor.
2. A webhook is a doorbell. Some rings never happen. That is why you still pull.
3. I drew every way a system can hand you data, then the one mistake that loses a row in each.
