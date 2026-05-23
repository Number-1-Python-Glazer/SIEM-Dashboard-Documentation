---
module: Event Graph
sidebar: Investigate → Event Graph
section: Investigate
subsection: Pivoting from Event Graph to raw logs
last_updated: 2026-05-23
---

# Pivoting from event graph to raw logs

**Sidebar path:** Investigate → Event Graph

![Event Graph main view](../../../screenshots/guides/investigate-event-graph.png)

### What you are looking at

Event Graph has no embedded link to raw logs, but **NODE DETAIL** exposes every normalised field (sourceIp, eventType, severity, timestamp, url, port, status, etc.) needed to pivot manually. The footer keyboard help and three-panel layout mirror other Investigate modules (Threat Hunt query panel, Network Map detail panel) for consistent analyst muscle memory.

### What is happening underneath

Pivot workflow is cross-module navigation in the same React SPA, sharing `the SIEM context pipeline`. Copy `sourceIp` from **NODE DETAIL** → open Investigate → Threat Hunt → add condition `sourceIp contains <value>`. Or open Network Map to see that IP's network position. Or Geo Map for geolocation. Raw log lines live in Monitor → Live Feed (Live Feed screen), search by IP or timestamp from node detail values. No automatic deep-link exists; field values are the bridge.

### Why this matters

Graphs summarise; logs prove. Every edge label in your graph should be verifiable against underlying events. Pivot discipline prevents graph fantasies, relationships without log evidence get downgraded from **CAUSED BY** to **RELATES TO** or removed. This mirrors professional IR: hypothesis on the whiteboard, evidence in the log platform.

### Step-by-step walkthrough

1. Select an alert node; note `sourceIp` and `timestamp` in **NODE DETAIL**.
2. Navigate to Investigate → Threat Hunt.
3. Add rules: `sourceIp equals <ip>` AND `severity in high,critical`.
4. Review matching rows; click a result for **ALERT DETAIL**.
5. Navigate to Monitor → Live Feed; search the same IP for raw log context.
6. Return to Event Graph; update edge labels or add **NOTE** nodes with findings.
7. If IP is external, check Investigate → Geo Map for country and impossible travel flags.

### Common questions

#### Is there a "view raw logs" button on graph nodes?

No. Use field values from **NODE DETAIL** to search Live Feed manually. Production SIEMs add pivot buttons; this lab expects cross-module navigation.

#### Can I drag from threat hunt directly onto the graph?

No. Threat Hunt and Event Graph are separate views. Identify alerts in Threat Hunt, then find them in the Event Graph **ALERTS** sidebar (last 30 only, timing matters).

#### How do I link graph work to an incident case?

Document the graph in Respond → Case Manager or Respond → Incidents notes. The graph itself is not persisted to cases automatically.

#### Does network map show the same IPs as my graph?

Yes; both read `alerts` from the SIEM context pipeline. Network Map auto-aggregates all source IPs; Event Graph shows your selected subset on the canvas.

### Using this view during live response

The analyst maintains a pivot loop: graph hypothesis → Threat Hunt verification → Live Feed proof → graph update. Every fifteen minutes during active IR, they validate one edge label against logs. When Threat Hunt returns unexpected results, they add **NOTE** nodes documenting the discrepancy. Geo Map and Network Map provide enrichment pivots without leaving the SIEM.

### Edge cases and gotchas

The **ALERTS** sidebar shows only 30 recent alerts; pivots to older events require Alert Manager first. Timestamp format differs: Event Graph **NODE DETAIL** uses `toLocaleString()`, Threat Hunt table uses `toLocaleTimeString()`. Switching modules does not save graph layout; return quickly or screenshot. Simulated data may not include full raw log payloads for every alert field.

### End-to-end investigation chain example

A complete pivot chain for alert ID visible in **NODE DETAIL**: (1) Graph node confirms sourceIp 203.0.113.45 and eventType auth-failure. (2) Threat Hunt: `sourceIp equals 203.0.113.45` **AND** `eventType equals auth-failure`, quantifies campaign length via result count. (3) Network Map: click IP node; threat score and event type tags. (4) Geo Map: locate IP country for block approval documentation. (5) UEBA: if username field populated, check anomaly score for credential compromise. (6) Live Feed: raw log lines for legal hold export. (7) Return to graph; add **NOTE** node summarising pivot findings and **RELATES TO** edges to new nodes discovered. Each pivot should update edge labels from **RELATES TO** (suspected) to **CAUSED BY** (proven) as evidence hardens.

### Communicating pivoting workflow to leadership and engineering

Executives want impact and cost; developers want schema and file paths. Treat these one-line phrases as starting points and adapt to the meeting in the room. On Investigate → Event Graph, read labels aloud from the UI and record them in case notes when legal may review the incident.

### Reading paths for analysts and engineers

This page keeps UI strings explicit so operators can follow the walkthrough without guessing field names.
