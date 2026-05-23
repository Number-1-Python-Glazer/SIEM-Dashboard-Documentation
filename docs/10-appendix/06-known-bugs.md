# Known bugs and gaps

This appendix tracks intentional teaching limitations and open gaps in HABIBI-SIEM. Use it when student reports sound like defects but match expected prototype behavior.

## Log ingestion and settings routing

**Symptom:** Sidebar shows Log Ingestion or Settings but navigation lands on a blank shell or wrong module.

**Impact:** Operators cannot reach ingest without using Command Palette or direct route bookmark.

**Workaround:** Open Ingest from command palette if configured, or use the documentation site deep link to Log Ingestion. Refresh after switching major sections.

**Teaching note:** Coursework may grade navigation diagrams even when one route is broken; document the workaround in lab answers.

## Simulated alert flag handling

**Symptom:** Console error or missing badge when Simulate Campaign fires while filters are active.

**Impact:** Campaign still produces alerts but UI may not label them as simulated.

**Workaround:** Clear filters, rerun campaign, reload page once.

## Command palette versus sidebar iDs

**Symptom:** Palette jump goes nowhere or opens wrong module.

**Impact:** Keyboard-first users hit dead ends.

**Workaround:** Use sidebar until IDs are aligned in a future fix. Note failing palette entry in bug reports.

## Rule toggles not persisted

**Symptom:** Disabled rules re-enable after browser refresh.

**Impact:** Shift handoff cannot assume rule state survived.

**Workaround:** Record enabled rule set in shift log. Re-disable noisy rules at start of each lab session.

## IOC watchlist client-only

**Symptom:** Watchlist empty after reload though blocks were added.

**Impact:** Repeat SOAR demos must re-add indicators.

**Workaround:** Treat watchlist as session scratch pad. For pentests, verify server-side deny paths still return 403 even when UI list is empty.

## Detection runs in the browser

**Symptom:** Alerts differ if API is called directly without browser detection pass.

**Impact:** Teaches that client/server split matters; not production-grade enforcement.

**Workaround:** Always demo through normal UI ingest. Discuss server validation as hygiene layer only.

## Memory-backed sessions

**Symptom:** All users logged out after API restart.

**Impact:** Long lab weeks need re-login after server bounce.

**Workaround:** Schedule restarts between classes. Keep session secret stable within a week.

## Related material

- [Troubleshooting](../09-operations/08-troubleshooting.md)
- [System overview](../02-architecture/00-system-overview.md)
- [Future work](07-future-work.md)

## Shift handoff checklist

Before ending a lab session, record which account role was active, whether deduplication was on, and the last ingest batch size. Screenshot Overview KPIs if coursework requires evidence. If students report empty views, ask whether they refreshed after Simulate Campaign and whether filters hide new alerts. When promoting from tier1 to tier2 accounts, log out fully so cookies do not blend roles.

## Coordination with other modules

Cross-link findings in Case Manager or Incident views when drills span multiple screens. Threat Intel and Geo Map should tell the same story about an IP before watchlist blocking. Pipeline Health confirms whether zeros are detection silence or ingest failure. For security sign-off, pair this topic with CSRF and RBAC docs before external exposure.
