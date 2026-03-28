"""Semantic deduplication guard using trigram similarity."""
from __future__ import annotations

import time
from typing import List, Optional, Set

from open_guardrail.core import GuardResult


def _trigrams(text: str) -> Set[str]:
    s = " ".join(text.lower().split())
    return {s[i : i + 3] for i in range(len(s) - 2)}


def _similarity(a: Set[str], b: Set[str]) -> float:
    if not a and not b:
        return 1.0
    if not a or not b:
        return 0.0
    inter = len(a & b)
    return inter / (len(a) + len(b) - inter)


class _SemanticDedup:
    def __init__(
        self,
        *,
        action: str = "warn",
        max_history: int = 10,
        threshold: float = 0.9,
    ) -> None:
        self.name = "semantic-dedup"
        self.action = action
        self._max = max_history
        self._threshold = threshold
        self._history: List[Set[str]] = []

    def check(
        self, text: str, stage: str = "output"
    ) -> GuardResult:
        start = time.perf_counter()
        tg = _trigrams(text)
        best = 0.0
        for h in self._history:
            sim = _similarity(tg, h)
            if sim > best:
                best = sim
        triggered = best >= self._threshold
        self._history.append(tg)
        if len(self._history) > self._max:
            self._history.pop(0)
        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(
            guard_name="semantic-dedup",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=round(best, 2),
            message=(
                f"Near-duplicate ({best:.0%})"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {"similarity": round(best, 2)}
                if triggered
                else None
            ),
        )


def semantic_dedup(
    *,
    action: str = "warn",
    max_history: int = 10,
    threshold: float = 0.9,
) -> _SemanticDedup:
    return _SemanticDedup(
        action=action,
        max_history=max_history,
        threshold=threshold,
    )
