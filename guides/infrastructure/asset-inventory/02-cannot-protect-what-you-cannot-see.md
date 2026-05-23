---
module: Asset Inventory
sidebar: Infrastructure → Asset Inventory
page: 02-cannot-protect-what-you-cannot-see.md
title: "Why asset inventory is foundational"
last_updated: 2026-05-23
---

# Why asset inventory is foundational

**Sidebar path:** Infrastructure → Asset Inventory

## Why you cannot protect what you cannot see

### What you are looking at

Infrastructure → Asset Inventory renders a split-pane console in Asset Inventory screen. The left pane is a full-width asset table under a cyan **ASSET INVENTORY** header. Four summary counters sit beneath the search box: **TOTAL ASSETS** (always twelve in the demo registry), **AT RISK** (assets with at least one correlated alert), CRITICAL CVEs (assets whose highest CVSS score is 9.0 or above), and **BLOCKED** (assets whose IP appears in the SOAR block list). Filter chips **ALL**, **CRITICAL**, **AT-RISK**, and **CVES** narrow the list; **SORT** buttons reorder by **CRITICALITY**, **RISK**, **ALERTS**, or **CVES**. Each row shows asset name and OS subtitle, type, IP, a criticality bar (1–10), CVE count with max CVSS, alert count (with critical count in red when present), a risk-score progress bar, and a **STATUS** badge in green (**CLEAN**), orange (**AT-RISK**), or red (**COMPROMISED**). Picture a hospital ward list posted at the nurses' station: every bed is labelled with the patient's name, room number, and allergy flags, but the board only helps if every patient is actually on it. A patient wheeled in through the side door and never registered is invisible to triage. Asset Inventory exists because security teams face the same problem, you cannot patch, monitor, or isolate a server the SOC does not know exists.

### What is happening underneath

The table reads from a static `ASSETS` array in the static asset registry, twelve predefined production, dev, and infrastructure hosts (`PROD-DC-01`, `PROD-DB-01`, `PROD-WEB-01`, and so on). On every render, a `useMemo` hook enriches each asset by cross-referencing the live `alerts` array and `blockedIps` set from the SIEM context pipeline. An alert links to an asset when `alert.sourceIp === asset.ip`, `alert.destIp === asset.ip`, or when `alert.host.name` partially matches the asset name (case-insensitive). The component computes `riskScore` as `min(100, criticality × 6 + criticalAlerts × 8 + highAlerts × 4 + maxCvss × 2)` and derives **STATUS**: zero alerts means clean; any alert with at least one critical severity means compromised; otherwise at-risk. CVE metadata resolves through `CVE_DB`, a subset map keyed by CVE ID with CVSS scores and human-readable names. Nothing in this view writes back to the database, it is a read-only lens over static inventory plus dynamic alert state.

> **Technical note:** Asset enrichment recomputes whenever alerts or blocked IPs change. There is no WebSocket or polling specific to Asset Inventory; alert updates from log ingestion or **Simulate Campaign** propagate through the SIEM context pipeline re-renders.

### Why this matters

Attackers do not respect network diagrams. They exploit the forgotten dev server, the contractor laptop on guest Wi-Fi, or the S3 bucket never added to the CMDB. When an analyst sees a brute-force spike on Overview, the first question is "what did they hit?" Without asset context, every IP looks equally urgent. Asset Inventory answers the prioritisation question: a critical alert against `PROD-DC-01` (criticality 10, domain controller) demands immediate escalation; the same alert against `DEV-WEB-01` (criticality 3, sandbox) may follow a different playbook. Visibility is the prerequisite for proportionate response, compliance evidence, and patch prioritisation.

### Step-by-step walkthrough

1. Sign in and open Infrastructure → Asset Inventory in the sidebar (global header routes to `AssetInventory`).
2. Read the four header counters to establish posture: note **AT RISK** and CRITICAL CVEs before drilling into rows.
3. If the table shows zero **AT RISK** assets, run Simulate Campaign on Monitor → Overview or ingest logs via Ingest → Log Ingestion to generate alert-to-asset correlations.
4. Click **CRITICAL** filter to show only assets with `criticality >= 9`; domain controllers, VPN gateway, SIEM host, and database servers in the demo data.
5. Click **AT-RISK** to isolate assets with active alert correlations; sort by **ALERTS** descending to find the noisiest targets.
6. Use the search box to find an asset by name (`PROD-WEB`), IP fragment (`10.0.0.20`), or type (`Database`).
7. Click a row to open the 300px **ASSET DETAIL** panel on the right; review IP, criticality label, risk score, alert count, status, tags, and KNOWN CVEs cards.
8. Cross-reference a **COMPROMISED** asset with Monitor → Overview alert feed filtered by that IP, then pivot to Respond → SOAR Console if the IP should be blocked.
9. Click **CVES** filter and sort by **CVES** to prioritise patch candidates like `PROD-WEB-01` carrying Log4Shell (CVE-2021-44228, CVSS 10).
10. Close the detail panel with **Remove** and return to the full list for comparative triage.

### Common questions

#### If TOTAL ASSETS is always twelve, does this scale to our real environment?

The demo ships a curated static registry in the static asset registry to teach asset-aware triage without requiring a live CMDB integration. In production deployments, the same UI pattern would hydrate from an API feed. Active Directory, ServiceNow CMDB, cloud asset APIs, or agent-based discovery. The enrichment logic (alert correlation, risk scoring, CVE lookup) remains identical; only the data source changes. Treat the twelve-asset cap as a lab constraint, not an architectural limit.

#### Why does an asset show AT-RISK when I cannot find alerts for its IP in the feed?

Alert-to-asset matching uses three paths: `sourceIp`, `destIp`, and fuzzy `host.name` matching. An alert whose `destIp` is `10.0.0.10` links to `PROD-DB-01` even if the feed row prominently displays a different field. Simulated campaign logs may also reference internal IPs that map to registry entries. Always check both source and destination columns in Alert Detail when reconciling counts.

#### What is the difference between CRITICALITY and risk score?

Criticality is a static business attribute (1–10) assigned at registration time; it reflects how much damage loss of that asset would cause. Risk score (0–100) is dynamic: it blends criticality, live alert severities, and maximum CVE CVSS. A low-criticality dev box with Log4Shell and five high alerts can outscore a criticality-10 asset with zero alerts. Use criticality for business context; use risk score for immediate SOC prioritisation.

#### Can I add or edit assets from this screen?

Not in the current HABIBI-SIEM build. The registry is defined in the static asset registry and requires a code or API change to extend. The UI is intentionally read-only so analysts focus on triage rather than CMDB administration. For lab exercises, add entries to `ASSETS` and corresponding CVE IDs to `CVE_DB`.

### How an analyst uses this during active incident

During an active incident, the analyst opens Asset Inventory immediately after confirming alert volume on Overview. They filter **AT-RISK**, sort by **RISK**, and identify whether the attack touches crown-jewel assets (`PROD-DC-01`, `PROD-DB-01`, `PROD-VPN-GW`). A **COMPROMISED** badge on the domain controller triggers executive notification regardless of total alert count. They open **ASSET DETAIL** to read CVE exposure, an attacker on `PROD-WEB-01` with CVE-2021-44228 and CVE-2023-44487 suggests web-tier exploit chains. They note **BLOCKED** count: if the attacking IP is blocked but the asset remains **AT-RISK**, internal lateral movement may be underway. They screenshot the detail panel for the incident case record in Respond → Case Manager.

### Edge cases and gotchas

Internal IPs (`10.x`, `172.16.x`, `192.168.x`) dominate the demo registry; external attacker IPs from alerts will not appear as assets unless you add them. **HOST** name matching is substring-based and can produce false links if log hostnames are generic (`web-server` matching `PROD-WEB-01`). Assets with empty `cves` arrays show an em dash in the CVE column; absence of listed CVEs does not mean the host is patch-current. **BLOCKED** reflects SOAR block-list membership for the asset's own IP, not whether inbound attackers targeting it are blocked. Status **COMPROMISED** requires a critical-severity alert correlation; high-only alerts yield **AT-RISK**, not compromised.
