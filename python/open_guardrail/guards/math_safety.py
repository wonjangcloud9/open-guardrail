"""Validate mathematical content safety."""
from __future__ import annotations

import re
import time

from open_guardrail.core import GuardResult

_DIV_ZERO = re.compile(
    r"(?:/\s*0(?:\s|$|[.,;)])"
    r"|divid(?:e|ed|ing)\s+by\s+zero)",
    re.IGNORECASE,
)
_OVERFLOW = re.compile(
    r"(?:10\s*\*\*\s*\d{4,}|2\s*\*\*\s*\d{3,}|\d{20,})"
)
_NAN = re.compile(
    r"(?:NaN|(?:^|\s)nan(?:\s|$)|not\s+a\s+number)",
    re.IGNORECASE,
)
_INF_LOOP = re.compile(
    r"(?:while\s*\(\s*true\s*\)"
    r"|for\s*\(\s*;\s*;\s*\)"
    r"|infinite\s+loop)",
    re.IGNORECASE,
)
_SCI_ABUSE = re.compile(r"\d+[eE][+-]?\d{4,}")


class _MathSafety:
    def __init__(self, *, action: str = "warn") -> None:
        self.name = "math-safety"
        self.action = action

    def check(self, text: str, stage: str = "output") -> GuardResult:
        start = time.perf_counter()
        issues: list[str] = []

        if _DIV_ZERO.search(text):
            issues.append("division-by-zero")
        if _OVERFLOW.search(text):
            issues.append("potential-overflow")
        if _NAN.search(text):
            issues.append("nan-propagation")
        if _INF_LOOP.search(text):
            issues.append("infinite-loop")
        if _SCI_ABUSE.search(text):
            issues.append("scientific-notation-abuse")

        triggered = len(issues) > 0
        score = min(len(issues) / 3, 1.0) if triggered else 0.0
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="math-safety",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=score,
            message=(
                "Mathematical safety issue detected"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details={"issues": issues} if triggered else None,
        )


def math_safety(*, action: str = "warn") -> _MathSafety:
    return _MathSafety(action=action)
