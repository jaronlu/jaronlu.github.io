#!/usr/bin/env python3
"""Block Windows-style file paths before Claude Code writes on macOS."""

import json
import re
import sys


WINDOWS_DRIVE_PATH = re.compile(r"^[A-Za-z]:[\\/]")
PATH_KEYS = ("file_path", "notebook_path", "path")


def main() -> int:
    try:
        event = json.load(sys.stdin)
    except (json.JSONDecodeError, UnicodeDecodeError):
        return 0

    tool_input = event.get("tool_input") or {}
    for key in PATH_KEYS:
        path = tool_input.get(key)
        if not isinstance(path, str):
            continue
        if "\\" in path or WINDOWS_DRIVE_PATH.match(path):
            print(
                "Blocked invalid Windows-style path on macOS: "
                f"{path!r}. Use a repository-relative POSIX path such as "
                "'CLAUDE.md' or 'docs/index.md'. Run pwd -P and "
                "git rev-parse --show-toplevel before retrying.",
                file=sys.stderr,
            )
            return 2

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
