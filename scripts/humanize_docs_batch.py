#!/usr/bin/env python3
"""Humanize docs/, pentests/, and README.md — reword AI tells, keep all content."""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

TARGET_DIRS = [
    ROOT / "docs",
    ROOT / "pentests",
]
TARGET_FILES = [ROOT / "README.md"]

# --- word / phrase replacements (from humanize_docs.py, extended) ---
WORD_REPLACEMENTS: list[tuple[str, str]] = [
    (r"\bAdditionally\b", "Also"),
    (r"\bAdditionally,\b", "Also,"),
    (r"\bFurthermore\b", "And"),
    (r"\bFurthermore,\b", "And,"),
    (r"\bMoreover\b", "On top of that"),
    (r"\bMoreover,\b", "On top of that,"),
    (r"\bSubsequently\b", "After that"),
    (r"\bAccordingly\b", "So"),
    (r"\bAccordingly,\b", "So,"),
    (r"\bThus\b", "So"),
    (r"\bThus,\b", "So,"),
    (r"\bHence\b", "That's why"),
    (r"\bHence,\b", "That's why,"),
    (r"\bConsequently\b", "As a result"),
    (r"\bConsequently,\b", "As a result,"),
    (r"\bdelve into\b", "look into"),
    (r"\bdelve\b", "look into"),
    (r"\bunderscores\b", "shows"),
    (r"\bunderscore\b", "show"),
    (r"\bUnderscore\b", "Show"),
    (r"\bpivotal\b", "central"),
    (r"\bPivotal\b", "Central"),
    (r"\brobust\b", "reliable"),
    (r"\bRobust\b", "Reliable"),
    (r"\bseamless\b", "smooth"),
    (r"\bSeamless\b", "Smooth"),
    (r"\bcomprehensive\b", "full"),
    (r"\bComprehensive\b", "Full"),
    (r"\bholistic\b", "full-picture"),
    (r"\bHolistic\b", "Full-picture"),
    (r"\bnuanced\b", "subtle"),
    (r"\bNuanced\b", "Subtle"),
    (r"\bleverage\b", "use"),
    (r"\bLeverage\b", "Use"),
    (r"\bleveraging\b", "using"),
    (r"\bLeveraging\b", "Using"),
    (r"\butilize\b", "use"),
    (r"\bUtilize\b", "Use"),
    (r"\butilizing\b", "using"),
    (r"\bfacilitate\b", "help"),
    (r"\bFacilitate\b", "Help"),
    (r"\bstreamline\b", "simplify"),
    (r"\bStreamline\b", "Simplify"),
    (r"\bproactive\b", "ahead-of-time"),
    (r"\bProactive\b", "Ahead-of-time"),
    (r"\bsynergy\b", "combined effect"),
    (r"\bparadigm\b", "model"),
    (r"\bParadigm\b", "Model"),
    (r"\becosystem\b", "network"),
    (r"\bEcosystem\b", "Network"),
    (r"\blandscape\b", "field"),
    (r"\bLandscape\b", "Field"),
    (r"\brealm\b", "area"),
    (r"\bRealm\b", "Area"),
    (r"\bcornerstone\b", "foundation"),
    (r"\bCornerstone\b", "Foundation"),
    (r"\bgranular\b", "detailed"),
    (r"\bGranular\b", "Detailed"),
    (r"\bactionable\b", "concrete"),
    (r"\bActionable\b", "Concrete"),
    (r"\bkey takeaways\b", "what this means"),
    (r"\bKey takeaways\b", "What this means"),
    (r"\bcutting-edge\b", "current"),
    (r"\bstate-of-the-art\b", "current"),
    (r"\bbest practices\b", "common practice"),
    (r"\bBest practices\b", "Common practice"),
    (r"\bmoving forward\b", "from now on"),
    (r"\bgoing forward\b", "from now on"),
    (r"\bunpack\b", "explain"),
    (r"\bUnpack\b", "Explain"),
    (r"\bharness\b", "use"),
    (r"\bHarness\b", "Use"),
    (r"\bunlock\b", "open up"),
    (r"\bUnlock\b", "Open up"),
    (r"\bunleash\b", "release"),
    (r"\bsupercharge\b", "speed up"),
    (r"\bturbocharge\b", "speed up"),
    (r"\bcraft\b", "build"),
    (r"\bCraft\b", "Build"),
    (r"\belevate\b", "raise"),
    (r"\bfoster\b", "build"),
    (r"\bFoster\b", "Build"),
    (r"\bparamount\b", "most important"),
    (r"\bcrucial\b", "important"),
    (r"\bCrucial\b", "Important"),
    (r"\bessential\b", "necessary"),
    (r"\bEssential\b", "Necessary"),
    (r"\bvital\b", "necessary"),
    (r"\bVital\b", "Necessary"),
    (r"\bboasts\b", "has"),
    (r"\bshowcases\b", "shows"),
    (r"\bstands as\b", "is"),
    (r"\bserves as\b", "works as"),
    (r"\btestament\b", "proof"),
    (r"\btapestry\b", "mix"),
    (r"\binterplay\b", "interaction"),
    (r"\bintricate\b", "complex"),
    (r"\bmeticulous\b", "careful"),
    (r"\bvibrant\b", "active"),
    (r"\brenowned\b", "well-known"),
    (r"\bdiverse array\b", "range"),
    (r"\bin order to\b", "to"),
    (r"\bDue to the fact that\b", "Because"),
    (r"\bdue to the fact that\b", "because"),
    (r"\bIn the event that\b", "If"),
    (r"\bin the event that\b", "if"),
    (r"\bAt this point in time\b", "Now"),
    (r"\bat this point in time\b", "now"),
    (r"\bFor the purpose of\b", "To"),
    (r"\bfor the purpose of\b", "to"),
    (r"\bIt\'s worth noting that\b", ""),
    (r"\bIt is worth noting that\b", ""),
    (r"\bIt\'s worth noting\b", ""),
    (r"\bIt is worth noting\b", ""),
    (r"\bIt\'s important to note that\b", ""),
    (r"\bIt is important to note that\b", ""),
    (r"\bIt\'s important to note\b", ""),
    (r"\bIt is important to note\b", ""),
    (r"\bIn today\'s digital landscape\b", ""),
    (r"\bIn today\'s world\b", ""),
    (r"\bdeep dive\b", "detailed look"),
    (r"\bDeep dive\b", "Detailed look"),
    (r"\bLet\'s explore\b", ""),
    (r"\bWe\'ll dive into\b", ""),
    (r"\bWithout further ado\b", ""),
    (r"\bNeedless to say,\b", ""),
    (r"\bneedless to say,\b", ""),
    (r"\bAt the end of the day,\b", ""),
    (r"\bat the end of the day,\b", ""),
    (r"\bFirst and foremost,\b", "First,"),
    (r"\bfirst and foremost,\b", "First,"),
    (r"\bLast but not least,\b", "Finally,"),
    (r"\blast but not least,\b", "Finally,"),
    (r"\bGenerally speaking,\b", ""),
    (r"\bBroadly speaking,\b", ""),
    (r"\bAs mentioned earlier,\b", ""),
    (r"\bas mentioned earlier,\b", ""),
    (r"\bAs noted above,\b", ""),
    (r"\bas noted above,\b", ""),
    (r"\bIndeed,\b", ""),
    (r"\bIndeed\b", ""),
    (r"\bCertainly,\b", ""),
    (r"\bOf course,\b", ""),
    (r"\bRest assured,\b", ""),
    (r"\bSimply put,\b", ""),
    (r"\bTo put it simply,\b", ""),
    (r"\bIn layman\'s terms,\b", ""),
    (r"\bIn essence,\b", ""),
    (r"\bAt its core,\b", ""),
    (r"\bNotably,\b", ""),
    (r"\bImportantly,\b", ""),
    (r"\bEssentially,\b", ""),
    (r"\bnavigate the complexities of\b", "work through"),
    (r"\bNavigate the complexities of\b", "Work through"),
    (r"\bnavigate complexity\b", "work through complexity"),
    (r"\bHarness the power of\b", "Use"),
    (r"\bharness the power of\b", "use"),
    (r"\bUnlock the potential of\b", "Use"),
    (r"\bunlock the potential of\b", "use"),
    (r"\bBridging the gap between\b", "Connecting"),
    (r"\bbridging the gap between\b", "connecting"),
    (r"\bLay the groundwork for\b", "Prepare for"),
    (r"\blay the groundwork for\b", "prepare for"),
    (r"\bFoster a culture of\b", "Build a habit of"),
    (r"\bfoster a culture of\b", "build a habit of"),
    (r"\bAt the forefront of\b", "Leading"),
    (r"\bat the forefront of\b", "leading"),
    (r"\bplays a crucial role in\b", "matters for"),
    (r"\bplays a pivotal role in\b", "matters for"),
    (r"\bplays a vital role in\b", "matters for"),
    (r"\bplays an important role in\b", "matters for"),
    (r"\benterprise-grade\b", ""),
    (r"\bbest-in-class\b", ""),
    (r"\bworld-class\b", ""),
    (r"\bindustry-leading\b", ""),
    (r"\bunprecedented\b", "unusual"),
    (r"\bUnprecedented\b", "Unusual"),
    (r"\bsophisticated\b", "complex"),
    (r"\bSophisticated\b", "Complex"),
    (r"\bpowerful\b", ""),
    (r"\bPowerful\b", ""),
    (r"\bIn this section,? we will\b", "This section"),
    (r"\bNow,? let us turn to\b", ""),
    (r"\bHaving established\b", ""),
]

PROPER_NOUNS = {
    "SIEM", "SOC", "MITRE", "ATT&CK", "OWASP", "SQLite", "Express", "React",
    "Vite", "CSRF", "RBAC", "SOAR", "UEBA", "API", "JSON", "CSV", "CEF",
    "XSS", "SQL", "SPL", "KQL", "Azure", "AbuseIPDB", "GeoLite2", "MaxMind",
    "Tailwind", "Node", "JavaScript", "TypeScript", "PowerShell", "STRIDE",
    "ECS", "CEF", "HTTP", "HTTPS", "CORS", "CSP", "Helmet", "bcrypt",
    "npm", "GitHub", "Splunk", "Sentinel", "QRadar", "Elastic", "ArcSight",
    "LogRhythm", "OpenText", "IBM", "Microsoft", "EPS", "MTTD", "MTTR",
    "KPI", "UI", "SPA", "CRUD", "WAL", "AES", "IP", "IOC", "UEBA",
    "Meridian", "Dashboard", "Login", "README", "GitHub Pages",
}

HEADING_REWRITES: dict[str, str] = {
    "docs/02-architecture/02-01-frontend-backend-split.md": "Frontend/backend split",
    "docs/02-architecture/03-02-data-flow-diagram.md": "Data flow diagram",
    "docs/02-architecture/04-03-session-auth-model.md": "Session auth model",
    "docs/02-architecture/05-04-sqlite-schema.md": "SQLite schema",
    "docs/02-architecture/06-05-api-surface-map.md": "API surface map",
    "docs/02-architecture/07-06-vite-proxy-why.md": "Why Vite proxies `/api` in dev",
    "docs/02-architecture/08-07-production-build-path.md": "Production build path",
    "docs/02-architecture/09-08-threat-model-sketch.md": "Threat model sketch",
    "docs/05-detection-engine/14-correlation-engine.md": "Correlation engine (stub)",
    "docs/05-detection-engine/15-dedupe-logic.md": "Alert dedupe logic",
    "docs/08-security/pentest-prep/02-tools-i-used.md": "Tools used for pentest prep",
}

BODY_REWRITES: dict[str, str] = {
    "docs/02-architecture/02-01-frontend-backend-split.md": (
        "React SPA on port 5173; Express API on 3001. Vite proxies `/api` during development. "
        "Production serves the built SPA from Express."
    ),
    "docs/02-architecture/03-02-data-flow-diagram.md": (
        "Paths for log ingest, alert creation, threat lookup, and authentication. "
        "See [system overview](00-system-overview.md) for the ASCII diagram."
    ),
    "docs/02-architecture/04-03-session-auth-model.md": (
        "Cookie sessions (`siem.sid`), bcrypt login, CSRF on writes, role copied into session after auth."
    ),
    "docs/02-architecture/05-04-sqlite-schema.md": (
        "Tables in `data/siem.db`: users, alerts, audit log, watchlist, threat API keys."
    ),
    "docs/02-architecture/06-05-api-surface-map.md": (
        "REST endpoints grouped by auth, alerts, ingest, threat intel, and admin operations."
    ),
    "docs/02-architecture/07-06-vite-proxy-why.md": (
        "Dev proxy keeps cookies same-origin and avoids extra CORS config while testing CSRF locally."
    ),
    "docs/02-architecture/08-07-production-build-path.md": (
        "`npm run build` writes to `dist/`; Express serves static assets and SPA fallback in production."
    ),
    "docs/02-architecture/09-08-threat-model-sketch.md": (
        "STRIDE-oriented trust boundaries: browser, API, SQLite, external threat and geo services."
    ),
    "docs/03-backend/04-server-crypto.md": (
        "`server/crypto.js`: AES helpers for encrypting threat API keys stored in the database."
    ),
    "docs/03-backend/05-server-validate.md": (
        "`server/validate.js`: whitelist validation for POST bodies (alerts, watchlist, SOAR log entries)."
    ),
    "docs/03-backend/06-server-threat.md": (
        "`server/threat.js`: AbuseIPDB proxy with quota tracking and rate limiting."
    ),
    "docs/03-backend/07-server-geo.md": (
        "`server/geo.js`: MaxMind GeoLite2 lookups for IP enrichment on ingest."
    ),
    "docs/03-backend/08-middleware-stack.md": (
        "Middleware order in Express: Helmet, CORS, rate limiters, session, JSON parser, then routes."
    ),
    "docs/03-backend/09-rate-limits.md": (
        "Per-route limits on auth attempts, general API traffic, geo lookups, and log ingest volume."
    ),
    "docs/03-backend/10-audit-logging.md": (
        "Server-side audit trail written on security-sensitive mutations (`writeAudit` in `server/db.js`)."
    ),
    "docs/03-backend/11-env-vars.md": (
        "Environment variables: `SESSION_SECRET`, `CORS_ORIGIN`, threat keys, geo DB path, and production flags."
    ),
    "docs/03-backend/12-startup-sequence.md": (
        "Boot sequence: load env, validate secrets, init SQLite, seed dev users if allowed, listen on `PORT`."
    ),
    "docs/03-backend/deep-dives/01-express-routes.md": (
        "How routes mount in `server/index.js`: auth first, then alerts, ingest, threat, geo, admin."
    ),
    "docs/03-backend/deep-dives/02-sqlite-wal.md": (
        "WAL mode on `siem.db`: concurrent reads during writes, typical for local demo workloads."
    ),
    "docs/03-backend/deep-dives/03-bcrypt-cost.md": (
        "bcrypt cost factor for password hashing and the dev-vs-prod performance tradeoff."
    ),
    "docs/03-backend/deep-dives/04-csrf-token-flow.md": (
        "CSRF token issued on login, stored in session, required via `X-CSRF-Token` on mutating requests."
    ),
    "docs/03-backend/deep-dives/05-threat-quota-cache.md": (
        "In-memory cache of AbuseIPDB daily quota so repeated lookups do not burn the API allowance."
    ),
    "docs/04-frontend/01-react-entry.md": (
        "`main.jsx` mounts the tree; `App.jsx` wraps providers and the router."
    ),
    "docs/04-frontend/02-app-shell.md": (
        "Sidebar layout, module chrome, and header controls shared across views."
    ),
    "docs/04-frontend/03-auth-context.md": (
        "`AuthContext`: login state, CSRF token, and role used for client-side permission checks."
    ),
    "docs/04-frontend/04-siem-context.md": (
        "`SiemContext`: logs, alerts, `DetectionEngine` instance, and the `processLogs()` pipeline."
    ),
    "docs/04-frontend/05-api-client.md": (
        "Fetch wrapper: sends session cookies, attaches CSRF header on POST/PUT/DELETE."
    ),
    "docs/04-frontend/06-routing-and-nav.md": (
        "React Router paths mapped to sidebar modules and deep links."
    ),
    "docs/04-frontend/07-styling-system.md": (
        "Tailwind config, dark SOC palette, severity colour tokens, shared layout utilities."
    ),
    "docs/04-frontend/08-component-index.md": (
        "Index linking each UI module doc to its React source file under `src/components/`."
    ),
    "docs/05-detection-engine/14-correlation-engine.md": (
        "Short pointer: full write-up in [15-correlation-engine.md](15-correlation-engine.md). "
        "Groups alerts by source IP within a 60-second window."
    ),
    "docs/05-detection-engine/15-dedupe-logic.md": (
        "How `DetectionEngine` suppresses repeat alerts for the same rule and source within a cooldown window."
    ),
    "docs/05-detection-engine/16-severity-calc.md": (
        "Severity assignment: rule default, MITRE tier weighting, and escalation when multiple rules fire."
    ),
    "docs/06-log-ingestion/02-apache-parser.md": (
        "Parses Apache combined log lines into normalized ECS-style events (`src/services/parsers/apache.js`)."
    ),
    "docs/06-log-ingestion/03-syslog-parser.md": (
        "Parses RFC5424-style syslog into normalized events (`src/services/parsers/syslog.js`)."
    ),
    "docs/06-log-ingestion/04-cef-parser.md": (
        "Parses CEF header and extension fields into normalized events (`src/services/parsers/cef.js`)."
    ),
    "docs/06-log-ingestion/05-json-parser.md": (
        "Accepts JSON log arrays or NDJSON; maps common field names to the internal schema."
    ),
    "docs/06-log-ingestion/06-windows-parser.md": (
        "Parses Windows Security event text exports into normalized events."
    ),
    "docs/06-log-ingestion/07-csv-parser.md": (
        "Reads CSV with a header row; maps columns to timestamp, source IP, message, and severity."
    ),
    "docs/06-log-ingestion/08-mock-generator.md": (
        "`mockLogGenerator.js`: synthetic ECS events for simulate-campaign demos, including malicious variants."
    ),
    "docs/06-log-ingestion/09-sanitize-pipeline.md": (
        "Pre-detection sanitization: strip null bytes, cap field length, reject malformed timestamps."
    ),
    "docs/06-log-ingestion/10-geo-enrichment.md": (
        "Client calls `/api/geo/:ip` during `processLogs()` to attach country and coordinates."
    ),
    "docs/06-log-ingestion/11-simulated-campaigns.md": (
        "Dashboard **Simulate Campaign** button: batches malicious mock logs through the full detection pipeline."
    ),
    "docs/08-security/pentest-prep/01-test-plan-template.md": (
        "Blank structure for scoping, accounts, tools, evidence paths, and sign-off before running pentests."
    ),
    "docs/08-security/pentest-prep/02-tools-i-used.md": (
        "PowerShell, browser multi-session testing, and SQLite inspection tools used during prep runs."
    ),
    "docs/08-security/pentest-prep/03-scope-notes.md": (
        "In-scope hosts, excluded third parties, and RBAC tiers exercised during assessment."
    ),
    "docs/08-security/pentest-prep/04-remediation-log.md": (
        "Findings mapped to code changes, retest dates, and residual risk notes."
    ),
}

PARSER_FORMATS = {
    "apache": "Apache combined",
    "syslog": "syslog",
    "cef": "CEF",
    "json": "JSON/NDJSON",
    "windows": "Windows Security export",
    "csv": "CSV",
}

README_REPLACEMENTS: list[tuple[str, str]] = [
    (
        "**Shuttle approach → wormhole map · 58 station props · recenter with ◎ or Home**",
        "Interactive architecture map with 58 module nodes. Recenter with ◎ or Home.",
    ),
    (
        "## What you get on the live site",
        "## Live site layout",
    ),
    (
        "### Scene 0 — Shuttle approach\nViewport frame, animated wormhole, docking HUD, distance telemetry.",
        "### Landing page\nAnimated entry screen with links into docs and the architecture map.",
    ),
    (
        "### Scene 3 — Observation deck\n58 props, accretion-disk wormhole, orbiting modules, packet tethers.",
        "### Architecture map (`brain/index.html`)\n58 module nodes on an interactive map; click a node to open its doc.",
    ),
    (
        "| **Double-click wormhole** | Portal zoom (deep view) |",
        "| **Double-click center** | Zoom into map focus |",
    ),
    (
        "| **Click node** | Frame module while keeping wormhole visible |",
        "| **Click node** | Open that module's documentation panel |",
    ),
    (
        "**Architecture map** · live interactive scene",
        "**Architecture map** · interactive module index",
    ),
    (
        "## Station manifest — documentation bays",
        "## Documentation sections",
    ),
    (
        "**📡 Guides**",
        "**Guides**",
    ),
    (
        "**📚 Docs**",
        "**Docs**",
    ),
    (
        "**🛡️ Pentests**",
        "**Pentests**",
    ),
    (
        "**🗺️ Map source**",
        "**Map source**",
    ),
]

BOILERPLATE_PATTERNS: list[tuple[str, str]] = [
    (
        r"^Technical documentation for .+ in SIEM Dashboard\.\s*$",
        "__BODY__",
    ),
    (
        r"^Detailed analysis: .+\.\s*$",
        "__BODY__",
    ),
    (
        r"^Express module `[^`]+` — request handlers and business logic\.\s*$",
        "__BODY__",
    ),
    (
        r"^Log parser for [A-Za-z]+ format — normalises events into the internal schema\.\s*$",
        "__BODY__",
    ),
    (
        r"^Penetration test preparation — .+\.\s*$",
        "__BODY__",
    ),
]

TYPO_FIXES = [
    (r"\bIt is is a\b", "It is a"),
    (r"\bis is a\b", "is a"),
]


def rel_key(path: Path) -> str:
    return str(path.relative_to(ROOT)).replace("\\", "/")


def clean_front_matter(text: str) -> str:
    if not text.startswith("---"):
        return text
    end = text.find("---", 3)
    if end == -1:
        return text
    fm = text[3:end].strip().splitlines()
    body = text[end + 3 :]
    kept = [line for line in fm if not line.strip().startswith("audience:")]
    if not kept:
        return text.lstrip("-").lstrip()
    return "---\n" + "\n".join(kept) + "\n---" + body


def sentence_case_heading(line: str) -> str:
    m = re.match(r"^(#{1,6})\s+(.+)$", line)
    if not m:
        return line
    hashes, title = m.group(1), m.group(2).strip()
    if title.startswith("`") or ":" in title and hashes == "#":
        return line
    # keep file-path style titles
    if re.search(r"\.js|\.jsx|\.md|/api/", title):
        return line
    if re.match(r"^(Phase \d+|Step \d+|Test \d+|Rule:|Penetration Test \d+)", title):
        return line

    words = title.split()
    out: list[str] = []
    for i, word in enumerate(words):
        bare = re.sub(r"^[^A-Za-z0-9]+|[^A-Za-z0-9]+$", "", word)
        if not bare:
            out.append(word)
            continue
        if bare in PROPER_NOUNS or bare.upper() in PROPER_NOUNS:
            out.append(word.replace(bare, bare if i == 0 else bare))
            continue
        if i == 0:
            out.append(word)
        else:
            if word.isupper() and len(word) <= 4:
                out.append(word)
            elif word[0].isupper() and bare not in PROPER_NOUNS:
                out.append(word[0].lower() + word[1:])
            else:
                out.append(word)
    return f"{hashes} {' '.join(out)}"


def apply_heading_rewrites(text: str, key: str) -> str:
    if key not in HEADING_REWRITES:
        return text
    new_title = HEADING_REWRITES[key]
    return re.sub(r"^#\s+.+$", f"# {new_title}", text, count=1, flags=re.MULTILINE)


def apply_body_rewrites(text: str, key: str) -> str:
    if key not in BODY_REWRITES:
        return text
    replacement = BODY_REWRITES[key]
    lines = text.splitlines()
    new_lines: list[str] = []
    replaced = False
    for line in lines:
        if not replaced and line.strip() and not line.startswith("#") and not line.startswith("**"):
            if any(re.match(pat, line.strip()) for pat, _ in BOILERPLATE_PATTERNS):
                new_lines.append(replacement)
                replaced = True
                continue
        new_lines.append(line)
    if not replaced:
        # insert after first heading block
        out: list[str] = []
        inserted = False
        for i, line in enumerate(lines):
            out.append(line)
            if not inserted and line.startswith("#") and (i + 1 >= len(lines) or lines[i + 1].strip() == ""):
                out.append("")
                out.append(replacement)
                inserted = True
        return "\n".join(out)
    return "\n".join(new_lines)


def reduce_em_dashes(text: str, max_count: int = 2) -> str:
    count = text.count("—")
    if count <= max_count:
        return text
    kept = 0

    def repl(match: re.Match[str]) -> str:
        nonlocal kept
        if kept < max_count:
            kept += 1
            return "—"
        inner = match.group(0)
        # phase / pentest headings keep em dash
        line_start = text.rfind("\n", 0, match.start()) + 1
        line = text[line_start : text.find("\n", match.start()) if text.find("\n", match.start()) != -1 else None]
        if re.match(r"^(#{1,6}\s+(Phase \d+|Penetration Test \d+))", line):
            kept += 0
            return "—"
        return ": " if inner.strip().startswith("—") else ", "

    # replace from end so positions stay stable-ish
    parts = text.split("—")
    if len(parts) <= max_count:
        return text
    result = parts[0]
    dashes_used = 0
    for part in parts[1:]:
        if dashes_used < max_count:
            result += "—" + part
            dashes_used += 1
        else:
            # choose comma vs colon based on following text
            sep = ": " if part[:1].isspace() and len(part.strip().split()) > 3 else ", "
            result += sep + part.lstrip()
    return result


def trim_redundant_hrules(text: str) -> str:
    lines = text.splitlines()
    out: list[str] = []
    prev_heading = False
    for line in lines:
        if line.strip() == "---":
            if prev_heading or (out and out[-1].strip() == "---"):
                continue
            prev_heading = False
            out.append(line)
            continue
        out.append(line)
        prev_heading = bool(re.match(r"^#{1,6}\s", line))
    return "\n".join(out)


def humanize_file(text: str, key: str) -> str:
    text = clean_front_matter(text)
    text = re.sub(r"^####\s*❓\s*", "#### ", text, flags=re.MULTILINE)
    text = re.sub(r"^###\s*❓\s*", "### ", text, flags=re.MULTILINE)
    text = re.sub(r"^##\s*❓\s*", "## ", text, flags=re.MULTILINE)

    for old, new in TYPO_FIXES:
        text = re.sub(old, new, text)

    if key == "README.md":
        for old, new in README_REPLACEMENTS:
            text = text.replace(old, new)

    text = apply_heading_rewrites(text, key)
    text = apply_body_rewrites(text, key)

    for pat, repl in WORD_REPLACEMENTS:
        text = re.sub(pat, repl, text)

    lines = text.splitlines()
    lines = [sentence_case_heading(l) if re.match(r"^#{2,6}\s", l) else l for l in lines]
    text = "\n".join(lines)

    if key != "README.md":
        text = reduce_em_dashes(text, max_count=2)
        text = trim_redundant_hrules(text)

    text = re.sub(r"^[ \t]+,", "", text, flags=re.MULTILINE)
    text = re.sub(r"\.\s+\.", ".", text)
    text = re.sub(r"  +", " ", text)
    return text.rstrip() + "\n"


def collect_files() -> list[Path]:
    files: list[Path] = []
    for d in TARGET_DIRS:
        if d.exists():
            files.extend(sorted(d.rglob("*.md")))
    for f in TARGET_FILES:
        if f.exists():
            files.append(f)
    return files


def main() -> None:
    changed = 0
    flags: list[str] = []
    pattern_hits: dict[str, int] = {
        "boilerplate_stubs": 0,
        "ban_list_words": 0,
        "em_dash_reduction": 0,
        "heading_sentence_case": 0,
        "readme_marketing_trim": 0,
        "front_matter_audience": 0,
        "emoji_qa_markers": 0,
        "typo_fixes": 0,
    }

    for fp in collect_files():
        orig = fp.read_text(encoding="utf-8")
        key = rel_key(fp)

        pre_scan = orig
        new = humanize_file(orig, key)

        if new != orig:
            fp.write_text(new, encoding="utf-8")
            changed += 1

        if re.search(r"Technical documentation for|Detailed analysis:|request handlers and business logic|Penetration test preparation —", pre_scan):
            if not re.search(r"Technical documentation for|Detailed analysis:|request handlers and business logic|Penetration test preparation —", new):
                pattern_hits["boilerplate_stubs"] += 1
        if re.search(r"^audience:", pre_scan, re.M):
            pattern_hits["front_matter_audience"] += 1
        if "❓" in pre_scan:
            pattern_hits["emoji_qa_markers"] += 1
        if pre_scan.count("—") > 2 and new.count("—") <= 2:
            pattern_hits["em_dash_reduction"] += 1
        if key == "README.md" and pre_scan != new:
            pattern_hits["readme_marketing_trim"] += 1
        if "It is is" in pre_scan or "is is a" in pre_scan:
            pattern_hits["typo_fixes"] += 1

        # flag generic stubs that remain very short without sibling deep doc
        if key.startswith("docs/") and len(new.splitlines()) <= 7:
            body = [l for l in new.splitlines() if l.strip() and not l.startswith("#") and not l.startswith("**")]
            if len(body) <= 1 and "07-ui-modules" in key:
                flags.append(f"{key}: UI module stub still minimal; consider expanding from component source")

    if any("14-correlation-engine" in f for f in flags):
        pass
    flags.append("docs/05-detection-engine/14-correlation-engine.md duplicates 15-correlation-engine.md; stub points to full doc")

    print(f"FILES_EDITED={changed}")
    print(f"FILES_TOTAL={len(collect_files())}")
    print("TOP_PATTERNS:")
    for k, v in sorted(pattern_hits.items(), key=lambda x: -x[1]):
        if v:
            print(f"  {k}: {v}")
    print("FLAGS:")
    for f in flags:
        print(f"  - {f}")


if __name__ == "__main__":
    main()
