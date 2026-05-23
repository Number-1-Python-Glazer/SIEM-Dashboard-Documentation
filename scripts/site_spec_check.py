#!/usr/bin/env python3
"""Validate SITE_SPEC_CHECKLIST items exist in the repository."""
from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

# Each check: (label, paths, needles_any_of_groups)
# needles_any_of_groups: list of groups; each group is list of strings that must ALL appear in combined text
CHECKS = [
    ("siem-core.js", ["assets/siem-core.js"], [["SessionState", "AchievementSystem", "GlobalPalette", "Broadcast", "CanvasLoop"]]),
    ("palette.js", ["assets/palette.js", "assets/palette.css", "assets/siem-core.js"], [["siem-palette", "Ctrl"]]),
    ("404.html", ["404.html"], [["404", "Signal Lost"]]),
    ("500.html", ["500.html"], [["500", "Hull Breach"]]),
    ("sw.js", ["sw.js"], [["CACHE", "install", "fetch"]]),
    ("deck-nav transitions", ["assets/deck-nav.js"], [["WIPE", "GLITCH", "DISSOLVE", "cycleTransitionStyle"]]),
    ("terminal.html", ["terminal.html", "assets/terminal-shell.js"], [["xterm", "alerts.log", "whoami", "SIEM_SECRET", "man habibi"]]),
    ("breach.html", ["breach.html"], [["breach-canvas", "Scenario"]]),
    ("network.html", ["network.html"], [["d3", "EventEngine", "drawer"]]),
    ("cipher.html", ["cipher.html"], [["ALPHA", "BETA", "GAMMA"]]),
    ("sim.html", ["sim.html"], [["MISSION", "scrub"]]),
    ("intercept.html", ["intercept.html"], [["DECRYPT", "SESSION-OMEGA"]]),
    ("forge.html", ["forge.html"], [["forge-canvas", "Export JSON"]]),
    ("archive.html", ["archive.html"], [["THREE", "overlay"]]),
    ("heist.html", ["heist.html"], [["kaboom", "EXFIL"], ["kaboom", "guide-overlay"]]),
    ("cartography.html", ["cartography.html"], [["Globe", "LAYERS"]]),
    ("lab.html", ["lab.html"], [["Chart", "payload"]]),
    ("memorial.html", ["memorial.html"], [["BREACH", "chapter"]]),
    ("resonance.html", ["resonance.html"], [["Tone", "CHANNEL"]]),
    ("trophy.html", ["trophy.html"], [["AchievementSystem"]]),
    ("siem-qol.js", ["assets/siem-qol.js"], [["SiemQoL", "KeyboardMap", "ShareCard", "LoadingScreen"]]),
    ("motd.html", ["motd.html"], [["DAILY BRIEFING", "motd"]]),
    ("cdn-fallback", ["assets/vendor/cdn-fallback.js"], [["siem-cdn-fallback"]]),
    ("perf-budget", ["docs/PERF_BUDGET.md"], [["Performance", "FCP", "Lighthouse"]]),
    ("breach cdns", ["breach.html"], [["Tone", "gsap", "matter"]]),
    ("network packet modal", ["network.html"], [["packet-modal", "Wireshark", "Capture Packets"]]),
    ("forge monaco", ["forge.html"], [["monaco", "Fuse", "interact"]]),
    ("lab xterm", ["lab.html"], [["xterm", "fitAddon"]]),
    ("memorial lenis", ["memorial.html"], [["ScrollTrigger", "Lenis", "BREACH 006"]]),
    ("wired index", ["index.html"], [["siem-core.js", "palette.js"]]),
    ("wired brain", ["brain/index.html"], [["siem-core.js", "palette.js"]]),
    ("wired left", ["left.html"], [["siem-core.js", "palette.js"]]),
    ("wired right", ["right.html"], [["siem-core.js", "palette.js"]]),
]

PAGE_FILES = [
    "terminal.html", "breach.html", "network.html", "cipher.html", "sim.html",
    "intercept.html", "forge.html", "archive.html", "heist.html", "cartography.html",
    "lab.html", "memorial.html", "resonance.html",
]


def read_combined(paths: list[str]) -> str:
    parts: list[str] = []
    for rel in paths:
        fp = ROOT / rel
        if fp.is_file():
            parts.append(fp.read_text(encoding="utf-8", errors="replace"))
        else:
            parts.append("")
    return "\n".join(parts)


def run_pass(pass_num: int) -> tuple[int, list[str]]:
    failures: list[str] = []
    for label, paths, groups in CHECKS:
        missing_files = [p for p in paths if not (ROOT / p).is_file()]
        if missing_files:
            failures.append(f"{label}: missing file(s) {missing_files}")
            continue
        text = read_combined(paths)
        for group in groups:
            if not all(needle in text for needle in group):
                failures.append(f"{label}: missing needles {group} in {paths}")
    for page in PAGE_FILES:
        if not (ROOT / page).is_file():
            failures.append(f"page missing: {page}")
    palette_entries = read_combined(["assets/siem-core.js"])
    for page in PAGE_FILES:
        stem = page.replace(".html", "")
        if f"'{page}'" not in palette_entries and f'"{page}"' not in palette_entries:
            failures.append(f"palette nav missing entry for {page}")
    return len(failures), failures


def update_checklist_stats() -> tuple[int, int]:
    checklist = ROOT / "scripts" / "SITE_SPEC_CHECKLIST.md"
    if not checklist.is_file():
        return 0, 0
    text = checklist.read_text(encoding="utf-8")
    done = len(re.findall(r"- \[x\]", text))
    partial = len(re.findall(r"- \[~\]", text))
    pending = len(re.findall(r"- \[ \]", text))
    total = done + partial + pending
    return done, total


def main() -> int:
    total_fail = 0
    all_issues: list[str] = []
    for i in range(1, 4):
        n, issues = run_pass(i)
        total_fail += n
        if issues:
            print(f"--- Pass {i}: {n} issue(s) ---", file=sys.stderr)
            for item in issues:
                print(item, file=sys.stderr)
            all_issues.extend(issues)
        else:
            print(f"Pass {i}: OK (0 issues)")
    done, total = update_checklist_stats()
    pct = round(100 * done / total, 1) if total else 0
    print(f"\nChecklist: {done}/{total} marked done ({pct}%)")
    print(f"Summary: 3 passes, {total_fail} total issue(s) across passes")
    return 1 if all_issues else 0


if __name__ == "__main__":
    sys.exit(main())
