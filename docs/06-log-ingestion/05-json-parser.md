# JSON log parser

Accepts JSON log arrays or NDJSON; maps common field names to the internal schema.

Log ingestion in HABIBI-SIEM accepts many vendor formats. The **json** path handles Generic JSON lines from applications with ad-hoc field names.

## Why this format matters

Security teams still receive huge volumes of json text from legacy systems. Supporting paste-and-parse in the dashboard lets analysts prove detection logic before investing in heavy collectors.

## Normalized output shape

Each parsed line becomes an event with timestamp, source address, action or message, optional HTTP or auth fields, and a format tag. Severity may be inferred from status codes, syslog priority, vendor severity, or Windows level names depending on format.

## Detection interaction

Heuristic column mapping for src_ip, user, action; ECS-shaped JSON passes through richer fields when detected.

Rules such as brute force, SQL injection, and sensitive path access consume these normalized fields. Wrong format selection mislabels fields and rules stay silent even when raw text obviously looks malicious.

## Validation and preview

The Log Ingestion screen shows detected format, row counts, and preview table before commit. Operators should fix detection format before bulk paste when stats show unknown or zero rows.

## Operational notes

Auto-detect examines the first non-empty line; mixed files should be split. Re-ingest after installing geo data to backfill country columns on external IPs. Large pastes may stress browser memory; batch by thousand lines in weak VMs.

## Edge cases

Local RFC1918 addresses skip geo. Malformed JSON lines are skipped with error tallies in pipeline health. CEF without extension keys still parses header severity but may lack IP until extensions include src.

## Related guides

- [Log ingestion index](../../guides/ingest-config/log-ingestion/05-parsing-grok.md)
- [Ingestion pipeline end to end](../../guides/ingest-config/log-ingestion/02-ingestion-pipeline-end-to-end.md)
- [Parsers overview](01-parsers-overview.md)
- [Troubleshooting empty dashboards](../09-operations/08-troubleshooting.md)

## Shift handoff checklist

Before ending a lab session, record which account role was active, whether deduplication was on, and the last ingest batch size. Screenshot Overview KPIs if coursework requires evidence. If students report empty views, ask whether they refreshed after Simulate Campaign and whether filters hide new alerts. When promoting from tier1 to tier2 accounts, log out fully so cookies do not blend roles.

## Coordination with other modules

Cross-link findings in Case Manager or Incident views when drills span multiple screens. Threat Intel and Geo Map should tell the same story about an IP before watchlist blocking. Pipeline Health confirms whether zeros are detection silence or ingest failure. For security sign-off, pair this topic with CSRF and RBAC docs before external exposure.
