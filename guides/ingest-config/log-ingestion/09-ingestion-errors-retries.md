---
module: Log Ingestion
sidebar: Ingest & Config → Log Ingestion
section: Ingest & Config
subsection: Ingestion errors and retries
last_updated: 2026-05-23
---

# Ingestion errors and retries

**Part of:** Ingest & Config → Log Ingestion
**One-sentence focus:** Parse warnings versus silent validation failures, and the UI count mismatch gotcha.

### What you are looking at

Errors surface in two zones: client-side parse warnings inside Log Ingestion, and silent server-side failures visible only via missing ingest outcomes or browser console messages. Parse warnings appear as an orange **PARSE ERRORS** stat tile, a **PARSE WARNINGS** panel listing up to five messages (with "…and N more" overflow), and individual strings like `line 7: no match` or `line 3: Unexpected token`. The **INGEST** button disables when `preview.events.length === 0`, you cannot commit an empty batch. There is no Retry button in the UI. Recovery is manual: fix input, re-upload, or change format and let preview refresh automatically on text change.

### Why this matters

SIEM ingestion error handling separates mature platforms from toys. Partial parse success mirrors real collectors (dead letter queues for bad lines). Fail-closed validation prevents corrupt data entering detection. Understanding that **`return []` is silent** except console explains phantom "ingested but empty Live Feed" reports. Documenting the UI/return-value mismatch prevents false confidence during incident deadlines.

### Step-by-step walkthrough

1. Paste intentionally malformed JSON line alongside valid JSON, observe partial event count + parse warnings.
2. Paste text with zero valid lines; confirm ingest button disabled.
3. Select wrong format (Apache) for syslog text: observe many `no match` errors.
4. Open DevTools Console, ingest with server stopped. Note `[siem] log validation failed` and empty Live Feed.
5. Trigger rate limit (31 ingests/min), observe same failure pattern.
6. Fix errors, confirm preview refreshes on edit without explicit reload.
7. Copy parse warnings before ingest for IR ticket attachment.

### Common questions

#### Do parse errors block ingest?

No, unless zero events parsed. Warnings are advisory; review before clicking ingest on sensitive investigations.

#### Will the system retry validation automatically?

No. Click ingest again after fixing the root cause (network, auth, rate limit).

#### Why does ingested count show n but live feed is empty?

Likely validation returned `[]` while UI counted preview events: verify console errors and server availability.

#### Are errors logged server-side?

Validate successes audit LOGS_VALIDATED; failures before handler completion may appear in server console. Not centralized error dashboard.

### What analysts do when the pager fires

Before ingesting IR evidence, the analyst ensures parse error rate is acceptable (target <5% for structured exports; investigate 100% `no match` immediately). They screenshot the **PARSE WARNINGS** panel for chain-of-custody worksheets. If ingest appears successful but alerts do not fire, they check console for validation failure, re-authenticate if CSRF expired, and re-ingest, splitting batches if rate limited. They never assume textarea clear means durable storage; confirm in Live Feed.

### Edge cases and gotchas

`ingest()` does not disable button during async log processing: double-click can duplicate requests. Empty string clears preview via `onTextChange` without error object. FileReader errors (binary non-text upload) fail silently. No user-facing error toast. JSON array parse tries full document first, NDJSON mixed into array wrapper fails entirely. Validation failure returns before geo enrichment or detection; no partial alert emission from failed batch. Auditor role skips validate: different error surface (no server rejection, but also no alert persistence).

> **Technical note:** `alerts ?? 0` in ingest handler treats `undefined` as zero alerts; empty array from validation failure still shows ingest badge with event count. Treat Live Feed confirmation as source of truth.

### Client parse errors,`parseLogText()`:

Errors accumulate in the `errors[]` array without aborting the whole batch:

```javascript
lines.forEach((line, i) => {
 try {
 const e = parser(line);
 if (e) events.push(e);
 else errors.push(`line ${i + 1}: no match`);
 } catch (err) { errors.push(`line ${i + 1}: ${err.message}`); }
});
```
JSON formats add `line N: ${err.message}` for `JSON.parse` failures. CSV skips header row then parses data rows. Partial success is normal; 90 matched lines and 10 errors still produce 90 preview events and an enabled ingest button.

### Preview UI error display:Log ingestion screen:

```javascript
{preview.errors.slice(0, 5).map((e, i) => (...))}
{preview.errors.length > 5 && <div>…and {preview.errors.length - 5} more</div>}
```
### Ingest guard:

```javascript
const ingest = async () => {
 if (!preview?.events?.length) return;
 const alerts = await processLogs(preview.events);
 setIngested({ count: preview.events.length, alerts: alerts ?? 0 });
 setPreview(null);
 setText('');
};
```
### Validation failure.log processingFail-closed:

```javascript
if (canWrite) {
 try {
 const { events } = await api.validateLogs(logs);
 working = events;
 } catch (e) {
 console.error('[siem] log validation failed', e.message);
 return [];
 }
}
```
- Network offline / server down.
- HTTP 400/401/403/429/5xx from validate endpoint.
- Non-JSON response. When `[]` returns, `LogIngestion` still sets `ingested.count` to preview length (it uses `preview.events.length`, not return value), UI can show ingested count even when pipeline dropped events. Analysts should verify Live Feed for actual arrival. This is a UI inconsistency worth noting.

### No automatic retry:

Neither client nor server implements exponential backoff. Rate-limited clients must wait 60 seconds or batch smaller.

### Post-ingest state reset:

Successful ingest clears preview and textarea; errors from prior preview are lost. Copy warnings before ingesting if documenting parse quality.
