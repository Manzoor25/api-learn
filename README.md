# How data moves

A self-contained course on the ways systems expose data, how to take it without losing it, and how it lands. The teaching is visual: animated diagrams, a map, and four simulators. The labs are plain Python.

Live site, after GitHub Pages finishes: [https://manzoor25.github.io/api-learn/](https://manzoor25.github.io/api-learn/)

## Open it

Double-click [index.html](index.html). It uses relative scripts and no CDN, so it works offline.

Or, from this folder:

```powershell
python -m http.server 8080
```

Then open `http://127.0.0.1:8080/`.

## Suggested path

Times are reading plus stepping the diagrams, not a certification.

| Order | What | Time |
| --- | --- | --- |
| 1 | [Common API types](modules/common-apis.html), then the home map | 25 min |
| 2 | [REST pagination](modules/rest-pagination.html) and [rate limits](modules/rate-limits.html) | 40 min |
| 3 | GraphQL, SOAP, gRPC, batch calls, query APIs | 50 min |
| 4 | Bulk export, file drops, sharing | 40 min |
| 5 | Webhooks, deltas, streaming, sockets | 70 min |
| 6 | Database reads, CDC, managed connectors | 45 min |
| 7 | Scraping and emailed reports, including the rules | 20 min |
| 8 | Cross-cutting modules, especially guarantees, idempotency, auth, landing | 90 min |
| 9 | [Simulators](modules/simulators.html) and the [failure replay](modules/failures.html) | 30 min |
| 10 | Labs, then the [cheat sheet](CHEAT_SHEET.md) | 75 min |

A first sitting can stop after the decision guide and the family you actually have. The interview set is a later pass.

## Labs

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r labs\requirements.txt
.\.venv\Scripts\python.exe -m pytest
```

On macOS or Linux, `python3 -m venv .venv`, then `make -C labs test` after activating the venv, or `python -m pytest` from the repo root.

Thirteen tests cover pagination strategies, a GraphQL cost limit, export URL expiry, webhook dedup and reconciliation, file done-markers, a SQLite CDC stand-in, an in-process consumer group, and the connector template. Docker files under `labs/cdc_sim` and `labs/streaming_sim` are optional and off.

## What is verified

[SOURCES.md](SOURCES.md) lists every vendor number, the URL, and the date. Illustrative times in the decision guide and the race diagram are labeled as models. NVD's numeric rate limit was not extracted from its JavaScript docs page, so it is not quoted.

## Layout

| Path | Role |
| --- | --- |
| [index.html](index.html) | Map: pull to push, batch to real-time |
| [modules/](modules/) | One page per family, concept, simulator, and failure replay |
| [assets/](assets/) | CSS and the diagram player. No external scripts |
| [docs/](docs/) | The same lessons as Markdown, with Mermaid |
| [case-studies/](case-studies/) | Short verified product notes |
| [labs/](labs/) | Runnable Python |
| [DECISION_GUIDE.md](DECISION_GUIDE.md) | Tree and nine scenarios |
| [CHEAT_SHEET.md](CHEAT_SHEET.md) | Limitation, workaround, landing |
| [GLOSSARY.md](GLOSSARY.md) | Terms |
| [INTERVIEW_QUESTIONS.md](INTERVIEW_QUESTIONS.md) | 50 questions and 8 whiteboards |
| [SOURCES.md](SOURCES.md) | What was checked, and what was not |
