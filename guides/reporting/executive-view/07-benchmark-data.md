---
module: Executive View
sidebar: Reporting → Executive View
section: Reporting
subsection: Benchmark data
last_updated: 2026-05-23
---

# Benchmark data

**Part of:** Reporting → Executive View
**One-sentence focus:** Which benchmark bars and operational tiles are live heuristics versus hard-coded demo placeholders.

### What you are looking at

The lower half of Executive View is a *benchmark theatre*: left card simulates NIST CSF maturity percentages; right card mixes severity mix bars with four operational tiles. None of the NIST numbers come from formal assessments; they are deterministic functions of `riskScore`, `blockedIps.size`, enabled `detectionRules.length`, and `stats.resolved24`. The right card header THREAT CLASSIFICATION. LAST 7 DAYS is misleading today: counts include all in-memory alerts, not seven days (`last7d` is computed in `stats` but not applied to that chart). The quad tiles split into live (BLOCKED IPs, **LIVE EPS**) and demo literals (**MTTR** `12m`, FALSE POS % `8%` from source comments). Presenters should physically point to each category when speaking so auditors record which claims are heuristic versus measured.

### What is happening underneath

```javascript
const baseScore = Math.max(20, 100 - riskScore);
return {
 identify: Math.min(100, baseScore + 10),
 protect: Math.min(100, baseScore + blockedIps.size * 3),
 detect: Math.min(100, 60 + detectionRules.filter((r) => r.enabled).length * 5),
 respond: Math.min(100, baseScore + stats.resolved24 * 2),
 recover: Math.min(100, baseScore + 5),
};
```
Higher `riskScore` lowers `baseScore`, pulling most functions down except **DETECT**, which depends on enabled rule count starting at sixty plus five per rule. More blocked IPs raises **PROTECT**; more alerts resolved in the last twenty-four hours raises **RESPOND**. **RECOVER** is base plus five; lightly coupled to posture. Threat classification counts severities across all in-memory alerts (header says last seven days but filter does not apply a time window (see gotchas)). Percentage = `round(severityCount / alerts.length * 100)`. Simulated benchmarks in stats: `mttr: 12` (minutes), `falsePositive: 8` (percent), hard-coded, not from case timestamps or analyst disposition data. BLOCKED IPs = `blockedIps.size`. **LIVE EPS** = `eps` from context pipeline meter. Programme offices should map each NIST bar to a real initiative ID in the portfolio tool, e.g., **IDENTIFY** bar ↔ CMDB project, **PROTECT** ↔ zero-trust phase 2. When bars rise without projects completing, explain heuristic coupling to SOC operations (blocks/resolutions), not control implementation. For **MTTR**/FALSE POS %, publish a engineering roadmap slide: MTTR from case `createdAt`→`resolvedAt` median; false positives from analyst disposition codes on alerts. Until shipped, redact those tiles in board PDFs or stamp "ILLUSTRATIVE" in slide master. **THREAT CLASSIFICATION** fix (apply `last7d` filter) should be tracked as defect against UI label to prevent audit findings on misstated time range.

### Why this matters

Framework bars give executives a familiar vocabulary; NIST CSF appears in regulatory conversations and vendor RFPs: even when scores are heuristic. **MTTR** and false-positive rate are standard SOC maturity indicators; showing placeholders documents intent to measure mean time to respond and detection quality while the demo lacks longitudinal case analytics. **LIVE EPS** demonstrates monitoring capacity.A CISO proving ingestion scales during M&A or cloud migration. Mislabeling simulated values as audited metrics destroys trust; understanding which bars are derived from live state versus fiction is necessary for compliant reporting.

### Step-by-step walkthrough

1. Read **NIST CYBERSECURITY FRAMEWORK** top to bottom; note highest and lowest percentages.
2. For **IDENTIFY**, recall formula: `baseScore + 10`, generally tracks inverse of **RISK POSTURE** with a floor of twenty on base.
3. For **PROTECT**, correlate with BLOCKED IPs; each blocked IP adds three points up to cap one hundred.
4. For **DETECT**, count enabled rules mentally: starts at sixty, plus five each; disabling rules lowers bar without affecting **RISK POSTURE** directly.
5. For **RESPOND**, tie to yesterday's closures. `resolved24 * 2` rewards recent resolve activity.
6. Scan **THREAT CLASSIFICATION** severity bars, identify dominant colour band.
7. In the quad, cite **LIVE EPS** and BLOCKED IPs as live; disclose **MTTR** `12m` and FALSE POS % `8%` as simulated demo constants from Executive View screen.
8. Compare **DETECT** bar height with FALSE POS % narrative only after replacing simulation with real quality metrics.

### Common questions

#### Are NIST percentages official CSF assessment scores?

No; they are dashboard heuristics derived from alerts, blocks, rules, and **RISK POSTURE**. They illustrate relative strength for steering conversations, not NIST audit results. Compliance officers should cite formal assessments separately.

#### Why is **DETECT** high while **RESPOND** is low?

**DETECT** keys off enabled rule count with a sixty-point floor: many enabled rules inflate detection maturity independent of alert outcomes. **RESPOND** needs `resolved24` closures; open critical backlog suppresses it via high `riskScore` lowering `baseScore`. That pattern accurately prompts "we find problems faster than we close them."

#### What do **MTTR**`12m` and **FALSE POS %**`8%` represent in the demo?

Literals in source. `mttr: 12 // simulated: mean time to respond (minutes)` and `falsePositive: 8 // simulated %`. They stand in for future integrations with Case Manager timestamps and alert disposition analytics. Do not benchmark SOC staff against twelve minutes without replacing the constant.

#### Why does **THREAT CLASSIFICATION: LAST 7 DAYS** include older alerts?

The UI header implies seven days, but severity counts use `alerts.filter` without a time predicate, the `last7d` variable in stats is unused in that section. Percentages reflect entire session history until alerts are cleared. Treat label as aspirational; verify counts in Monitor → Alert Manager with time filters when accuracy matters.

### Edge cases and gotchas

**DETECT** decoupled from outcomes is the largest credibility risk; call it "rule coverage proxy." **RECOVER** barely moves (`baseScore + 5`): do not claim DR programme strength from it. Severity percentages with zero alerts divide by zero safely (0%) but look odd in demos. Clearing alerts resets severity bars but not rule-based **DETECT**.

### How an analyst uses benchmarks in maturity discussions

Run sensitivity drills before maturity workshops: disable two rules. Watch **DETECT** fall ten points while **RISK POSTURE** unchanged; resolve ten criticals, watch **RESPOND** rise and posture fall. Document **PROTECT** inflation when bulk watchlisting after SOAR (BLOCKED IPs ×3). Refuse to benchmark **MTTR** until Case Manager timestamps feed a real calculation; show stakeholders the constant in Executive View screen. Pair **LIVE EPS** drops with Monitor → Pipeline Health, not with "we are safer."
