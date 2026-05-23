---
module: Event Graph
sidebar: Investigate → Event Graph
section: Investigate
subsection: How the Event Graph is built from raw logs
last_updated: 2026-05-23
---

# How the event graph is built from raw logs

**Sidebar path:** Investigate → Event Graph

![Event Graph main view](../../../screenshots/guides/investigate-event-graph.png)

### What you are looking at

The left sidebar is your palette of normalised entities extracted from the log pipeline. Each card is a preview of what the parser and rules engine already produced. The canvas is where you assemble those previews into an investigation-specific narrative. The toolbar counter (`N NODES · N EDGES · N%`) reflects your workspace, not global system state.

### What is happening underneath

Unlike enterprise SIEM entity graphs that auto-materialise from streaming correlation, this Event Graph is a manual composition layer atop normalised alert data. The pipeline is: raw log → ingest/parser → detection rule evaluation → alert object in SQLite → `the SIEM context pipeline.alerts` → sidebar list item → analyst drag → canvas node. The graph itself adds no new data, it reuses existing alert, rule, and incident records and lets the analyst impose structure. `topIPs` recomputes on every alert change, counting `sourceIp` frequency. The last 30 alerts (`alerts.slice(-30).reverse()`) populate the sidebar, a performance-conscious window, not the full history.

> **Technical note:** A raw syslog line like `Failed password for root from 203.0.113.45` becomes fields `{ sourceIp: '203.0.113.45', eventType: 'auth-failure', severity: 'high',... }` before it ever reaches the graph. The graph never reads raw logs directly, only normalised alert/incident/rule objects.

### Why this matters

Automatic correlation is but opaque; analysts need a workspace where *they* control the narrative. Manual graph building mirrors physical war-room whiteboards. It also teaches which entities matter: if you cannot meaningfully connect two nodes, perhaps they are unrelated alerts grouped by coincidence. The discipline of deliberate graph construction reduces false escalation.

### Step-by-step walkthrough

1. Ensure data exists: run Simulate Campaign or ingest logs.
2. Open Investigate → Threat Hunt to identify interesting alerts by query.
3. Return to Event Graph; those alerts appear in the **ALERTS** sidebar tab.
4. Drag relevant entities onto the canvas in order of discovery.
5. Connect them with labelled edges documenting your correlation logic.
6. Use **NODE DETAIL** to verify raw field values match your hypothesis.
7. Add **NOTE** nodes for correlation decisions not captured by edges.

### Common questions

#### Why doesn't the graph auto-populate like splunk?

This is a college lab dashboard prioritising interactive learning over backend graph databases. Auto-correlation requires entity extraction pipelines, graph storage (Neo4j, etc.), and significant compute. Manual building teaches the *same analytical thinking* without infrastructure complexity.

#### Where do the sidebar items come from?

Alerts from `the SIEM context pipeline.alerts`, rules from `the SIEM context pipeline.rules`, incidents from `the SIEM context pipeline.incidents`, IPs aggregated from alert source IPs. All originate from the SQLite-backed ingest and rules pipeline.

#### Will new alerts appear automatically on the canvas?

No; only in the sidebar list. Canvas nodes are snapshots from when you dragged them. Refresh the sidebar by switching tabs; re-drag to add new alerts.

#### How does this relate to the correlation builder?

Configure → Correlation Builder defines automated multi-event rules. Event Graph is the manual counterpart for ad-hoc investigation of alerts those rules (or other rules) already created.

### What analysts do when the pager fires

The analyst treats the sidebar as a evidence tray and the canvas as the working theory. Each drag is a deliberate act: "this alert matters." Each edge is a claim: "these are related because…" When new alerts arrive mid-incident, the analyst scans the **ALERTS** tab, drags newcomers, and extends the graph; the correlation engine is the analyst's brain, supported by normalised fields in **NODE DETAIL**.

### Edge cases and gotchas

The 30-alert sidebar window may hide older related alerts, cross-reference Threat Hunt or Alert Manager for historical context. Simulated campaign data resets on page refresh depending on session state. Graph state is not shared between analysts; no multi-user collaboration. Very large graphs (50+ nodes) slow manual pan/zoom; use **AUTO LAYOUT** and severity filtering in other modules first.

### Field-level normalisation walkthrough

Consider a simulated auth-failure alert. The raw ingest payload might contain `{ "message": "Failed password for admin", "src": "203.0.113.45", "port": 22 }`. The parser normalises to `sourceIp: "203.0.113.45"`, `eventType: "auth-failure"`, `severity: "high"`, `port: 22`, `status: "new"`. When you drag this alert onto the canvas, all those fields appear in **NODE DETAIL** but the node face shows only sourceIp, eventType, and severity badge; progressive disclosure keeps the graph readable while preserving depth on selection. IP sidebar cards aggregate before drag: the same IP appearing in twenty alerts shows "20 alerts" on the purple card, teaching you to place one IP hub rather than twenty duplicate IP nodes unless each represents a distinct hypothesis. The incidents sidebar maps to **EVENT** node type because incidents in the SIEM context pipeline are escalation containers. `alertCount`, `status`, `ruleNames`, not single log lines. Dragging an incident creates an orange node qualitatively different from cyan alert nodes even when they share the same `sourceIp`.
