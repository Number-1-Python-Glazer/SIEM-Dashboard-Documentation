---
module: Attack Timeline
sidebar: Monitor → Timeline
section: Monitor
subsection: Exporting the timeline for incident reports
last_updated: 2026-05-23
---

# Exporting the timeline for incident reports

**Part of:** Monitor → Attack Timeline
**One-sentence focus:** Timeline has no native export button, analysts combine screenshots with Overview JSON/CSV alert exports for audit packages.

### What you are looking at

No Export button on Timeline toolbar, export pathways are indirect: Overview **JSON/CSV EXPORT**, alert-driven reports, manual screenshots, or copying selected event fields from right panel. Legal hold and incident reports are like court exhibits, chain of custody matters more than pretty charts. Export means immutable, timestamped artifacts, not just a PNG.

### What is happening underneath

Alert JSON export via `exportAlerts()` includes timestamps, IPs, rules, severity; reconstruct timeline in Excel or external GRC tool. plain-text export plain text summarises counts not coordinates. SQLite POST `/api/alerts/batch` persists alert history for later API retrieval. Timeline SVG is ephemeral DOM and is not serialized server-side.

### Why this matters

Regulators ask for machine-readable evidence, not only visuals. Analysts need both screenshot for executives and JSON for forensic tools.

### Step-by-step walkthrough

1. Stabilise view; pause ingestion noise if demo.
2. Screenshot Timeline with window/group visible in frame.
3. Navigate Overview, **JSON EXPORT** alerts in same time window manually filtered later.
4. Click key dots; copy selected panel fields into incident doc.
5. Run **GEN REPORT** for summary statistics paragraph.
6. Store files with UTC timestamps in case management.
7. Note correlation engine version/limitations in report footnote.

### Common questions

#### Why no export button on timeline?

V4 prioritises visual analysis; export parity deferred to Overview/Alert Manager.

#### Is JSON enough to rebuild timeline?

Yes with a spreadsheet pivot or external SIEM; include `timestamp`, `sourceIp`, `matchedRules`, `severity`.

#### Does export include incident bands?

Incidents computed client-side; export alerts and recompute externally or document band screenshots separately.

#### Are exports tamper-evident?

Downloads are local files, integrity depends on org DLP/archival policy, not HABIBI-SIEM signing.

### What analysts do when the pager fires

Mid-incident JSON export before **CLEAR ALL** admin action preserves point-in-time evidence even if UI state cleared.

### Edge cases and gotchas

CSV formula injection mitigated via `csvEscape` on export; still open in Excel safely. Large exports include full alert history not window filter; post-process by time.
