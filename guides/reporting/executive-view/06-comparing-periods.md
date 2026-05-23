---
module: Executive View
sidebar: Reporting → Executive View
section: Reporting
subsection: Comparing periods
last_updated: 2026-05-23
---

# Comparing periods

**Part of:** Reporting → Executive View
**One-sentence focus:** How the ALERTS (24H) delta compares rolling twenty-four-hour windows, and what other metrics lack period comparison.

### What you are looking at

Temporal comparison on this screen is intentionally minimal: only ALERTS (24H) exposes a second line, red up +N, green down N, or grey unchanged (0), with the literal suffix vs prev 24h. That label is accurate: the code compares two adjacent rolling windows of 86,400,000 ms each, not calendar Monday-to-Monday. Every other headline number (CRITICAL (24H), **ACTIVE INCIDENTS**, **AUTO-BLOCKS**, **LOGS PROCESSED**) is a snapshot without history; trend analysis for those requires external logging (weekly spreadsheet, Monitor → Heatmap Calendar, or Reporting → Scheduler exports). Treat delta as a *momentum indicator*, not a severity indicator. A positive delta with flat CRITICAL (24H) usually means noise or medium/low rule churn; a flat delta with rising **RISK POSTURE** means backlog composition worsened (more unresolved severities), not volume change.

### What is happening underneath

- `last24` = alerts where `now - a.timestamp < day`
- `prevDay` = alerts where `now - a.timestamp >= day && now - a.timestamp < 2 * day`
- `delta = last24.length - prevDay.length`

The KPI renderer shows delta only when `k.delta !== null`, which is only true for ALERTS (24H). Positive delta renders `up N` in `#ff2d55`; negative renders `down N` (JavaScript stringifies negative numbers with a leading minus); zero renders `unchanged (0)`. Alerts in `prevDay` include all severities and statuses; resolved criticals from yesterday still count toward yesterday's volume. **`high24`** and **`resolved24`** are computed for NIST **RESPOND** but not surfaced as deltas in the UI. Enterprise SOCs often maintain a "golden hour" comparison (yesterday same hour) that this UI does not implement: do not improvise unless you export raw alerts. For M&A integrations, expect upward deltas for weeks as new log sources attach; pre-brief leadership with baseline adjustment. When migrating rules, document expected alert increases to avoid false escalation. If engineering extends the component, prioritise `critical24` delta and `activeInc` delta before second histogram. Executives ask about severities and fires, not only volume.

### Why this matters

Trend beats snapshot for executives deciding whether to panic. A flat **RISK POSTURE** with up 40 on ALERTS (24H) signals emerging noise or attack surface probing even if nothing is **CRITICAL** yet. Conversely, down 20 during stable posture supports "recovery after yesterday's campaign." Without understanding the window, leaders misinterpret Monday spikes as weekly trends, clarifying rolling twenty-four-hour pairs prevents that. Security operations should align verbal reports with the same window the UI uses to avoid contradicting the brief.

### Step-by-step walkthrough

1. Read ALERTS (24H) absolute count first; context for scale.
2. Read the delta line directly beneath; note colour (red up, green down).
3. Translate vs prev 24h aloud: "Compared to the twenty-four hours before the current rolling day window."
4. Open Monitor → Timeline or Heatmap Calendar if delta direction surprises you: seek causal events.
5. Compare mentally: CRITICAL (24H) versus total. Rising total with flat criticals suggests lower-severity noise.
6. Check **ACTIVE INCIDENTS** separately, delta does not cover incidents; a falling alert delta with rising active incidents means correlation caught sustained attackers.
7. Capture yesterday's screenshot next meeting if you need multi-metric trends; the UI stores only alert volume delta today.

### Common questions

#### Why not compare **CRITICAL (24H)** to the previous day?

Not implemented on the Executive View screen: the map hard-codes `delta: null` for that tile. Workaround: note CRITICAL (24H) in daily stand-up notes or extend the dashboard to compute `critical24 - prevDayCritical`. Intelligence → Risk Scoring history buckets offer partial severity trends.

#### Does **vs prev 24h** use business timezone?

Windows use `Date.now()` and alert `timestamp` in milliseconds UTC.Local browser timezone affects the header date string but not the millisecond math. Distributed teams should align on UTC when comparing verbally to the delta.

#### Can delta be zero while activity clearly changed?

Yes, equal alert counts in both windows show unchanged (0) even if severity mix shifted entirely from low to critical. Delta measures count, not severity composition; read CRITICAL (24H) and **RISK POSTURE** alongside.

#### Do resolved alerts affect delta?

Yes: they remain in historical counts for their respective windows. Resolving many alerts today lowers open risk but does not remove them from ALERTS (24H) if their timestamps fall in the window.

### Edge cases and gotchas

Border straddle: alerts timestamped exactly at T−24h may fall into `prevDay` or `last24` depending on millisecond. Large batches at window edges swing delta artificially. Simulate Campaign poisons both windows for a full day. Resolved alerts still count in both windows if timestamps sit inside each range, resolution reduces posture, not delta. PrevDay naming confuses calendar thinkers; always say "previous rolling twenty-four hours."

### How an analyst uses delta during weekly leadership email

Maintain a five-row spreadsheet: date, ALERTS (24H), delta, CRITICAL (24H), **ACTIVE INCIDENTS**, **RISK POSTURE**. Monday emails cite only delta direction plus one hypothesised cause (change ticket, campaign, holiday effect). Cross-check surprising upward deltas with Attack Timeline: if spikes cluster at 02:00 UTC, attribute to scheduled scans not breach. When delta unchanged (0) but posture rose, write "volume flat, severity backlog worse", this teaches executives composition vs volume.
