"""Aggregate safety score across categories."""
from __future__ import annotations

import re
import time

from open_guardrail.core import GuardResult

_CATEGORIES = {
    "violence": [
        "kill", "murder", "attack", "weapon",
        "assault", "shoot", "stab", "bomb",
    ],
    "hate": [
        "hate", "racist", "bigot", "slur",
        "supremacy", "discriminat",
    ],
    "self-harm": [
        "suicide", "self-harm", "cut myself",
        "end my life", "hurt myself",
    ],
    "sexual": [
        "explicit", "nude", "pornograph",
        "sexual content", "nsfw",
    ],
}


class _SafetyScoreAggregate:
    def __init__(
        self,
        *,
        action: str = "warn",
        threshold: float = 0.3,
    ) -> None:
        self.name = "safety-score-aggregate"
        self.action = action
        self.threshold = threshold

    def check(
        self, text: str, stage: str = "input"
    ) -> GuardResult:
        start = time.perf_counter()
        lower = text.lower()
        scores: dict[str, float] = {}
        total_matches = 0

        for cat, keywords in _CATEGORIES.items():
            hits = sum(1 for k in keywords if k in lower)
            scores[cat] = min(hits / max(len(keywords), 1), 1.0)
            total_matches += hits

        total_kw = sum(len(v) for v in _CATEGORIES.values())
        composite = total_matches / max(total_kw, 1)
        composite = round(min(composite * 3, 1.0), 4)

        triggered = composite > self.threshold
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="safety-score-aggregate",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=composite,
            message=(
                f"Safety score {composite} >"
                f" threshold {self.threshold}"
                if triggered else None
            ),
            latency_ms=round(elapsed, 2),
            details={
                "composite": composite,
                "category_scores": scores,
            },
        )


def safety_score_aggregate(
    *,
    action: str = "warn",
    threshold: float = 0.3,
) -> _SafetyScoreAggregate:
    return _SafetyScoreAggregate(
        action=action, threshold=threshold,
    )
