#!/usr/bin/env python3
"""Post-pass audit for remaining AI tells in documentation."""
from __future__ import annotations

import re
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DOC_ROOTS = [ROOT / "docs", ROOT / "guides", ROOT / "pentests"]
DOC_FILES = [ROOT / "README.md", ROOT / "guides" / "README.md"]

PATTERNS = {
    "ban_words": r"\b(additionally|furthermore|moreover|subsequently|leverage|utilize|comprehensive|robust|seamless|holistic|nuanced|pivotal|facilitate|streamline|synergy|paradigm|ecosystem|actionable|harness|unlock|unleash|supercharge|paramount|crucial|testament|tapestry|intricate|meticulous|sophisticated|unprecedented|enterprise-grade|best-in-class|cutting-edge|state-of-the-art|game-changer|groundbreaking|revolutionary|transformative|innovative)\b",
    "meta_phrases": r"(it's worth noting|it is worth noting|it's important to note|in today's|let's explore|we'll dive|without further ado|at the end of the day|as mentioned earlier|in summary,|in this section, we will|you are now equipped|experts agree|research shows|make no mistake|needless to say|first and foremost|deep dive|deep-dive)",
    "role_plays": r"plays a (crucial|pivotal|vital|important) role",
    "decorative_emoji": r"[✅❓⚡🔍🛡️⚠️🎯📊🔒💡🚀⭐]",
    "question_h2": r"^## (What|Why|How) ",
    "high_em_dash": r".",
}

def collect():
    files = []
    for d in DOC_ROOTS:
        files.extend(d.rglob("*.md"))
    for f in DOC_FILES:
        if f.exists() and f not in files:
            files.append(f)
    return sorted(files)

def main():
    totals = Counter()
    em_dash_files = []
    ban_files = []
    meta_files = []
    for fp in collect():
        text = fp.read_text(encoding="utf-8")
        rel = fp.relative_to(ROOT).as_posix()
        for name, pat in PATTERNS.items():
            if name == "high_em_dash":
                n = text.count("\u2014")
                if n > 3:
                    em_dash_files.append((rel, n))
                totals["em_dash_total"] += n
                continue
            m = re.findall(pat, text, re.I | re.M)
            if m:
                totals[name] += len(m)
                if name == "ban_words":
                    ban_files.append((rel, len(m)))
                if name == "meta_phrases":
                    meta_files.append((rel, len(m)))
    print(f"files={len(collect())}")
    print("remaining_hits:", dict(totals))
    if ban_files:
        print("ban_word_files:", ban_files[:15])
    if meta_files:
        print("meta_phrase_files:", meta_files[:15])
    if em_dash_files:
        print("high_em_dash:", sorted(em_dash_files, key=lambda x: -x[1])[:15])

if __name__ == "__main__":
    main()
