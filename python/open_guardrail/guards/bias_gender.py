"""Gender bias detection guard."""
from __future__ import annotations

import re
import time

from open_guardrail.core import GuardResult

_GENDERED_TITLES: list[tuple[re.Pattern[str], str]] = [
    (re.compile(r"\bchairman\b", re.I), "chairperson"),
    (re.compile(r"\bfireman\b", re.I), "firefighter"),
    (re.compile(r"\bpoliceman\b", re.I), "police officer"),
    (re.compile(r"\bstewardess\b", re.I), "flight attendant"),
    (re.compile(r"\bmailman\b", re.I), "mail carrier"),
    (re.compile(r"\bmanpower\b", re.I), "workforce"),
    (re.compile(r"\bmanmade\b", re.I), "artificial"),
]

_STEREOTYPES: list[re.Pattern[str]] = [
    re.compile(r"\bwomen\s+should\b", re.I),
    re.compile(r"\bmen\s+always\b", re.I),
    re.compile(r"\bmen\s+are\s+better\s+at\b", re.I),
    re.compile(r"\bwomen\s+are\s+too\s+emotional\b", re.I),
    re.compile(r"\bgirls\s+can'?t\b", re.I),
    re.compile(r"\bboys\s+don'?t\s+cry\b", re.I),
    re.compile(r"\bnot\s+a\s+job\s+for\s+women\b", re.I),
    re.compile(r"\blike\s+a\s+girl\b", re.I),
    re.compile(r"\bman\s+up\b", re.I),
]


class _BiasGender:
    def __init__(self, *, action: str = "warn") -> None:
        self.name = "bias-gender"
        self.action = action

    def check(
        self, text: str, stage: str = "output"
    ) -> GuardResult:
        start = time.perf_counter()
        issues: list[str] = []

        for pat, suggestion in _GENDERED_TITLES:
            if pat.search(text):
                issues.append(
                    f"gendered-title: Use '{suggestion}'"
                )

        for pat in _STEREOTYPES:
            if pat.search(text):
                issues.append("stereotype")
                break

        triggered = len(issues) > 0
        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(
            guard_name="bias-gender",
            passed=not triggered,
            action=self.action if triggered else "allow",
            message=(
                "Gender bias detected"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {"issues": issues} if triggered else None
            ),
        )


def bias_gender(
    *, action: str = "warn"
) -> _BiasGender:
    return _BiasGender(action=action)
