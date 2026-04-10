"""Score how relevant the response is to the query."""
from __future__ import annotations

import re
import time

from open_guardrail.core import GuardResult


def _content_words(text: str) -> list[str]:
    return [
        w
        for w in re.split(r"\W+", text.lower())
        if len(w) >= 4
    ]


class _ResponseRelevanceScore:
    def __init__(
        self,
        *,
        action: str = "block",
        min_relevance: float = 0.3,
    ) -> None:
        self.name = "response-relevance-score"
        self.action = action
        self._min_rel = min_relevance

    def check(
        self, text: str, stage: str = "output"
    ) -> GuardResult:
        start = time.perf_counter()

        q_idx = text.find("Query:")
        r_idx = text.find("Response:")

        if q_idx == -1 or r_idx == -1 or r_idx <= q_idx:
            elapsed = (time.perf_counter() - start) * 1000
            return GuardResult(
                guard_name="response-relevance-score",
                passed=True,
                action="allow",
                latency_ms=round(elapsed, 2),
            )

        query = text[q_idx + 6 : r_idx]
        response = text[r_idx + 9 :]
        q_words = _content_words(query)

        if not q_words:
            elapsed = (time.perf_counter() - start) * 1000
            return GuardResult(
                guard_name="response-relevance-score",
                passed=True,
                action="allow",
                latency_ms=round(elapsed, 2),
            )

        resp_lower = response.lower()
        matched = sum(1 for w in q_words if w in resp_lower)
        relevance = matched / len(q_words)

        triggered = relevance < self._min_rel
        score = (1 - relevance) if triggered else 0.0
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="response-relevance-score",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=score,
            message=(
                "Response not relevant to query"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {
                    "relevance_score": round(relevance, 2),
                    "matched_words": matched,
                    "total_query_words": len(q_words),
                    "min_relevance": self._min_rel,
                }
                if triggered
                else None
            ),
        )


def response_relevance_score(
    *,
    action: str = "block",
    min_relevance: float = 0.3,
) -> _ResponseRelevanceScore:
    return _ResponseRelevanceScore(
        action=action, min_relevance=min_relevance
    )
