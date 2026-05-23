---
module: Geo Map
sidebar: Investigate → Geo Map
section: Investigate
subsection: What the Geo Map shows
last_updated: 2026-05-23
---

# What the geo map shows

**Sidebar path:** Investigate → Geo Map

![Geo Map main view](../../../screenshots/guides/investigate-geo-map.png)

### What you are looking at

Each external source node is a circle positioned by `latLonToXY(geo.lat, geo.lon)` projecting to `MAP_W` × `MAP_H` canvas. Radius scales `min(4 + log2(count+1)*2, 12)`, more alerts = larger dot. Colour encodes max severity across alerts from that IP: critical red `#ff2d55`, high orange, medium yellow, low green. Blocked IPs turn grey `#5a7080` at 40% opacity with red horizontal strike line. Animated arc particles travel along cubic Bézier curves from source toward **HQ** unless blocked.

### What is happening underneath

`geoPoints` deduplicates alerts by IP, aggregating count, severities array, timestamps, blocked flag from `blockedIps` Set in context. `maxSev` resolves highest severity present. Arc animation phase: `((tick * 0.02) + p.x / 100) % 1` drives particle position via linear interpolation with sine vertical offset. Hover state enlarges with translucent outer ring and IP text label.

### Why this matters

Encoding volume (size), severity (colour), and block status (grey/strike) in one glyph enables triage without reading tables. Animated arcs communicate directionality, inbound toward HQ, that static dots lack. Blocked sources still visible but visually de-emphasised; you see what you've already acted on.

### Step-by-step walkthrough

1. Identify largest red node: highest severity + volume candidate.
2. Compare node in **ALL** vs **CRITICAL** filter; confirms severity encoding.
3. Cross-reference **BLOCKED** filter, grey struck nodes should appear.
4. Watch arc animation direction; particles flow toward **HQ** marker.
5. Hover several nodes: confirm IP tooltip matches **TOP ATTACKERS** list.
6. Select node; verify Alerts count matches visual size intuition.
7. Note blocked status in detail panel matches grey styling.

### Common questions

#### What does dot size mean?

More alerts from that IP produce a larger radius (log-scaled). A tiny red dot is still critical, do not ignore by size alone.

#### Why do some arcs have no moving particle?

Blocked IPs suppress the animated circle (`!p.blocked` guard); static dashed arc only.

#### What is the HQ marker?

Your organisation's defended location; hardcoded `HOME = { lat: 40.7, lon: -74.0, city: 'HQ' }`. Production deployments would configure actual HQ coordinates in Settings.

#### Do arcs represent actual packet paths?

No; illustrative inbound attack vectors, not traceroute. Real routing varies; arcs show logical threat direction toward your perimeter.

### Analyst workflow under pressure

Distributed scan: many medium dots across continents. Targeted attack: one large dot with dense arcs. Analyst prioritises unblocked critical nodes, compares blocked grey nodes to verify containment coverage gaps.

### Edge cases and gotchas

Overlapping nodes in same city hide each other, use list panel. Countries with few alerts may lack visible nodes until zoom/hover. Severity colour uses max across alerts; one critical among many lows still red.

### Animation semantics for leadership demos

Arc particle animation uses `requestAnimationFrame` tick counter; not event replay speed. Particles flowing toward **HQ** illustrate inbound threat direction for stakeholder demos without implying measured packet travel time. Blocked sources (`blockedIps.has(ip)`) render grey arcs without moving particles; visual "already handled" state. Node hover reveals IP label; click opens **IP DETAIL** with Country, City, Severity, Alerts, Blocked fields, sufficient for first-pass geo triage without Threat Intel module.

### Communicating geo map visual elements to leadership and engineering

For board conversations, frame Investigate → Geo Map numbers as risk to revenue and reputation. For engineering reviews, reference the component file and `the SIEM context pipeline` fields listed in the walkthrough. Keep artefacts: PNG exports beat memory.

### Reading paths for analysts and engineers

Use the walkthrough if you run the SOC; use the source tree if you ship the code. Both paths describe the same Investigate → Geo Map behaviour at different altitudes.

#### How can you frame geo map visual elements for a steering committee in two minutes?

When leadership asks about Geo Map visual elements, open Investigate → Geo Map and read the visible KPIs aloud. Tie each number to an owner and a deadline. Separate confirmed incidents from suspected noise. Ask for one resource decision rather than open-ended concern.

#### Which code paths should engineers check when changing geo map visual elements?

Treat this page as a contract test: every **LABEL** in prose should appear on screen or in derived state. Confirm API routes feeding Investigate → Geo Map match appendix endpoint docs. If geo, graph, or hunt pivots break, inspect shared normalisation first.

#### What tripping point catches first-time users?

Treating visual intensity (colour, size, score) as absolute proof rather than relative prioritisation within the current dataset. Cross-check with a second module (Threat Hunt counts, Event Graph relationships, or Live Feed raw lines) before containment. A second frequent error is acting on session-only state (unsaved graphs, unsaved hunts, uncaptured heatmap focus) and losing context on refresh; screenshot or case-note artefacts before navigating away.
