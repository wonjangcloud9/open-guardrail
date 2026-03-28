"""Detect file system paths that could reveal server info."""
from __future__ import annotations

import re
import time
from typing import Optional

from open_guardrail.core import GuardResult

_DEFAULT_PATTERNS: list[re.Pattern[str]] = [
    re.compile(r"/home/[a-zA-Z0-9_-]+/"),
    re.compile(r"/Users/[a-zA-Z0-9_-]+/"),
    re.compile(r"C:\\Users\\[a-zA-Z0-9_-]+\\"),
    re.compile(r"/var/log/[a-zA-Z0-9_.-]+"),
    re.compile(r"/etc/passwd"),
    re.compile(r"/etc/shadow"),
    re.compile(r"/etc/hosts"),
    re.compile(r"/root/"),
    re.compile(r"/tmp/[a-zA-Z0-9_.-]+"),
    re.compile(
        r"[A-Z]:\\Windows\\[a-zA-Z0-9_\\.-]+"
    ),
    re.compile(
        r"/opt/[a-zA-Z0-9_.-]+/[a-zA-Z0-9_.-]+"
    ),
    re.compile(r"/srv/[a-zA-Z0-9_.-]+"),
]


class _FilePathDetect:
    def __init__(self, *, action: str = "block") -> None:
        self.name = "file-path-detect"
        self.action = action
        self._patterns = list(_DEFAULT_PATTERNS)

    def check(
        self, text: str, stage: str = "output"
    ) -> GuardResult:
        start = time.perf_counter()
        matched: list[str] = []

        for pat in self._patterns:
            if pat.search(text):
                matched.append(pat.pattern)

        triggered = len(matched) > 0
        score = (
            min(len(matched) / 3, 1.0)
            if triggered
            else 0.0
        )
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="file-path-detect",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=score,
            message=(
                "File system path detected"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {"matched_patterns": len(matched)}
                if triggered
                else None
            ),
        )


def file_path_detect(
    *, action: str = "block"
) -> _FilePathDetect:
    return _FilePathDetect(action=action)
