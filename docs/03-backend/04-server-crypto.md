# Server crypto

`server/crypto.js`: AES helpers for encrypting threat API keys stored in the database.

This page documents **server crypto** as implemented in HABIBI-SIEM for coursework and small-team SOC labs.

## Role in the platform

Server crypto sits in the split architecture where the browser runs detection and visualization while the API holds secrets, sessions, and SQLite persistence. Understanding this piece prevents misconfigured labs and false bug reports during demos.

## Behavior summary

Operators interact through the React sidebar modules; changes here affect whether data appears on Overview, whether writes succeed for tier2 analysts, and whether external enrichment returns useful fields. The system favors fail-closed authorization and explicit CSRF on mutating calls.

## Data and security interactions

Session cookies identify the analyst. RBAC middleware checks role before watchlist, SOAR, or admin routes. Rate limits protect threat lookup quotas. Audit entries record sensitive reads for manager accounts when enabled.

## Operational guidance

Document environment variables on the server host for the semester. Rotate default passwords before any network exposure. Take SQLite backups before schema experiments. When something fails, compare API HTTP status, browser network tab, and Pipeline Health counters before reinstalling.

## Edge cases

Mixed localhost and 127.0.0.1 origins break CORS. Tier1 users see UI buttons that still 403 on submit. Client-only prototypes (scheduler, some correlation drafts) reset on full page reload. Geo and threat features degrade gracefully when files or keys missing.

## Related material

- [System overview](../02-architecture/00-system-overview.md)
- [Guide index](../../guides/ingest-config/log-ingestion/04-validate-endpoint.md)## Lab verification

Repeat the failing action with browser devtools open on the network tab. Note HTTP status and response JSON message. Switch role account once to see if behavior is authorization versus configuration. Only after isolating the layer should you change environment variables or restore database backups.

## Shift handoff checklist

Before ending a lab session, record which account role was active, whether deduplication was on, and the last ingest batch size. Screenshot Overview KPIs if coursework requires evidence. If students report empty views, ask whether they refreshed after Simulate Campaign and whether filters hide new alerts. When promoting from tier1 to tier2 accounts, log out fully so cookies do not blend roles.

## Coordination with other modules

Cross-link findings in Case Manager or Incident views when drills span multiple screens. Threat Intel and Geo Map should tell the same story about an IP before watchlist blocking. Pipeline Health confirms whether zeros are detection silence or ingest failure. For security sign-off, pair this topic with CSRF and RBAC docs before external exposure.
