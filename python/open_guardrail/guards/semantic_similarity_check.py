"""Detect echo or copy via trigram similarity."""
from __future__ import annotations

import re
import time

from open_guardrail.core import GuardResult


def _trigrams(text: str) -> set:
    clean = re.sub(r"\s+", " ", text.lower().strip())
    if len(clean) < 3:
        return set()
    return {clean[i : i + 3] for i in range(len(clean) - 2)}


class _SemanticSimilarityCheck:
    def __init__(
        self,
        *,
        action: str = "warn",
        threshold: float = 0.8,
    ) -> None:
        self.name = "semantic-similarity-check"
        self.action = action
        self.threshold = threshold

    def check(
        self,
        text: str,
        stage: str = "output",
        *,
        reference: str = "",
    ) -> GuardResult:
        start = time.perf_counter()

        t1 = _trigrams(reference)
        t2 = _trigrams(text)

        if not t1 or not t2:
            similarity = 0.0
        else:
            intersection = t1 & t2
            union = t1 | t2
            similarity = len(intersection) / len(union)

        triggered = similarity >= self.threshold
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="semantic-similarity-check",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=round(similarity, 4),
            message=(
                "Response too similar to input"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {
                    "similarity": round(similarity, 4),
                    "threshold": self.threshold,
                    "reason": (
                        "Response appears to echo or"
                        " copy the input text"
                    ),
                }
                if triggered
                else None
            ),
        )


def semantic_similarity_check(
    *,
    action: str = "warn",
    threshold: float = 0.8,
) -> _SemanticSimilarityCheck:
    return _SemanticSimilarityCheck(
        action=action, threshold=threshold
    )
