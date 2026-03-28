"""Check quality of AI refusals."""
from __future__ import annotations

import re
import time

from open_guardrail.core import GuardResult

_HARSH: list[re.Pattern[str]] = [
    re.compile(
        r"\byou\s+should\s+be\s+ashamed\b",
        re.IGNORECASE,
    ),
    re.compile(r"\bhow\s+dare\s+you\b", re.IGNORECASE),
    re.compile(
        r"\bthat'?s\s+(?:a\s+)?"
        r"(?:stupid|dumb|idiotic)"
        r"\s+(?:question|request)\b",
        re.IGNORECASE,
    ),
    re.compile(
        r"\bI\s+refuse\s+to\s+(?:even\s+)?"
        r"(?:dignify|acknowledge)\b",
        re.IGNORECASE,
    ),
]

_VAGUE: list[re.Pattern[str]] = [
    re.compile(
        r"^I\s+can'?t\s+help\s+with\s+that\.?\s*$",
        re.IGNORECASE | re.MULTILINE,
    ),
    re.compile(
        r"^I'?m\s+(?:unable|not\s+able)"
        r"\s+to\s+(?:help|assist)\.?\s*$",
        re.IGNORECASE | re.MULTILINE,
    ),
    re.compile(
        r"^(?:Sorry|No),?\s+I\s+can'?t\.?\s*$",
        re.IGNORECASE | re.MULTILINE,
    ),
    re.compile(
        r"^I\s+(?:can'?t|won'?t)\s+do\s+that\.?\s*$",
        re.IGNORECASE | re.MULTILINE,
    ),
]

_NO_REASON: re.Pattern[str] = re.compile(
    r"\bI\s+(?:can'?t|won'?t|am\s+unable\s+to)\b"
    r"(?!.*\b(?:because|since|as|due\s+to"
    r"|the\s+reason|in\s+order\s+to"
    r"|however|instead)\b)",
    re.IGNORECASE,
)

_ILLEGAL_ALT: list[re.Pattern[str]] = [
    re.compile(
        r"\binstead\s*,?\s*(?:you\s+(?:could|might|can)"
        r"\s+)?(?:try|use|go\s+to)\s+(?:the\s+)?"
        r"(?:dark\s*web|tor|black\s*market)",
        re.IGNORECASE,
    ),
    re.compile(
        r"\bthere\s+are\s+(?:other\s+)?"
        r"(?:illegal|underground)"
        r"\s+(?:ways|methods|channels)\b",
        re.IGNORECASE,
    ),
]


class _RefusalQuality:
    def __init__(self, *, action: str = "warn") -> None:
        self.name = "refusal-quality"
        self.action = action

    def check(
        self, text: str, stage: str = "output"
    ) -> GuardResult:
        start = time.perf_counter()
        issues: list[str] = []

        if any(p.search(text) for p in _HARSH):
            issues.append("harsh_refusal")
        if any(p.search(text) for p in _VAGUE):
            issues.append("vague_refusal")
        if _NO_REASON.search(text) and len(text) < 200:
            issues.append("no_explanation")
        if any(p.search(text) for p in _ILLEGAL_ALT):
            issues.append("illegal_alternative")

        triggered = len(issues) > 0
        score = (
            min(len(issues) / 3, 1.0)
            if triggered
            else 0.0
        )
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="refusal-quality",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=score,
            message=(
                "Poor refusal quality detected"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {"issues": issues} if triggered else None
            ),
        )


def refusal_quality(
    *, action: str = "warn"
) -> _RefusalQuality:
    return _RefusalQuality(action=action)
