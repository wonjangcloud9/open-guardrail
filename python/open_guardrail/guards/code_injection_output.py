"""Detect code injection patterns in AI output."""
from __future__ import annotations

import re
import time

from open_guardrail.core import GuardResult

_CODE_BLOCK = re.compile(r"```[\s\S]*?```")

_INJECTION: list[re.Pattern[str]] = [
    re.compile(
        r"<script\b[^>]*>[\s\S]*?</script>",
        re.IGNORECASE,
    ),
    re.compile(
        r"\bon\w+\s*=\s*[\"'][^\"']*[\"']",
        re.IGNORECASE,
    ),
    re.compile(r"javascript\s*:", re.IGNORECASE),
    re.compile(
        r"\bSELECT\b.*\bFROM\b.*\bWHERE\b",
        re.IGNORECASE,
    ),
    re.compile(r"\bDROP\s+TABLE\b", re.IGNORECASE),
    re.compile(r"\bINSERT\s+INTO\b", re.IGNORECASE),
    re.compile(r"\bUNION\s+SELECT\b", re.IGNORECASE),
    re.compile(r"\b(?:sudo|chmod|chown)\s+"),
    re.compile(r"\brm\s+-rf\s+/"),
    re.compile(r"\bcurl\s+.*\|\s*(?:bash|sh)\b"),
    re.compile(r"\bwget\s+.*\|\s*(?:bash|sh)\b"),
    re.compile(r"\beval\s*\("),
    re.compile(r"\bnew\s+Function\s*\("),
    re.compile(
        r"document\.(?:cookie|write|location)",
        re.IGNORECASE,
    ),
    re.compile(
        r"window\.(?:location|eval|execScript)",
        re.IGNORECASE,
    ),
]


class _CodeInjectionOutput:
    def __init__(self, *, action: str = "block") -> None:
        self.name = "code-injection-output"
        self.action = action

    def check(
        self, text: str, stage: str = "output"
    ) -> GuardResult:
        start = time.perf_counter()
        plain = _CODE_BLOCK.sub("", text)
        matched: list[str] = []

        for p in _INJECTION:
            if p.search(plain):
                matched.append(p.pattern)

        triggered = len(matched) > 0
        score = (
            min(len(matched) / 3, 1.0)
            if triggered
            else 0.0
        )
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="code-injection-output",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=score,
            message=(
                "Code injection detected in output"
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


def code_injection_output(
    *, action: str = "block"
) -> _CodeInjectionOutput:
    return _CodeInjectionOutput(action=action)
