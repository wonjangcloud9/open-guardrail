"""Check word diversity in AI responses."""
from __future__ import annotations

import re
import time

from open_guardrail.core import GuardResult

_FILLER_WORDS = {
    "basically", "actually", "literally",
    "essentially", "obviously", "clearly",
    "simply", "just", "really", "very",
    "quite", "rather", "somewhat",
}

_CIRCULAR_RE = re.compile(
    r"\b(\w{4,})\b.*\b\1\b.*\b\1\b.*\b\1\b",
    re.I,
)


class _ResponseWordDiversity:
    def __init__(
        self,
        *,
        action: str = "block",
        min_diversity: float = 0.3,
    ) -> None:
        self.name = "response-word-diversity"
        self.action = action
        self._min = min_diversity

    def check(
        self, text: str, stage: str = "output"
    ) -> GuardResult:
        start = time.perf_counter()
        issues: list[str] = []

        words = re.findall(r"\b[a-z]+\b", text.lower())
        if words:
            unique = set(words)
            diversity = len(unique) / len(words)
            if diversity < self._min:
                issues.append("low_diversity")

            filler = sum(
                1 for w in words if w in _FILLER_WORDS
            )
            if filler / len(words) > 0.15:
                issues.append("filler_overuse")

        if _CIRCULAR_RE.search(text):
            issues.append("circular_reasoning")

        triggered = len(issues) > 0
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="response-word-diversity",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=(
                min(len(issues) / 3, 1.0)
                if triggered
                else 0.0
            ),
            message=(
                "Low word diversity detected"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {"issues": issues} if triggered else None
            ),
        )


def response_word_diversity(
    *,
    action: str = "block",
    min_diversity: float = 0.3,
) -> _ResponseWordDiversity:
    return _ResponseWordDiversity(
        action=action, min_diversity=min_diversity
    )
