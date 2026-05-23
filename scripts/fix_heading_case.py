#!/usr/bin/env python3
"""Fix heading sentence case: capitalize first word, lower subsequent title-case words."""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DOC_ROOTS = [ROOT / "docs", ROOT / "guides", ROOT / "pentests"]
DOC_FILES = [ROOT / "README.md", ROOT / "guides" / "README.md"]

LOWER_WORDS = {
    "the", "a", "an", "and", "or", "vs", "for", "to", "in", "on", "at", "by", "with",
    "from", "of", "when", "if", "as", "is", "are", "be", "not", "but", "that", "this",
}


def fix_heading_line(line: str) -> str:
    m = re.match(r"^(#{1,6}\s+)(.+)$", line)
    if not m:
        return line
    prefix, title = m.group(1), m.group(2)
    if title.startswith("`") or "**" in title[:3]:
        return line
    words = title.split()
    if not words:
        return line
    fixed = []
    for i, word in enumerate(words):
        bare = re.sub(r"^[^A-Za-z0-9]+|[^A-Za-z0-9]+$", "", word)
        if not bare:
            fixed.append(word)
            continue
        if i == 0:
            if bare[0].islower():
                idx = word.index(bare[0])
                fixed.append(word[:idx] + bare[0].upper() + word[idx + 1 :])
            else:
                fixed.append(word)
        elif bare.isupper() and len(bare) <= 4:
            fixed.append(word)
        elif bare.lower() in LOWER_WORDS:
            lead = word[: word.index(bare[0])] if bare[0] in word else ""
            trail = word[len(lead) + len(bare) :]
            fixed.append(lead + bare.lower() + trail)
        elif bare[0].isupper() and bare[1:].islower():
            lead = word[: word.index(bare[0])] if bare[0] in word else ""
            trail = word[len(lead) + len(bare) :]
            fixed.append(lead + bare.lower() + trail)
        else:
            fixed.append(word)
    return prefix + " ".join(fixed)


def main() -> None:
    files = []
    for d in DOC_ROOTS:
        files.extend(d.rglob("*.md"))
    for f in DOC_FILES:
        if f.exists() and f not in files:
            files.append(f)

    changed = 0
    for fp in sorted(files):
        lines = fp.read_text(encoding="utf-8").splitlines()
        new_lines = []
        file_changed = False
        for line in lines:
            if re.match(r"^#{2,6}\s+[a-z]", line):
                nl = fix_heading_line(line)
                if nl != line:
                    file_changed = True
                new_lines.append(nl)
            else:
                new_lines.append(line)
        if file_changed:
            fp.write_text("\n".join(new_lines).rstrip() + "\n", encoding="utf-8")
            changed += 1
    print(f"fixed_heading_case_in={changed}")


if __name__ == "__main__":
    main()
