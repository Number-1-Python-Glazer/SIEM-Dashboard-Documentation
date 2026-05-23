#!/usr/bin/env python3
"""Full documentation human-editor pass: reword AI tells, keep all content."""
from __future__ import annotations

import importlib
import re
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCRIPTS = Path(__file__).resolve().parent
sys.path.insert(0, str(SCRIPTS))

from humanize_lib import WORD_REPLACEMENTS, clean_front_matter, humanize as lib_humanize  # noqa: E402

# Extended ban list / phrase tells (editor spec parts 1–2)
EXTRA_REPLACEMENTS: list[tuple[str, str]] = [
    (r"\bSubsequently\b", "After that"),
    (r"\bSubsequently,\b", "After that,"),
    (r"\bgame-changer\b", "major shift"),
    (r"\bgroundbreaking\b", "new"),
    (r"\brevolutionary\b", "major"),
    (r"\btransformative\b", "significant"),
    (r"\binnovative\b", "new"),
    (r"\btouch base\b", "check in"),
    (r"\bcircle back\b", "return to"),
    (r"\bdive into\b", "look at"),
    (r"\bDive into\b", "Look at"),
    (r"\bembark on\b", "start"),
    (r"\bEmbark on\b", "Start"),
    (r"\bshed light on\b", "explain"),
    (r"\bpaint a picture\b", "describe"),
    (r"\bskyrocket\b", "rise sharply"),
    (r"\bnestled\b", "located"),
    (r"\brich heritage\b", "long history"),
    (r"\barena\b", "field"),
    (r"\bArena\b", "Field"),
    (r"\boptimize\b", "tune"),
    (r"\bOptimize\b", "Tune"),
    (r"\bmarks a\b", "is a"),
    (r"\bwhen all is said and done\b", ""),
    (r"\bit cannot be overstated\b", ""),
    (r"\bit goes without saying\b", ""),
    (r"\bas we've seen\b", ""),
    (r"\bas we have seen\b", ""),
    (r"\bIn this section, we will\b", "This section covers"),
    (r"\bIn this section we will\b", "This section covers"),
    (r"\bNow, let us turn to\b", "Next:"),
    (r"\bNow let us turn to\b", "Next:"),
    (r"\bHaving established\b", ""),
    (r"\bYou are now equipped to\b", ""),
    (r"\bYou should feel confident\b", ""),
    (r"\bNow that you have a solid understanding of\b", ""),
    (r"\bSecurity can feel overwhelming\b", "Security work has many moving parts"),
    (r"\bDon't worry — this is simpler than it sounds\b", ""),
    (r"\bDon't worry - this is simpler than it sounds\b", ""),
    (r"\bExperts agree\b", "In practice"),
    (r"\bResearch shows\b", ""),
    (r"\bIt is widely understood\b", ""),
    (r"\bMany organisations find\b", "Most teams"),
    (r"\bObservers have noted\b", ""),
    (r"\bIt has been found that\b", ""),
    (r"\bStudies show that\b", ""),
    (r"\bIt could be argued that\b", ""),
    (r"\bOne might argue that\b", ""),
    (r"\bMake no mistake\b", ""),
    (r"\bThe fact of the matter is\b", ""),
    (r"\bBy the same token\b", "Similarly"),
    (r"\bOn the same note\b", "Similarly"),
    (r"\bIn summary, we have seen that\b", ""),
    (r"\bIn summary,\b", ""),
    (r"\bTo summarise,\b", ""),
    (r"\bKey takeaway:\b", ""),
    (r"\bKey takeaways:\b", "What this means:"),
    (r"\bDrive organisational alignment\b", "Align teams"),
    (r"\bEnable stakeholder visibility\b", "Give stakeholders visibility"),
    (r"\bSpearhead the initiative\b", "Lead the work"),
    (r"\bspearhead the initiative\b", "lead the work"),
    (r"\bPave the way for\b", "Make possible"),
    (r"\bpave the way for\b", "make possible"),
    (r"\bWhile it is difficult to determine\b", "It depends on"),
    (r"\bThis is a complex area with many factors\b", "Several factors apply"),
    (r"\bnavigate to\b", "open"),  # UI literal often OK; doc uses "open" for sidebar
    (r"\bnavigate filing cabinets\b", "browse filing cabinets"),
    (r"\bnavigate the\b", "browse the"),
    (r"\bNavigate the\b", "Browse the"),
]

DECORATIVE_EMOJI = [
    "\u2753", "\u2b05\ufe0f", "\u2b05", "\U0001f4ca", "\U0001f4cb", "\U0001f4c1",
    "\U0001f9ea", "\U0001f4c5", "\U0001f680", "\u2728", "\U0001f525", "\U0001f4a1",
    "\U0001f6e1\ufe0f", "\U0001f50d", "\u26a1", "\u2705", "\u26a0\ufe0f", "\u26a0",
]

DOC_ROOTS = [
    ROOT / "docs",
    ROOT / "guides",
    ROOT / "pentests",
]
DOC_FILES = [ROOT / "README.md", ROOT / "guides" / "README.md"]

AUDIT_PATTERNS: dict[str, str] = {
    "ban_words": r"\b(additionally|furthermore|moreover|leverage|utilize|comprehensive|robust|seamless|holistic|nuanced|pivotal|facilitate|streamline|synergy|paradigm|ecosystem|actionable|harness|unlock|unleash|supercharge|paramount|crucial|testament|tapestry|intricate|meticulous|sophisticated|unprecedented|enterprise-grade|best-in-class)\b",
    "meta_phrases": r"(it's worth noting|it is worth noting|it's important to note|in today's|let's explore|we'll dive|without further ado|at the end of the day|as mentioned earlier|in summary,|in this section, we will|you are now equipped|experts agree|research shows|make no mistake)",
    "role_plays": r"plays a (crucial|pivotal|vital|important) role",
    "decorative_emoji": r"[✅❓⚡🔍🛡️⚠️🎯📊🔒💡🚀⭐]",
    "front_matter_audience": r"^audience:",
}


def collect_doc_files() -> list[Path]:
    files: list[Path] = []
    for d in DOC_ROOTS:
        if d.exists():
            files.extend(sorted(d.rglob("*.md")))
    for f in DOC_FILES:
        if f.exists() and f not in files:
            files.append(f)
    return files


def strip_decorative_emoji(text: str) -> str:
    text = re.sub(r"^(#{1,6})\s*❓\s*", r"\1 ", text, flags=re.MULTILINE)
    for ch in DECORATIVE_EMOJI:
        text = text.replace(ch, "")
    text = re.sub(r" {2,}", " ", text)
    text = re.sub(r" +([,.;:])", r"\1", text)
    return text


def apply_extra_replacements(text: str) -> str:
    for pat, repl in EXTRA_REPLACEMENTS:
        text = re.sub(pat, repl, text)
    return text


def reduce_body_bold(text: str) -> str:
    """Drop bold on long prose lines; keep UI labels and short terms."""
    lines = []
    for line in text.splitlines():
        if line.startswith("#") or line.startswith("|") or line.startswith("```"):
            lines.append(line)
            continue
        if line.strip().startswith("**") and line.strip().endswith("**") and len(line) > 80:
            inner = line.strip()[2:-2]
            if ":" not in inner and "→" not in inner:
                lines.append(inner)
                continue
        lines.append(line)
    return "\n".join(lines)


def audit_text(text: str) -> Counter[str]:
    hits: Counter[str] = Counter()
    for name, pat in AUDIT_PATTERNS.items():
        found = re.findall(pat, text, re.I | re.M)
        if found:
            hits[name] += len(found)
    hits["em_dash"] += text.count("\u2014")
    return hits


def process_file(fp: Path, docs_batch, guides_batch, batch) -> tuple[bool, Counter[str]]:
    key = str(fp.relative_to(ROOT)).replace("\\", "/")
    orig = fp.read_text(encoding="utf-8")
    pre_hits = audit_text(orig)

    if key.startswith("guides/"):
        new, _stats = guides_batch.humanize_file(orig)
        new = batch.full_humanize(new)
    elif key.startswith("docs/") or key.startswith("pentests/") or key == "README.md":
        new = docs_batch.humanize_file(orig, key)
    else:
        new = lib_humanize(orig)

    new = clean_front_matter(new)
    new = strip_decorative_emoji(new)
    new = apply_extra_replacements(new)
    new = reduce_body_bold(new)
    new = re.sub(r"^[ \t]+,", "", new, flags=re.MULTILINE)
    new = re.sub(r"\.\s+\.", ".", new)
    new = re.sub(r"\n{4,}", "\n\n\n", new)
    new = new.rstrip() + "\n"

    changed = new != orig
    if changed:
        fp.write_text(new, encoding="utf-8")

    post_hits = audit_text(new)
    delta = Counter()
    for k in set(pre_hits) | set(post_hits):
        removed = pre_hits[k] - post_hits[k]
        if removed > 0:
            delta[k] = removed
    return changed, delta


def main() -> None:
    docs_batch = importlib.import_module("humanize_docs_batch")
    guides_batch = importlib.import_module("humanize_guides_batch")
    batch = importlib.import_module("humanize_batch")

    files = collect_doc_files()
    changed_count = 0
    total_delta: Counter[str] = Counter()
    flags: list[str] = []

    for fp in files:
        changed, delta = process_file(fp, docs_batch, guides_batch, batch)
        if changed:
            changed_count += 1
        total_delta.update(delta)

        rel = fp.relative_to(ROOT)
        text = fp.read_text(encoding="utf-8")
        if rel.as_posix().startswith("docs/") and len(text.splitlines()) <= 7:
            body = [l for l in text.splitlines() if l.strip() and not l.startswith("#")]
            if len(body) <= 1:
                flags.append(f"{rel}: stub remains minimal — expand from source if needed")
        if text.count("\u2014") > 4 and rel.as_posix() != "README.md":
            flags.append(f"{rel}: {text.count(chr(0x2014))} em dashes remain (product names may be intentional)")
        if re.search(AUDIT_PATTERNS["ban_words"], text, re.I):
            flags.append(f"{rel}: ban-list word still present after pass")
        if re.search(AUDIT_PATTERNS["meta_phrases"], text, re.I):
            flags.append(f"{rel}: meta phrase still present after pass")

    print("=== HUMAN EDITOR PASS COMPLETE ===")
    print(f"files_processed={len(files)}")
    print(f"files_edited={changed_count}")
    print("top_patterns_removed:")
    for name, count in total_delta.most_common(5):
        print(f"  {name}: {count}")
    if flags:
        print("flags_for_human_review:")
        for f in flags[:25]:
            print(f"  - {f}")
        if len(flags) > 25:
            print(f"  ... and {len(flags) - 25} more")


if __name__ == "__main__":
    main()
