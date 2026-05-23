---
module: Geo Map
sidebar: Investigate → Geo Map
section: Investigate
subsection: Using the Geo Map during a DDoS
last_updated: 2026-05-23
---

# Using the geo map during a DDoS

**Sidebar path:** Investigate → Geo Map

![Geo Map main view](../../../screenshots/guides/investigate-geo-map.png)

### What you are looking at

DDoS pattern on this map: many nodes across multiple continents, medium/low severity colours, high **EXTERNAL SOURCES** and **COUNTRIES** stats, numerous animated arcs converging on **HQ**, **impossible travel** likely zero (botnet not user logins). **TOP ATTACKERS** may show relatively even counts vs single dominant attacker in targeted attacks.

### What is happening underneath

Volume distributed across IPs prevents single-IP block from stopping attack, each bot contributes few alerts in demo data but many unique sources inflate **EXTERNAL SOURCES**. Arc animation renders per IP, heavy source count increases SVG load. Blocked IPs (`blockedIps`) reduce particle animation but don't remove nodes unless filtered. Geo data informs geographic diversity metrics for SCRUB center upstream reporting.

### Why this matters

DDoS response requires distinguishing volumetric flood (many sources, bandwidth) from application attack (few sources, logic abuse). Geo Map instantly shows geographic spread, critical input for upstream ISP/cloud scrubbing activation and law enforcement notification (though attribution is hard).

### Step-by-step walkthrough

1. Detect **EXTERNAL SOURCES** stat spike vs baseline.
2. Confirm **COUNTRIES** count elevated; distributed indicator.
3. Switch to **CRITICAL**: if empty, may be volume not severity attack.
4. Export mental note: top 5 **TOP ATTACKERS** for upstream block list.
5. Mark confirmed malicious IPs in IOC Watchlist; triggers blocked styling.
6. Toggle **BLOCKED** filter, verify block propagation visually.
7. Coordinate with network team; Geo Map is situational awareness, not mitigation.

### Common questions

#### Can this dashboard stop a DDoS?

No; visualisation only. Mitigation requires upstream rate limiting, scrubbing centers, CDN protection. Map informs scope conversation.

#### Why do DDoS nodes look small?

Per-IP alert count may be low while source count is high; size scales per IP volume, not global flood rate. Trust **EXTERNAL SOURCES** count over dot size.

#### How does geo help firewall rules?

Geographic diversity suggests /24 or ASN blocks ineffective, need upstream help. Concentrated country set may support temporary geo-fencing debate (risky for global businesses).

#### Will blocked IPs disappear from the map?

They turn grey with strike line; **BLOCKED** filter isolates them. **ALL** view keeps them visible as containment record.

### How an analyst uses this during an active incident

During volumetric event, analyst refreshes Geo Map every 5 minutes tracking **EXTERNAL SOURCES** trend. Screenshots for war room. Feeds **TOP ATTACKERS** IPs to network team. Monitors **BLOCKED** stat increasing as watchlist entries propagate. Parallel run Pipeline Health ensuring ingest keeps up with flood.

### Edge cases and gotchas

Application-layer attacks from few IPs look like targeted attack, not DDoS; country stat low. Reflective amplification may show spoofed source geo; inaccurate origins. Map performance degrades with hundreds of animated arcs; toggle impossible travel off to reduce load.

### Coordination with pipeline and response modules

During volumetric events, monitor **EXTERNAL SOURCES** stat alongside Monitor → Pipeline Health, geo diversity with rising ingest latency suggests scrub-center activation threshold. **TOP ATTACKERS** list feeds upstream ACL requests; prioritise by count then verify country in detail panel. Toggle **impossible travel** off during DDoS to reduce SVG render load when botnet login detection is irrelevant. Re-enable after flood subsides for credential attack assessment.

### Communicating geo map during DDoS to leadership and engineering

When executives ask what the screen means for the organisation, translate visible counters into outcomes: data exposure, service disruption, notification timelines, and customer trust. Skip tool jargon; cite specific counts, timestamps, and named fields on Investigate → Geo Map. When engineers ask about data lineage, answer: SQLite-backed ingest through `the SIEM context pipeline`, normalised in the parser layer, rendered in React client state refreshed on ingest and Simulate Campaign. Capture the view with stat counters visible for audit evidence; verbal summaries alone rarely satisfy compliance reviews.

### Reading paths for analysts and engineers

Use the walkthrough if you run the SOC; use the source tree if you ship the code. Both paths describe the same Investigate → Geo Map behaviour at different altitudes.

#### How can you frame geo map during DDoS for a steering committee in two minutes?

Brief the board on Geo Map during DDoS by showing Investigate → Geo Map live. Focus on trend direction, worst-case impact, and cost to respond. If data is sparse, say so and explain what you are doing to populate the view before the next meeting.

#### What should developers verify in the React source for geo map during DDoS?

Treat this page as a contract test: every **LABEL** in prose should appear on screen or in derived state. Confirm API routes feeding Investigate → Geo Map match appendix endpoint docs. If geo, graph, or hunt pivots break, inspect shared normalisation first.

#### What should newcomers avoid on this view?

Treating visual intensity (colour, size, score) as absolute proof rather than relative prioritisation within the current dataset. Cross-check with a second module (Threat Hunt counts, Event Graph relationships, or Live Feed raw lines) before containment. A second frequent error is acting on session-only state (unsaved graphs, unsaved hunts, uncaptured heatmap focus) and losing context on refresh; screenshot or case-note artefacts before navigating away.
