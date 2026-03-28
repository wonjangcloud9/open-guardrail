"""Safety checks for code blocks in AI responses."""
from __future__ import annotations

import re
import time

from open_guardrail.core import GuardResult

_PATTERNS: list[re.Pattern[str]] = [
    re.compile(r"rm\s+-rf\s+/"),
    re.compile(r"DROP\s+TABLE", re.IGNORECASE),
    re.compile(r"DROP\s+DATABASE", re.IGNORECASE),
    re.compile(
        r"eval\s*\(\s*(user|input|req|request)",
        re.IGNORECASE,
    ),
    re.compile(
        r"password\s*=\s*[\"'][^\"']{3,}[\"']",
        re.IGNORECASE,
    ),
    re.compile(
        r"secret\s*=\s*[\"'][^\"']{3,}[\"']",
        re.IGNORECASE,
    ),
    re.compile(
        r"api_?key\s*=\s*[\"'][^\"']{3,}[\"']",
        re.IGNORECASE,
    ),
    re.compile(
        r"exec\s*\(\s*[\"'].*\bsh\b", re.IGNORECASE
    ),
    re.compile(r"os\.system\s*\(", re.IGNORECASE),
    re.compile(
        r"subprocess\.call\s*\(\s*[\"'].*\brm\b",
        re.IGNORECASE,
    ),
    re.compile(r"chmod\s+777"),
    re.compile(r"mkfs\s+"),
    re.compile(r">\s*/dev/sda"),
    re.compile(r"format\s+[cC]:", re.IGNORECASE),
]


class _CodeBlockSafety:
    def __init__(self, *, action: str = "block") -> None:
        self.name = "code-block-safety"
        self.action = action

    def check(
        self, text: str, stage: str = "output"
    ) -> GuardResult:
        start = time.perf_counter()
        matched: list[str] = []

        for pat in _PATTERNS:
            if pat.search(text):
                matched.append(pat.pattern)

        triggered = len(matched) > 0
        score = min(len(matched) / 3, 1.0) if triggered else 0.0
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="code-block-safety",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=score,
            message=(
                "Unsafe code pattern detected"
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


def code_block_safety(
    *, action: str = "block"
) -> _CodeBlockSafety:
    return _CodeBlockSafety(action=action)
