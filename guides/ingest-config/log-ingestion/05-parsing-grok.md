---
module: Log Ingestion
sidebar: Ingest & Config → Log Ingestion
section: Ingest & Config
subsection: Parsing with regex and Grok
last_updated: 2026-05-23
---

# Parsing with regex and Grok

**Part of:** Ingest & Config → Log Ingestion
**One-sentence focus:** Apache, CEF, and syslog regex capture groups, and their Grok equivalents.

### What you are looking at

The preview table columns. **SOURCE IP**, **USER**, **ACTION / EVENT**, **STATUS**, are populated entirely by regular-expression captures and JSON field maps in the log parsing layer. When a line fails to match, the **PARSE ERRORS** tile increments and **PARSE WARNINGS** lists messages like `line 4: no match`. Selecting Apache / Nginx access log and pasting a standard Combined Log Format line demonstrates the most intuitive mapping: IP in orange, HTTP method and status in **ACTION / EVENT** and **STATUS** columns. For CEF lines, the table shows vendor event names (e.g. Inbound TCP connection denied, SQL Injection Attempt) in **ACTION / EVENT**, with **SOURCE IP** extracted from extension key `src`. The format feels like Grok patterns in Logstash; named captures translated to ECS fields: even though the implementation is pure JavaScript `RegExp.exec()`.

### Why this matters

Regex parsing is the foundation of SIEM normalization before ML or LLM enrichment entered the market. Understanding capture groups explains every preview column and every false negative. When your organization's logs deviate slightly (extra field, different quote escaping), you know exactly which regex to adjust. Mirroring how detection engineers maintain Grok filters in Elastic or QRadar DSM extensions. Preserving `_raw` alongside parsed fields provides tamper-evident originals for court-admissible timelines.

### Step-by-step walkthrough

1. Paste a single Apache line from `FORMAT_EXAMPLES.apache` into Log Ingestion.
2. Confirm preview shows one event with correct IP, user, `HTTP POST`, status `401`.
3. Deliberately break the line, remove a quote before HTTP method; observe `line 1: no match` in warnings.
4. Paste a CEF line; verify **ACTION / EVENT** shows the CEF name field (group 6), not the signature ID.
5. Paste syslog `<34>May 22 09:00:01 host sshd[1234]: Failed password for root from 203.0.113.45 port 52341 ssh2`.
6. Confirm **SOURCE IP** extracts `203.0.113.45` from message body via `extractIp()`, not hostname.
7. Open browser console, import `{ parseLogText }` if debugging locally, call `parseLogText(line, 'apache')` to inspect raw event object including `_raw` and ECS nesting.
8. Compare `event.outcome` for 401 (failure) vs 200 (success) Apache responses.

### Common questions

#### Why not use a grok library?

The dashboard prioritizes zero-dependency client-side parsing for instant preview. Native regex keeps bundle size small and makes patterns readable in one file for training purposes.

#### What happens when apache regex matches but date parsing fails?

`parseApacheDate()` returns null; timestamp falls back to `Date.now()`: events appear with current time, which can break timeline analysis. Watch for this on non-standard date formats.

#### How are CEF extension keys with spaces handled?

`parseCefExtension()` splits on `\w+=` lookahead boundaries, allowing values like `request=/search?q=1' OR '1'='1` to survive as single values until the next key.

#### Can I add a custom regex format?

Extend log parsing layer with a new `_RE`, parser function, `detectFormat()` branch, and `FORMAT_LABELS` / `FORMAT_EXAMPLES` entries, then restart the dashboard. No hot-reload of patterns in the UI.

### Analyst workflow under pressure

When preview shows widespread "no match" errors on an Apache export, the analyst compares a failing line against `APACHE_RE`. often discovering custom log format (Common instead of Combined) or missing referer/agent fields. They either re-export with Combined format or request engineering add a parser variant. For CEF from a new firewall vendor, they verify `src`/`dst` extensions appear, some vendors use non-standard keys requiring parser extension.

### Edge cases and gotchas

Apache pattern requires HTTP version in quotes `"HTTP/1.1"`; HTTP/2-only logs may fail. Syslog3164 uses current year injection: December/January boundary logs can mis-order in timeline. JSON detection runs before Apache test in auto-detect.A line starting with `{` never reaches Apache regex. Windows events must be JSON objects/arrays, not XML `.evtx` binary. The `inferSeverity()` function scans concatenated message/action/outcome text for keywords like `malware`, `brute.force`, `blocked`, independent of regex captures.

> **Technical note:** `parseLogText()` returns `{ events, format, errors }` where `errors` is a string array of human-readable warnings; it does not include partial field captures from failed groups. Unknown format defaults to Apache parser in the `parsers` map fallback: `parsers[format] || parsers['apache']`.

### Apache combined log format;`APACHE_RE`:

```javascript
const APACHE_RE = /^(\S+)\s+\S+\s+(\S+)\s+\[([^\]]+)\]\s+"(\w+)\s+(\S+)\s+[^"]*"\s+(\d+)\s+(\d+|-)\s*(?:"([^"]*)")?\s*(?:"([^"]*)")?/;
```
Capture group mapping in `parseApacheLine()`:

| Group | Field | Example |
|---|---|---|
| 1 | `source.ip` / `sourceIp` | `203.0.113.45` |
| 2 | `username` | `root` or `-` → undefined |
| 3 | timestamp string | `22/May/2026:09:00:03 +0000` → parsed via `parseApacheDate()` |
| 4 | HTTP method | `POST` |
| 5 | URL path | `/wp-login.php` |
| 6 | status code | `401` |
| 7 | response bytes | `512` |
| 8 | referer (optional) | `-` |
| 9 | user-agent (optional) | `python-requests/2.28` |

```
%{IPORHOST:clientip} %{USER:ident} %{USER:auth} \[%{HTTPDATE:timestamp}\] "%{WORD:verb} %{URIPATHPARAM:request} HTTP/%{NUMBER:httpversion}" %{NUMBER:response} (?:%{NUMBER:bytes}|-) (?:"(?:%{URI:referrer}|-)")? (?:"(?:%{GREEDYDATA:agent}|-)")?
```
### CEF format:`CEF_RE`:

```javascript
const CEF_RE = /^CEF:(\d+)\|([^|]*)\|([^|]*)\|([^|]*)\|([^|]*)\|([^|]*)\|([^|]*)\|(.*)/;
```
CEF header fields: version, device vendor, product, version, signature ID, name, severity. Group 8 is the extension string parsed by `parseCefExtension()` using `/(\w+)=((?:[^=](?!\w+=))*[^=]?)/g` to split `key=value` pairs (handling embedded spaces in values). Mapped extensions include `src`, `dst`, `spt`, `dpt`, `suser`, `proto`, `request`, `msg`. Severity uses vendor numeric scale via `cefSeverityToLevel()`: ≥9 critical, ≥7 high, ≥4 medium, else low.

### Syslog RFC 5424.`SYSLOG5_RE`:

```javascript
const SYSLOG5_RE = /^<(\d+)>(\d+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\[.*?\]\s+)?(.*)/;
```
PRI value `<34>` splits into facility and severity (`severity_num = pri % 8`). Structured data blocks are skipped; message body captures auth failures for IP/username extraction via `extractIp()` and `extractUser()` helper regexes. Helper extractors shared across parsers:

```javascript
function extractIp(s) {
 const m = String(s).match(/\b(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\b/);
 return m?.[0];
}
function extractUser(s) {
 const m = String(s).match(/(?:user|username|account|for)\s+['"]?(\w[\w.@-]{0,40})/i);
 return m?.[1];
}
```
