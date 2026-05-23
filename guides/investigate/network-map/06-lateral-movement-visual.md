---
module: Network Map
sidebar: Investigate → Network Map
section: Investigate
subsection: Lateral movement on the Network Map
last_updated: 2026-05-23
---

# Lateral movement on the network map

**Sidebar path:** Investigate → Network Map

![Network Map main view](../../../screenshots/guides/investigate-network-map.png)

### What you are looking at

True lateral movement (host A → host B inside the network) is not drawn as inter-host edges in this map, only source-to-server spokes. Proxy indicators: an **INTERNAL** node with high alert count, multiple event type tags, active incident ping, and high threat score. Compare multiple internal nodes elevated simultaneously.

### What is happening underneath

Lateral movement detection in enterprise SIEMs correlates authentication logs, remote service startup, and east-west firewall denies. Here, `selectedNode.events` collects all `eventType` strings from alerts for that IP. `[...new Set(selectedNode.events)]` renders unique tags. `selectedIncidents` filters `incidents` where `sourceIp` matches. Multiple event types on one internal IP (auth-failure + db-query + port-scan) suggest staged behaviour.

### Why this matters

Lateral movement is how ransomware spreads, patient zero is rarely the only compromised host. Even a server-centric map can hint at pivoting internal sources lighting up. Analysts must know this map's limitation (no east-west edges) and pivot to Event Graph or Attack Timeline for path reconstruction.

### Step-by-step walkthrough

1. Filter **INTERNAL** nodes.
2. Click highest-count internal node.
3. Read **EVENT TYPES** tags; count distinct types.
4. Check **INCIDENTS** section for active status.
5. Note threat score: internal + high score is suspicious.
6. Open Investigate → Event Graph; drag same IP and related alerts.
7. Open Monitor → Attack Timeline for chronological kill chain view.

### Common questions

#### Why can't I see A→B connections?

Data model aggregates alert sources to server hub only. NetFlow east-west requires separate ingest and visualisation not implemented in this lab.

#### What lateral movement signs CAN I see?

Internal IP with rising alert count, diverse event types, active incident flag, critical/high top severity, elevated threat score despite internal classification.

#### How does this relate to attack timeline?

Timeline shows kill chain phases over time. Network Map shows source severity snapshot. Use both, map for "who," timeline for "when and what stage."

#### What should I do if internal node pulses?

Treat as containment priority; isolate host via EDR playbook, escalate incident severity, hunt for same username in **UEBA**.

### What analysts do when the pager fires

Ransomware playbooks: after external initial access, filter **INTERNAL** watching for new nodes appearing mid-incident. Event type diversity triggers lateral movement hypothesis. Map drives containment priority order alongside **TOP ATTACKERS** external list.

### Edge cases and gotchas

Jump boxes and admin workstations generate noisy internal alerts without malicious lateral movement; correlate with UEBA user context. Single event type internal noise (patch server reboots) mimics less danger than mixed types. Active incident ping requires incident record; not auto-created for all alert clusters.

### When to leave the map for other modules

The map cannot show east-west paths, when **INTERNAL** filter reveals multiple high-count nodes with diverse **EVENT TYPES** tags, pivot within five minutes to Monitor → Attack Timeline for kill-chain phasing and Investigate → Event Graph for relationship documentation. Network Map answers "which internal sources are hot?"; Timeline answers "in what order did events occur?"; Graph answers "how do we believe they connect?" Treat the map as triage radar, not forensic reconstruction.

### Communicating lateral movement on the network map to leadership and engineering

For board conversations, frame Investigate → Network Map numbers as risk to revenue and reputation. For engineering reviews, reference the component file and `the SIEM context pipeline` fields listed in the walkthrough. Keep artefacts: PNG exports beat memory.

### Who should read which sections

Operators should rely on visible labels, colour cues, and the numbered walkthrough. Confirm field names in the UI match hunt and graph queries, and treat this lab build as a subset of enterprise SIEM capability.

#### What is the elevator pitch for lateral movement on the network map when briefing the board?

Use Investigate → Network Map as a prop, not a tutorial. Highlight the top three labelled fields that changed since yesterday. Explain customer or revenue exposure in plain language. Request only the decision you need today. Document the screen with timestamp for the minutes.

#### Which code paths should engineers check when changing lateral movement on the network map?

Maintainers: open DevTools, compare network payloads to the field names cited here, and ensure RBAC gates still match Settings → RBAC. Document any intentional drift between demo data and production schemas in the technical note block.

#### What should newcomers avoid on this view?

Assuming empty or quiet means safe. Verify ingestion in Pipeline Health and rule hits on Overview before telling stakeholders the environment is clean.
