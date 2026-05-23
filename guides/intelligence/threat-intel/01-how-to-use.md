# Threat Intelligence

**Sidebar:** Intelligence → Threat Intel

Aggregates IP reputation scores, alert counts, and severity roll-ups for every external address observed in your alert pipeline. Analysts use it to prioritise which sources to block, escalate, or enrich.

## Steps

1. Sign in as manager or analyst2 (write access helps for follow-up SOAR actions).
2. From the left sidebar, open Intelligence → Threat Intel.
3. If the view is empty, open Monitor → Overview and run Simulate Campaign, or add logs under Log Ingestion.
4. Return to Threat Intel. KPI tiles show IPs TRACKED, **CRITICAL RISK**, **HIGH RISK**, and **KNOWN BAD** counts.
5. Review **EXTERNAL THREATS** cards: each displays country, ISP, alert count, top severity, and a 0–100 reputation score with colour-coded risk band.
6. Compare high-score IPs against Alert Manager and SOAR Console to decide on watchlist blocks or case creation.
7. Toggle layout modes from the top bar (Normal / Brute-force tint) when reviewing credential-stuffing campaigns.

## Screenshots

![Threat Intelligence main view](../../../screenshots/guides/intelligence-threat-intel.png)

## When the view looks empty

Most modules depend on alerts existing in the current session. From Overview, run **Simulate Campaign**, or paste a sample under Ingest → Log Ingestion, then return here. Refresh once if tiles stay at zero.

## Roles

Read-only analysts can explore visuals but may see 403 on SOAR or watchlist actions. Use analyst2 or manager accounts when the lab requires writes.

## Where to read more

Open the module INDEX in this folder for long-form pages on each button and metric. Security-wide behavior (CSRF, sessions) is described under docs/08-security.
