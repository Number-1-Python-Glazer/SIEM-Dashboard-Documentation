#!/usr/bin/env python3
"""Targeted human-editing pass for guide markdown batches."""
from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

# Import replacements from humanize_docs
sys.path.insert(0, str(Path(__file__).parent))
from humanize_docs import WORD_REPLACEMENTS, clean_front_matter, humanize as base_humanize

PROPER_NOUNS = {
    "HABIBI-SIEM", "HABIBI", "SIEM", "SOC", "UEBA", "SOAR", "MITRE", "RBAC", "NIST",
    "GDPR", "SEC", "STRIDE", "SCQA", "RACI", "CISO", "MTTR", "MTTD", "KPI", "KPIs",
    "SQLite", "React", "JavaScript", "TypeScript", "JSON", "YAML", "API", "HTTP",
    "HTTPS", "TCP", "UDP", "IP", "IPv4", "DNS", "VPN", "AWS", "Azure", "GCP",
    "Windows", "Linux", "macOS", "Cron", "Grok", "Sigma", "IOC", "IOCs", "TTP",
    "TTPs", "ACK", "RES", "SIM", "EXPAND", "COLLAPSE", "CSV", "PDF", "HTML",
    "Express", "Tailwind", "Overview", "Analytics", "Dashboard", "Builder",
    "Scheduler", "Executive", "Monitor", "Configure", "Reporting", "Infrastructure",
    "Investigate", "Respond", "Intelligence", "Case", "Manager", "Engine",
    "Brute", "Force", "Attack", "SQL", "NAT", "O(n²)", "IP_WINDOW_MS",
}

META_PATTERNS = [
    (r"\bIn this section, we will\b", "This section covers"),
    (r"\bIn this section we will\b", "This section covers"),
    (r"\bNow, let us turn to\b", "Next:"),
    (r"\bNow let us turn to\b", "Next:"),
    (r"\bHaving established .+?, we can now examine\b", "Next, examine"),
    (r"\bAs we've seen\b", ""),
    (r"\bAs we have seen\b", ""),
    (r"\bYou are now equipped to\b", ""),
    (r"\bYou should feel confident\b", ""),
    (r"\bNow that you have a solid understanding of\b", ""),
    (r"\bSecurity can feel overwhelming\b", "Security work has many moving parts"),
    (r"\bDon't worry — this is simpler than it sounds\b", ""),
    (r"\bDon't worry — this is simpler than it sounds\.\b", ""),
    (r"\bExperts agree\b", "In practice"),
    (r"\bResearch shows\b", ""),
    (r"\bIt is widely understood\b", ""),
    (r"\bMany organisations find\b", "Most teams"),
    (r"\bObservers have noted\b", ""),
    (r"\bIt has been found that\b", ""),
    (r"\bStudies show that\b", ""),
    (r"\bIt could be argued that\b", ""),
    (r"\bOne might argue that\b", ""),
    (r"\bWhether you are a .+? or a .+?, \b", ""),
    (r"\bIt's not just about\b", ""),
    (r"\bThis isn't about\b", ""),
    (r"\bNot only .+? but also\b", ""),
    (r"\bMake no mistake\b", ""),
    (r"\bThe fact of the matter is\b", ""),
    (r"\bBy the same token\b", "Similarly"),
    (r"\bOn the same note\b", "Similarly"),
    (r"\bIn summary, we have seen that\b", ""),
    (r"\bIn summary,\b", ""),
    (r"\bTo summarise,\b", ""),
    (r"\bKey takeaway:\b", ""),
    (r"\bKey takeaways:\b", "What this means:"),
]

SUMMARY_REWORD = [
    (r"^Summary slide for training deck:", "Training deck one-liner:"),
    (r"^For non-technical readers,", "Plain-language recap:"),
    (r"^Industry vocabulary precision:", "Vocabulary split:"),
    (r"^Extended operational context for", "Operational context for"),
    (r"^Training programmes should", "Training defaults:"),
    (r"^Layout comparison reinforces", "Layout comparison:"),
    (r"^False correlation risks:", "False correlation risks:"),
    (r"^Correlation vocabulary quiz", "Onboarding quiz:"),
]


def sentence_case_heading(text: str) -> str:
    if not text.strip():
        return text
    # Preserve inline code, bold, links
    if text.startswith("#"):
        prefix = re.match(r"^(#+\s*)", text)
        hashes = prefix.group(1) if prefix else ""
        body = text[len(hashes):]
    else:
        hashes = ""
        body = text

    # Split preserving **bold** and `code` and paths with →
    parts = re.split(r"(\*\*[^*]+\*\*|`[^`]+`|→|//)", body)
    out = []
    for i, part in enumerate(parts):
        if part in ("→", "//") or part.startswith("**") or part.startswith("`"):
            out.append(part)
            continue
        words = part.split()
        if not words:
            out.append(part)
            continue
        new_words = []
        for j, w in enumerate(words):
            bare = re.sub(r"[^\w\-/().]", "", w)
            if bare in PROPER_NOUNS or bare.isupper() and len(bare) > 1:
                new_words.append(w)
            elif j == 0:
                new_words.append(w)
            elif bare.lower() in {
                "the", "a", "an", "and", "or", "vs", "for", "to", "in", "on", "at",
                "by", "with", "from", "of", "when", "if", "as", "is", "are", "be",
            }:
                new_words.append(w.lower())
            elif bare in PROPER_NOUNS:
                new_words.append(w)
            else:
                # Title case word -> sentence case unless proper noun
                if w[0].isupper() and w[1:].islower():
                    new_words.append(w.lower())
                else:
                    new_words.append(w)
        out.append(" ".join(new_words))
    return hashes + "".join(out)


def replace_em_dash_in_line(line: str) -> str:
    dash = "\u2014"
    if dash not in line and "—" not in line:
        return line

    if re.match(r"^#+\s", line):
        line = re.sub(rf"\s*{dash}\s*", ": ", line, count=1)
        return line.replace("—", ": ")

    line = re.sub(rf"\b(Stage \d+)\s*{dash}\s*", r"\1: ", line)

    m = re.match(rf"^(\s*\d+\.\s.+?)\s*{dash}\s*(.+)$", line)
    if m:
        tail = m.group(2)
        if tail and tail[0].islower():
            return f"{m.group(1)}. {tail[0].upper()}{tail[1:]}"
        return f"{m.group(1)}. {tail}"

    # spaced em-dashes
    parts = re.split(rf"\s*{dash}\s*", line)
    if len(parts) > 1:
        result = parts[0]
        for part in parts[1:]:
            if part and part[0].islower():
                result = f"{result}, {part}"
            elif len(part.split()) <= 8:
                result = f"{result}: {part}"
            else:
                cap = part[0].upper() + part[1:] if part else part
                result = f"{result}. {cap}"
        line = result

    # tight em-dashes (no spaces), common in AI prose
    line = re.sub(rf"(\w){dash}(\w)", r"\1, \2", line)
    return line.replace("—", ", ")


def reduce_em_dashes(text: str, max_count: int = 2) -> str:
    lines = [replace_em_dash_in_line(ln) for ln in text.splitlines()]
    text = "\n".join(lines)
    dash = "\u2014"

    def count_dashes(s: str) -> int:
        return s.count(dash) + s.count("—")

    while count_dashes(text) > max_count:
        before = count_dashes(text)
        text = re.sub(rf"\s*{dash}\s*", ", ", text, count=1)
        if count_dashes(text) == before:
            text = re.sub(rf"(\w){dash}(\w)", r"\1, \2", text, count=1)
        if count_dashes(text) == before:
            text = text.replace(dash, ", ", 1)
        if count_dashes(text) == before:
            text = text.replace("—", ", ", 1)
        if count_dashes(text) == before:
            break
    return text


def fix_headings(text: str) -> str:
    lines = []
    for line in text.splitlines():
        # Leave #### Q&A headings alone; sentence_case breaks **bold** inside them
        if re.match(r"^#{1,3}\s", line):
            lines.append(sentence_case_heading(line))
        else:
            lines.append(line)
    return "\n".join(lines)


def trim_redundant_rules(text: str) -> str:
    # Remove duplicate --- after front matter block when followed by content
    text = re.sub(r"(---\n\n)---\n", r"\1", text)
    # Remove trailing --- before EOF if only one doc
    text = re.sub(r"\n---\s*\Z", "", text)
    return text


def reword_notably_additionally(text: str) -> str:
    text = re.sub(r"\badditionally\b", "also", text, flags=re.I)
    text = re.sub(r"\bAdditionally\b", "Also", text)
    # notably at start of clause
    text = re.sub(r", notably ", ", especially ", text, flags=re.I)
    text = re.sub(r" — notably ", ", especially ", text, flags=re.I)
    text = re.sub(r"^Notably, ", "", text, flags=re.M)
    text = re.sub(r"\. Notably, ", ". ", text)
    return text


def full_humanize(text: str) -> str:
    text = clean_front_matter(text)
    text = re.sub(r"^####\s*❓\s*", "#### ", text, flags=re.MULTILINE)
    text = re.sub(r"^###\s*❓\s*", "### ", text, flags=re.MULTILINE)
    for pat, repl in WORD_REPLACEMENTS:
        text = re.sub(pat, repl, text)
    for pat, repl in META_PATTERNS:
        text = re.sub(pat, repl, text, flags=re.IGNORECASE)
    text = reword_notably_additionally(text)
    for pat, repl in SUMMARY_REWORD:
        text = re.sub(pat, repl, text, flags=re.MULTILINE)
    text = reduce_em_dashes(text)
    text = fix_headings(text)
    text = trim_redundant_rules(text)
    text = re.sub(r"^[ \t]+,", "", text, flags=re.MULTILINE)
    text = re.sub(r"\.\s+\.", ".", text)
    text = re.sub(r"  +", " ", text)
    text = re.sub(r" ,", ",", text)
    return text


def process_paths(paths: list[Path]) -> dict:
    stats = {
        "edited": 0,
        "em_dash_before": 0,
        "em_dash_after": 0,
        "notably": 0,
        "additionally": 0,
        "question_emoji": 0,
        "audience_removed": 0,
        "deep_dive": 0,
    }
    for fp in paths:
        if not fp.exists():
            continue
        orig = fp.read_text(encoding="utf-8")
        stats["em_dash_before"] += orig.count("—")
        stats["notably"] += len(re.findall(r"\bnotably\b", orig, re.I))
        stats["additionally"] += len(re.findall(r"\badditionally\b", orig, re.I))
        stats["question_emoji"] += orig.count("❓")
        stats["audience_removed"] += len(re.findall(r"^audience:", orig, re.M))
        stats["deep_dive"] += len(re.findall(r"deep[- ]dive", orig, re.I))

        new = full_humanize(orig)
        stats["em_dash_after"] += new.count("—")
        if new != orig:
            fp.write_text(new, encoding="utf-8")
            stats["edited"] += 1
    return stats


def collect_targets() -> list[Path]:
    dirs = [
        ROOT / "guides" / "infrastructure",
        ROOT / "guides" / "configure",
        ROOT / "guides" / "reporting",
        ROOT / "guides" / "ingest-config",
    ]
    files: list[Path] = []
    for d in dirs:
        if d.exists():
            files.extend(sorted(d.rglob("*.md")))
    readme = ROOT / "guides" / "README.md"
    if readme.exists():
        files.append(readme)
    return files


if __name__ == "__main__":
    targets = collect_targets()
    if len(sys.argv) > 1:
        targets = [Path(p) for p in sys.argv[1:]]
    stats = process_paths(targets)
    print(f"processed {len(targets)} files, edited {stats['edited']}")
    print(f"em-dash: {stats['em_dash_before']} -> {stats['em_dash_after']}")
    print(f"notably hits in source: {stats['notably']}")
    print(f"additionally hits in source: {stats['additionally']}")
    print(f"question emoji in source: {stats['question_emoji']}")
    print(f"audience lines in source: {stats['audience_removed']}")
    print(f"deep-dive refs in source: {stats['deep_dive']}")
