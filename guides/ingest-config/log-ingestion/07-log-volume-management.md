---
module: Log Ingestion
sidebar: Ingest & Config → Log Ingestion
section: Ingest & Config
subsection: Log volume management
last_updated: 2026-05-23
---

# Log volume management

**Part of:** Ingest & Config → Log Ingestion
**One-sentence focus:** Preview row caps, MAX_RAW_LOGS buffer, server batch limits, and rate limiting.

### What you are looking at

Two separate caps govern volume at different pipeline stages. In Log Ingestion preview, the event table renders at most 200 rows, if more events parsed, a footer reads Showing first 200 of N events. The stats strip still shows the full **EVENTS PARSED** count, only the table truncates display. After ingest, Monitor → Live Feed retains the most recent 500 events in the rolling `rawLogs` buffer (`MAX_RAW_LOGS` in the SIEM context pipeline). The **STREAM STATS** sidebar in Live Feed displays buffer utilization (e.g. `N/300` visual denominator vs 500 actual cap, document both: code uses 500). The **INGEST** button label shows the full parsed count, not the 200-row preview cap, you may ingest 800 events while only reviewing the first 200 visually.

### Why this matters

Unbounded in-memory buffers crash browser tabs during IR scenarios involving millions of lines. Preview truncation keeps DOM rendering responsive while still reporting true parse counts; analysts must know they are seeing a sample of large files. The 500-event Live Feed window mirrors tactical SOC needs: analysts care about recent activity, not full archival (long-term retention belongs in Elasticsearch/S3 downstream). Misunderstanding caps leads to "I ingested 10,000 events but Live Feed shows 500" confusion: expected behavior, not data loss bug (within demo scope). Enterprise SIEM sizing conversations often start with EPS (events per second) and daily ingest volume. This dashboard surfaces EPS via `recentTimestamps` in the SIEM context pipeline after each log processing call. The Overview widget reflects short-term burst rate, not historical totals. When planning a production deployment, treat the 500/5000/30-per-minute limits here as teaching guardrails: they illustrate *where* limits exist (preview DOM, client buffer, server batch, API rate) even though production values would be orders of magnitude higher on clustered backends.

### Step-by-step walkthrough

1. Paste or upload a file with more than 200 parseable lines (generate via script if needed).
2. Confirm stats show full count, table shows 200 rows + footer message.
3. Ingest the batch, note green badge shows full ingest count.
4. Open Live Feed; scroll; count stabilizes at 500 most recent events after multiple large ingests.
5. Check logsProcessed in Live Feed toolbar exceeds visible row count.
6. Ingest six large batches rapidly: watch for rate limit console errors on validate.
7. Attempt >5000 event single POST via DevTools. Observe `rejected` > 0 in validate response.

### Common questions

#### Can I increase MAX_RAW_LOGS?

Yes, change the constant in the SIEM context pipeline and restart the dashboard. No Settings UI toggle exists. Consider browser memory impact above ~2000.

#### Does the 200 preview cap affect which events get ingested?

No. Ingest sends the full `preview.events` array, not the sliced display subset.

#### Are evicted events recoverable?

Not in the demo client. Once sliced from `rawLogs`, older events exist only if alerts referenced them in alert objects' embedded `log` field.

#### How does this relate to alert storage?

Alerts persist separately via `api.saveAlerts(next.slice(-1000))`; last 1000 alerts retained server-side, independent of raw log buffer.

#### Why show 200 rows if my screen can fit more?

The cap is a fixed constant in Log Ingestion screen, not responsive to viewport height. It balances readability (monospace 10px rows) against UI render cost when a single paste contains thousands of lines. Future enhancement could virtualize the table; today, trust the **EVENTS PARSED** stat for volume confirmation.

### Operational use during containment

For a 50,000-line log export, the analyst splits files into chunks under 5000 events and ingests sequentially, using preview stats (not just the 200-row window) to verify parse success per chunk. They rely on Alert Manager and saved queries for long-term evidence rather than Live Feed history. Before ingest, they scroll preview footer awareness: if parse errors concentrate after row 200, they scroll warnings or spot-check lines beyond the visible table.

### Edge cases and gotchas

Empty lines are filtered before parse. Blank lines do not count toward totals. Multiple rapid ingests without clearing can push out earlier same-session events from Live Feed even if ingested minutes ago. Simulate Campaign generates events via separate log processing path, also subject to same buffer cap. Preview severity counts compute over all events, not just visible 200; stats strip remains accurate. Very long `_raw` fields truncate at 16 KB server-side: volume control by bytes, not just event count.

> **Technical note:** `setLogsProcessed((n) => n + geoEnrichedLogs.length)` uses post-validation event count. If validation rejects items, only sanitized survivors increment the counter.

### Preview cap,Log ingestion screen:

```javascript
{preview.events.slice(0, 200).map((e, i) => (...))}
{preview.events.length > 200 && (<div>Showing first 200 of {preview.events.length} events</div>)}
```
Parsing itself has no line limit client-side; `parseLogText()` processes every non-empty line in the textarea or uploaded file. Memory bounds are practical (browser tab limits) rather than enforced.

### Raw log ring buffer:the SIEM context pipeline:

```javascript
const MAX_RAW_LOGS = 500;
//...
setRawLogs((prev) => [...prev,...geoEnrichedLogs].slice(-MAX_RAW_LOGS));
```
Each ingest appends geo-enriched events then slices the tail. FIFO eviction of oldest events. `logsProcessed` counter increments by full batch size regardless of eviction, total lifetime processed count can exceed 500.

### Server batch cap;`sanitizeLogBatch()`:

Default `maxEvents = 5000` per validate request. Additional events in the POST body are silently truncated (`rejected` count includes overflow).

### Rate limiting:`ingestLimiter`:

30 validate requests per minute. Effectively throttling sustained bulk upload automation.

### EPS tracking:

`recentTimestamps` rolling window (`EPS_WINDOW_MS`) tracks ingest rate for Overview metrics, not a hard cap but a observability signal.
