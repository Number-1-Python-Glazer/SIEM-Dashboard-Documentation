# Troubleshooting

Operator-focused fixes for HABIBI-SIEM when the UI misbehaves, APIs return errors, or dashboards stay empty. Each item follows **symptom → likely cause → fix**.

## Empty dashboard after login

**Symptom:** Overview KPIs are zero, feed says no records.

**Cause:** No successful ingest in this session, or all alerts filtered out.

**Fix:** Open Ingest → Log Ingestion, load a sample card or run Simulate Campaign on Overview. Clear severity and time filters on the feed. Confirm Pipeline Health shows recent validation success.

## HTTP 403 on save or SOAR action

**Symptom:** Watchlist add, alert status change, or SOAR log returns forbidden.

**Cause A:** Missing or stale CSRF header while session cookie still valid.

**Fix:** Log out and log in again; perform one read-only navigation so client refreshes token; retry once. If scripting, send the token header returned at login on every mutating request.

**Cause B:** RBAC tier too low (tier1 read-only paths).

**Fix:** Repeat action as analyst2 or manager account. Expect 403 by design on admin-only routes for tier2.

## CORS or network errors in browser console

**Symptom:** API calls fail from browser with CORS policy text.

**Cause:** UI origin not allowed by API server configuration, or hitting API port directly while UI expects proxied `/api` path.

**Fix:** Run UI and API as documented for lab (single origin via dev proxy or same host in production build). Align `CORS_ORIGIN` with the exact browser URL including port. Avoid mixing `localhost` and `127.0.0.1` across tabs.

## Session lost on refresh or random logouts

**Symptom:** Redirected to login after reload.

**Cause:** Session secret changed between restarts, cookie blocked, or clock skew on VM snapshots.

**Fix:** Set stable session secret in environment for the semester. Use one browser profile; allow cookies for the lab host. Clear duplicate sessions by closing old tabs.

## Geo map blank or country unknown

**Symptom:** All markers missing; ingest preview lacks country.

**Cause:** GeoLite database not installed on server or wrong path in environment.

**Fix:** Complete geo database setup in operations docs. Restart API process. Re-ingest a sample with external public IPs.

## Threat intel scores flat

**Symptom:** Reputation always zero or API errors in SOAR.

**Cause:** AbuseIPDB key missing, quota exceeded, or outbound HTTP blocked.

**Fix:** Configure threat API key in settings guide. Wait for quota cache TTL after classroom hammering. Fall back to local THREAT_DB hints for demo narrative.

## Rules never fire

**Symptom:** Logs increase, alerts stay zero.

**Cause:** Rules disabled, wrong parser format, or sanitize stripped attack strings.

**Fix:** Open Rules Engine, enable target rule. Re-parse with correct format in Log Ingestion preview. Temporarily disable deduplication to see raw firing rate.

## SQLite or database errors on startup

**Symptom:** API exits or 500 on every route.

**Cause:** Corrupt db file, permissions, or native module mismatch on OS.

**Fix:** Restore from backup doc. Ensure data directory writable. On Windows labs, use supported Node version and rebuild native deps only when course instructions say so.

## High memory or tab freeze

**Symptom:** Browser hangs after huge paste.

**Cause:** Client holds full log and alert arrays in memory.

**Fix:** Ingest smaller batches. Clear resolved alerts. Restart tab between classes.

## Pentest retest failures

**Symptom:** Tier1 can still write where 403 expected.

**Cause:** Old server process without hardening patch running.

**Fix:** Restart API after pull. Confirm testing correct port and account. See pentest markdown series in repo pentests folder.

## Related guides

- [System overview](../02-architecture/00-system-overview.md)
- [CSRF design](../08-security/03-csrf-design.md)
- [Geo DB setup](06-geo-db-setup.md)
- [Log ingestion index](../../guides/ingest-config/log-ingestion/INDEX.md)
- [Pipeline health UI](../07-ui-modules/26-pipeline-health.md)
