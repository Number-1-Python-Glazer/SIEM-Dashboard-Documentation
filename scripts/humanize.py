#!/usr/bin/env python3
"""Unified documentation humanize CLI (consolidates humanize_*.py scripts)."""
from __future__ import annotations

import argparse
import importlib
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCRIPTS = Path(__file__).resolve().parent

PROFILES: dict[str, tuple[str, str]] = {
    "minimal": ("humanize_docs", "Word-replacement pass on all markdown files"),
    "docs": ("humanize_docs_batch", "docs/, pentests/, README.md batch pass"),
    "guides-config": ("humanize_batch", "infrastructure/configure/reporting/ingest guides"),
    "guides-deep": ("humanize_guides_batch", "respond/intelligence deep structure pass"),
    "round2": ("humanize_docs_round2", "Targeted round-2 doc rewrites"),
    "editor": ("humanize_editor_pass", "Full 6-part human editor pass (docs + guides + pentests)"),
}


def main(argv: list[str] | None = None) -> None:
    parser = argparse.ArgumentParser(description="Humanize SIEM documentation markdown")
    parser.add_argument(
        "profile",
        choices=sorted(PROFILES),
        help="Humanize profile to run",
    )
    parser.add_argument(
        "paths",
        nargs="*",
        help="Optional extra paths (guides-config / guides-deep only)",
    )
    args = parser.parse_args(argv)

    sys.path.insert(0, str(SCRIPTS))
    mod_name, _desc = PROFILES[args.profile]
    mod = importlib.import_module(mod_name)

    if args.profile == "guides-config":
        targets = mod.collect_targets()
        if args.paths:
            targets = [Path(p) for p in args.paths]
        stats = mod.process_paths(targets)
        print(stats)
        return

    if args.profile == "guides-deep":
        targets = [ROOT / "guides" / "respond", ROOT / "guides" / "intelligence"]
        if args.paths:
            targets = [Path(p) for p in args.paths]
        stats = mod.process_paths(targets)
        print(stats)
        return

    if args.paths and hasattr(mod, "process_paths"):
        stats = mod.process_paths([Path(p) for p in args.paths])
        print(stats)
        return

    if args.profile == "minimal":
        from humanize_lib import humanize as humanize_text

        changed = 0
        for fp in ROOT.rglob("*.md"):
            if "__pycache__" in str(fp):
                continue
            orig = fp.read_text(encoding="utf-8")
            new = humanize_text(orig)
            if new != orig:
                fp.write_text(new, encoding="utf-8")
                changed += 1
        print(f"humanized {changed} markdown files")
        return

    if hasattr(mod, "main"):
        mod.main()
        return

    raise SystemExit(f"Profile {args.profile} has no runnable entry point")


if __name__ == "__main__":
    main()
