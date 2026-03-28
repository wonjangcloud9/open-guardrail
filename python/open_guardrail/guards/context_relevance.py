"""Checks if response is relevant to the query."""
from __future__ import annotations

import re
import time

from open_guardrail.core import GuardResult

_STOP_WORDS = frozenset([
    "the", "a", "an", "is", "are", "was", "were", "be", "been",
    "in", "on", "at", "to", "for", "of", "with", "by", "and", "or",
    "but", "not", "it", "this", "that", "i", "you", "he", "she", "we",
])


def _tokenize(text: str) -> set[str]:
    words = re.sub(r"[^\w\s]", "", text.lower()).split()
    return {w for w in words if w not in _STOP_WORDS and len(w) > 2}


def _token_overlap(a: str, b: str) -> float:
    ta, tb = _tokenize(a), _tokenize(b)
    if not ta or not tb:
        return 0.0
    overlap = len(ta & tb)
    return (2 * overlap) / (len(ta) + len(tb))


class _ContextRelevance:
    def __init__(self, *, action: str = "warn", query: str, min_relevance: float = 0.2) -> None:
        self.name = "context-relevance"
        self.action = action
        self.query = query
        self.min_rel = min_relevance

    def check(self, text: str, stage: str = "output") -> GuardResult:
        start = time.perf_counter()
        score = _token_overlap(self.query, text)
        triggered = score < self.min_rel
        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(
            guard_name="context-relevance",
            passed=not triggered,
            action=self.action if triggered else "allow",
            message=f"Low relevance: {score:.2f}" if triggered else None,
            score=round(score, 2),
            latency_ms=round(elapsed, 2),
            details={"relevance_score": round(score, 2), "min_required": self.min_rel} if triggered else None,
        )


def context_relevance(*, action: str = "warn", query: str, min_relevance: float = 0.2) -> _ContextRelevance:
    return _ContextRelevance(action=action, query=query, min_relevance=min_relevance)
