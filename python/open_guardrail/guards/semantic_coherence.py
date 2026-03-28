"""Basic semantic coherence check for responses."""
from __future__ import annotations

import re
import time

from open_guardrail.core import GuardResult

_CONTRADICTION_PAIRS: list[
    tuple[re.Pattern[str], re.Pattern[str]]
] = [
    (
        re.compile(r"\bis\s+true\b", re.IGNORECASE),
        re.compile(r"\bis\s+false\b", re.IGNORECASE),
    ),
    (
        re.compile(r"\balways\b", re.IGNORECASE),
        re.compile(r"\bnever\b", re.IGNORECASE),
    ),
    (
        re.compile(r"\byes\b", re.IGNORECASE),
        re.compile(r"\bno\b", re.IGNORECASE),
    ),
    (
        re.compile(
            r"\bincreased?\b", re.IGNORECASE
        ),
        re.compile(
            r"\bdecreased?\b", re.IGNORECASE
        ),
    ),
]


def _get_sentences(text: str) -> list[str]:
    return [
        s.strip()
        for s in re.split(r"[.!?]+", text)
        if len(s.strip()) > 3
    ]


def _word_salad_score(text: str) -> float:
    words = text.lower().split()
    if len(words) < 5:
        return 0.0
    unique = set(words)
    ratio = len(unique) / len(words)
    if ratio > 0.95 and len(words) > 20:
        return 0.8
    return 0.0


class _SemanticCoherence:
    def __init__(
        self, *, action: str = "warn"
    ) -> None:
        self.name = "semantic-coherence"
        self.action = action

    def check(
        self, text: str, stage: str = "output"
    ) -> GuardResult:
        start = time.perf_counter()
        issues: list[str] = []
        sentences = _get_sentences(text)

        for i in range(len(sentences) - 1):
            a, b = sentences[i], sentences[i + 1]
            for p1, p2 in _CONTRADICTION_PAIRS:
                if (
                    p1.search(a) and p2.search(b)
                ) or (
                    p2.search(a) and p1.search(b)
                ):
                    issues.append("contradiction")
                    break

        salad = _word_salad_score(text)
        if salad > 0.5:
            issues.append("word-salad")

        triggered = len(issues) > 0
        score = (
            min(len(issues) * 0.4 + salad, 1.0)
            if triggered
            else 0.0
        )
        elapsed = (
            time.perf_counter() - start
        ) * 1000

        return GuardResult(
            guard_name="semantic-coherence",
            passed=not triggered,
            action=(
                self.action if triggered else "allow"
            ),
            score=score,
            message=(
                "Semantic coherence issue detected"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {"issues": issues}
                if triggered
                else None
            ),
        )


def semantic_coherence(
    *, action: str = "warn"
) -> _SemanticCoherence:
    return _SemanticCoherence(action=action)
