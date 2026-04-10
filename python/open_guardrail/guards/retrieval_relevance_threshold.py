"""Detect low-relevance retrieved content via keyword overlap."""
from __future__ import annotations

import re
import time
from typing import Set

from open_guardrail.core import GuardResult

_STOP_WORDS = frozenset(
    [
        "a", "an", "the", "is", "are", "was", "were", "be", "been",
        "being", "have", "has", "had", "do", "does", "did", "will",
        "would", "could", "should", "may", "might", "shall", "can",
        "to", "of", "in", "for", "on", "with", "at", "by", "from",
        "as", "into", "about", "it", "its", "this", "that", "and",
        "or", "but", "if", "not", "no", "so", "what", "which", "who",
        "how", "when", "where", "why", "all", "each", "every", "both",
        "i", "me", "my", "we", "our", "you", "your", "he", "she",
        "they", "them", "his", "her", "their",
    ]
)


def _extract_keywords(text: str) -> Set[str]:
    words = re.findall(r"\b[a-z]{2,}\b", text.lower())
    return {w for w in words if w not in _STOP_WORDS}


class _RetrievalRelevanceThreshold:
    def __init__(
        self,
        *,
        action: str = "warn",
        min_keyword_overlap: float = 0.2,
    ) -> None:
        self.name = "retrieval-relevance-threshold"
        self.action = action
        self.min_keyword_overlap = min_keyword_overlap

    def check(self, text: str, stage: str = "input") -> GuardResult:
        start = time.perf_counter()

        query_match = re.search(
            r"^(?:query|question)\s*:\s*(.+?)(?:\n|$)",
            text,
            re.IGNORECASE | re.MULTILINE,
        )
        context_match = re.search(
            r"(?:^|\n)(?:context|passage|document)\s*:\s*([\s\S]+)",
            text,
            re.IGNORECASE,
        )

        elapsed = (time.perf_counter() - start) * 1000

        if not query_match or not context_match:
            return GuardResult(
                guard_name=self.name,
                passed=True,
                action="allow",
                message=None,
                latency_ms=round(elapsed, 2),
                details={"reason": "No query/context structure found"},
            )

        query_kw = _extract_keywords(query_match.group(1))
        context_kw = _extract_keywords(context_match.group(1))

        if not query_kw:
            return GuardResult(
                guard_name=self.name,
                passed=True,
                action="allow",
                message=None,
                latency_ms=round(elapsed, 2),
            )

        overlap = sum(1 for kw in query_kw if kw in context_kw)
        ratio = overlap / len(query_kw)
        triggered = ratio < self.min_keyword_overlap

        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(
            guard_name=self.name,
            passed=not triggered,
            action=self.action if triggered else "allow",
            message=f"Low keyword overlap ({ratio:.2f} < {self.min_keyword_overlap})" if triggered else None,
            latency_ms=round(elapsed, 2),
            details={"overlap_ratio": ratio, "threshold": self.min_keyword_overlap} if triggered else None,
        )


def retrieval_relevance_threshold(
    *,
    action: str = "warn",
    min_keyword_overlap: float = 0.2,
) -> _RetrievalRelevanceThreshold:
    return _RetrievalRelevanceThreshold(
        action=action, min_keyword_overlap=min_keyword_overlap
    )
