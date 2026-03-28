"""Detect debug information in output."""
from __future__ import annotations

import re
import time
from typing import Optional

from open_guardrail.core import GuardResult

_DEFAULT_PATTERNS: list[re.Pattern[str]] = [
    re.compile(
        r"console\.(log|debug|trace|warn"
        r"|error)\s*\("
    ),
    re.compile(r"\bprint\s*\([^)]*\)"),
    re.compile(r"\bDEBUG:"),
    re.compile(r"\bTRACE:"),
    re.compile(r"\bVERBOSE:"),
    re.compile(r"\bbreakpoint\s*\(\)"),
    re.compile(r"\bdebugger\b"),
    re.compile(r"\bpdb\.set_trace\s*\(\)"),
    re.compile(r"\b(binding|byebug)\.pry\b"),
    re.compile(r"\bvar_dump\s*\("),
    re.compile(r"\bdd\s*\("),
    re.compile(r"\bSystem\.out\.println\s*\("),
]


class _DebugInfoDetect:
    def __init__(self, *, action: str = "block") -> None:
        self.name = "debug-info-detect"
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
            guard_name="debug-info-detect",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=score,
            message=(
                "Debug information detected"
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


def debug_info_detect(
    *, action: str = "block"
) -> _DebugInfoDetect:
    return _DebugInfoDetect(action=action)
