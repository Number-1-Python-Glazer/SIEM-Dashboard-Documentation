---
module: Attack Timeline
sidebar: Monitor → Timeline
section: Monitor
subsection: How the timeline helps a non-technical manager
last_updated: 2026-05-23
---

# How the timeline helps a non-technical manager

**Part of:** Monitor → Attack Timeline
**One-sentence focus:** Filtered Timeline screenshots plus plain-language narration give executives plot, peak, and ongoing status without log syntax.

### What you are looking at

Executive-friendly artefacts: full-window Timeline screenshot, **SEVERITY BREAKDOWN** percentages, **INCIDENT BANDS** time ranges in plain clock times, selected event panel fields without log parser syntax. Managers need the movie plot, not the screenplay draft, who attacked, when, how bad, is it ongoing. Timeline supplies plot spine when analyst narrates lanes and bands.

### What is happening underneath

Export is manual screenshot, no built-in PDF timeline export in v4 (spec aspirational). Manager reads localised tick times and incident `firstSeen → lastSeen` formatted via `toLocaleTimeString()`. Simulated campaigns produce clean demo arcs for board dry-runs.

### Why this matters

Technical jargon loses boards; visual timeline + plain language builds funding case for SOC tooling and headcount.

### Step-by-step walkthrough

1. Filter **SEV: CRITICAL** and **HIGH** for executive clarity.
2. Choose **WINDOW** covering entire incident.
3. **GROUP: IP** if single attacker story; **RULE** if technique story.
4. Hide empty lanes by severity filter before screenshot.
5. Prepare three sentences: start time, peak activity, current state (dots vs NOW line).
6. Attach Overview **GEN REPORT** text supplement.
7. Archive PNG in case folder.

### Common questions

#### Can I export timeline automatically?

Not implemented, use OS screenshot or browser devtools capture.

#### Will managers misread dots?

Provide legend: colour = severity, horizontal = time, lane = attacker IP or technique.

#### Should I show simulated timeline to board?

Only labelled as exercise; **SIM** badges on alerts if they open detail.

#### What if incident is ongoing?

Point at **NOW** line vs latest dots; distance indicates recency.

### Operational use during containment

Pauses external comms until Timeline screenshot approved by incident commander; reduces contradictory messaging.

### Edge cases and gotchas

Dense lanes overwhelm executives, simplify filters aggressively. Local timezone in labels must be stated in email caption.
