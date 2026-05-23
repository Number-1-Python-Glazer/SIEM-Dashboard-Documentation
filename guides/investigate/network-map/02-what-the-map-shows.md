---
module: Network Map
sidebar: Investigate → Network Map
section: Investigate
subsection: What is being shown on the Network Map
last_updated: 2026-05-23
---

# What is being shown on the network map

**Sidebar path:** Investigate → Network Map

![Network Map main view](../../../screenshots/guides/investigate-network-map.png)

### What you are looking at

Network Map renders a hub-and-spoke SVG topology inside a green terminal-themed panel (`terminal-panel border-glow`). A central **SERVER** node (concentric green circles, label **PROTECTED**) sits at the canvas centre. Source IP nodes arrange in a ring around it, sized by alert volume and coloured by top severity (critical red, high orange, medium yellow, low/clean cyan-blue). Dashed lines connect each IP to the server. A filter bar shows **VIEW:** with buttons **ALL NODES**, **CRITICAL**, **HIGH+**, **EXTERNAL**, **INTERNAL**, plus a colour legend. The right sidebar contains three panels: // MAP STATS, // NODE DETAIL (or "CLICK A NODE TO VIEW DETAILS"), and // TOP ATTACKERS. The bottom-left corner of the SVG reads `{N} NODES TRACKED`.

### What is happening underneath

Network Map screen aggregates `alerts` by `sourceIp` into `ipMap` objects tracking count, top severity, and event type list. Node positions use polar coordinates: angle `(i / list.length) * 2π - π/2`, radius `180 + (count/maxCount) * 60`. Node radius scales `8 + (count/maxCount) * 18`. `threatScores` from the SIEM context pipeline (built by `buildThreatScores` in the threat intelligence module) adds a 0–100 score per IP. `isInternal()` classifies RFC1918 ranges. Active incidents (`inc.status === 'active'`) trigger brighter connection lines and animated ping rings.

> **Technical note:** Canvas is fixed 900×560 viewBox. This is not a full network topology map of internal asset-to-asset traffic, it is an attack-source radial map centred on the defended server.

### Why this matters

Organisations often believe their network looks like tidy VLAN diagrams. Under attack, the reality is a starburst of external IPs hammering public-facing services. This view makes that reality immediate, big red nodes close to centre are high-volume critical threats. Executives understand "dots hitting our server" without reading firewall ACLs.

### Step-by-step walkthrough

1. Open Investigate → Network Map after ingesting or simulating data.
2. Observe the central **SERVER** node and surrounding IP nodes.
3. Read // MAP STATS for totals: nodes, critical/high counts, external IPs, active incidents.
4. Click a large red node; // NODE DETAIL populates on the right.
5. Try filter **CRITICAL**: only critical-severity source IPs remain.
6. Click // TOP ATTACKERS list entries to jump to those nodes.
7. Toggle **EXTERNAL** vs **INTERNAL** to compare threat origins.

### Common questions

#### Is this my entire corporate network?

No. It shows every source IP seen in alerts, positioned radially around a symbolic protected server; not every switch, VLAN, or workstation. Think "who is attacking us" not "complete network inventory."

#### Why is everything connected to one server?

The lab models a single defended asset (your SIEM-monitored server). Lines represent "this IP generated alerts targeting/probing protected infrastructure." Enterprise NetFlow maps show many-to-many internal paths.

#### What do node sizes mean?

Larger radius = more alerts from that IP (`count / maxCount` scaling). A small node can still be critical severity, check colour, not just size.

#### Why terminal green styling?

Network Map uses the matrix/hacker aesthetic (`text-matrix`, `border-matrix`) distinct from other Investigate modules; visual cue that this is infrastructure topology thinking.

### Using this view during live response

First sixty seconds: glance // MAP STATS for active incident count and critical source count. Click the largest **TOP ATTACKERS** entry. Read threat score bar and event type tags. If multiple critical nodes appear, the incident is distributed; not a single attacker. Filter **EXTERNAL** to focus firewall block candidates.

### Edge cases and gotchas

Empty map shows NO NODES MATCH FILTER. START INGESTION TO POPULATE MAP. Single-IP datasets still render one spoke. NAT concentrates many hosts into one node; high count does not always mean one attacker.

### Reading the radial layout as an executive briefing artefact

The central **SERVER** / **PROTECTED** node represents your SIEM-monitored defended asset, not necessarily a single physical server but the logical protection boundary of this lab environment. Spoke length varies with alert volume: higher-count IPs sit farther from centre (radius up to 240px) creating a visual "pressure" metaphor; heavy attackers pushed outward but still tethered by connection lines. The label **N NODES TRACKED** counts unique source IPs in the current unfiltered dataset, while filter buttons subset that count without changing // MAP STATS totals on the right; stats always reflect full `nodes` array, filtered view reflects `filtered` array. When briefing non-technical leadership, point to pulsing rings first (active incidents), then largest red nodes, then // TOP ATTACKERS; three layers of narrative without mentioning SVG or JavaScript. The matrix-green aesthetic (`terminal-panel`, `text-matrix`) signals infrastructure context distinct from cyan-themed Threat Hunt, training analysts to context-switch visual language when moving between modules during the same incident.

### Communicating what the map shows to leadership and engineering

When executives ask what the screen means for the organisation, translate visible counters into outcomes: data exposure, service disruption, notification timelines, and customer trust. Skip tool jargon; cite specific counts, timestamps, and named fields on Investigate → Network Map. When engineers ask about data lineage, answer: SQLite-backed ingest through `the SIEM context pipeline`, normalised in the parser layer, rendered in React client state refreshed on ingest and Simulate Campaign. Capture the view with stat counters visible for audit evidence; verbal summaries alone rarely satisfy compliance reviews.

### Reading paths for analysts and engineers

This page keeps UI strings explicit so operators can follow the walkthrough without guessing field names.
