"""Comprehensive Unicode safety checks."""

import re
import time
from open_guardrail.core import GuardResult

_PATTERNS: list[re.Pattern[str]] = [
    re.compile(r"[\u202A\u202B\u202C\u202D\u202E]"),
    re.compile(r"[\u2066\u2067\u2068\u2069]"),
    re.compile(r"[\u200E\u200F]"),
    re.compile(r"(?!^)\uFEFF"),
    re.compile(r"[\U000E0001-\U000E007F]"),
    re.compile(r"[\uFE00-\uFE0F]"),
    re.compile(r"[\u200B\u200C\u200D]"),
    re.compile(r"[\u2060\u2061\u2062\u2063\u2064]"),
    re.compile(r"\u00AD"),
    re.compile(r"[\u034F\u115F\u1160\u17B4\u17B5]"),
]


class _UnicodeSafety:
    def __init__(self, *, action: str = "block") -> None:
        self.name = "unicode-safety"
        self.action = action
        self._patterns = list(_PATTERNS)

    def check(self, text: str, stage: str = "input") -> GuardResult:
        start = time.perf_counter()
        matched: list[str] = []
        for pat in self._patterns:
            if pat.search(text):
                matched.append(pat.pattern)
        triggered = len(matched) > 0
        score = min(len(matched) / 3, 1.0) if triggered else 0.0
        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(
            guard_name="unicode-safety",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=score,
            message="Unsafe Unicode detected" if triggered else None,
            latency_ms=round(elapsed, 2),
            details=(
                {"matched_patterns": len(matched)}
                if triggered
                else None
            ),
        )


def unicode_safety(*, action: str = "block") -> _UnicodeSafety:
    return _UnicodeSafety(action=action)
