"""Detect when output is not traceable to sources."""
from __future__ import annotations

import re
import time

from open_guardrail.core import GuardResult

_STOP_WORDS = frozenset(
    {
        "the", "a", "an", "and", "or", "but", "in",
        "on", "at", "to", "for", "of", "with", "by",
        "from", "is", "it", "as", "be", "was", "are",
        "been", "has", "have", "had", "not", "this",
        "that", "they", "them", "their", "what",
        "which", "who", "will", "would", "can",
        "could", "may", "might", "shall", "should",
        "does", "did", "do", "its", "than", "then",
        "also", "into", "more", "some", "such",
        "were", "when", "where", "there", "these",
        "those", "each", "about", "very",
    }
)

_SPLIT: list[tuple[re.Pattern[str], int, int]] = [
    (
        re.compile(
            r"(?:^|\n)Context:\s*([\s\S]+?)"
            r"\n\nAnswer:\s*([\s\S]+)",
            re.IGNORECASE,
        ),
        1,
        2,
    ),
    (
        re.compile(
            r"(?:^|\n)Sources?:\s*([\s\S]+?)"
            r"\n\nResponse:\s*([\s\S]+)",
            re.IGNORECASE,
        ),
        1,
        2,
    ),
    (
        re.compile(
            r"(?:^|\n)Retrieved:\s*([\s\S]+?)"
            r"\n\nAnswer:\s*([\s\S]+)",
            re.IGNORECASE,
        ),
        1,
        2,
    ),
    (
        re.compile(
            r"(?:^|\n)Passage:\s*([\s\S]+?)"
            r"\n\nAnswer:\s*([\s\S]+)",
            re.IGNORECASE,
        ),
        1,
        2,
    ),
]


def _content_words(text: str) -> list[str]:
    return [
        w
        for w in re.split(r"\W+", text.lower())
        if len(w) >= 4 and w not in _STOP_WORDS
    ]


class _SourceAttributionGuard:
    def __init__(
        self,
        *,
        action: str = "warn",
        min_attribution_ratio: float = 0.3,
    ) -> None:
        self.name = "source-attribution-guard"
        self.action = action
        self._min_ratio = min_attribution_ratio

    def check(
        self, text: str, stage: str = "output"
    ) -> GuardResult:
        start = time.perf_counter()

        source_sec = None
        answer_sec = None
        for pat, si, ai in _SPLIT:
            m = pat.search(text)
            if m:
                source_sec = m.group(si)
                answer_sec = m.group(ai)
                break

        if not source_sec or not answer_sec:
            elapsed = (time.perf_counter() - start) * 1000
            return GuardResult(
                guard_name="source-attribution-guard",
                passed=True,
                action="allow",
                latency_ms=round(elapsed, 2),
            )

        src_words = set(_content_words(source_sec))
        ans_words = _content_words(answer_sec)

        if not ans_words:
            elapsed = (time.perf_counter() - start) * 1000
            return GuardResult(
                guard_name="source-attribution-guard",
                passed=True,
                action="allow",
                latency_ms=round(elapsed, 2),
            )

        attributed = sum(
            1 for w in ans_words if w in src_words
        )
        ratio = attributed / len(ans_words)
        triggered = ratio < self._min_ratio
        score = (1.0 - ratio) if triggered else 0.0
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="source-attribution-guard",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=score,
            message=(
                "Output not traceable to sources"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {
                    "attribution_ratio": round(ratio, 2),
                    "min_ratio": self._min_ratio,
                    "answer_words": len(ans_words),
                    "attributed_words": attributed,
                }
                if triggered
                else None
            ),
        )


def source_attribution_guard(
    *,
    action: str = "warn",
    min_attribution_ratio: float = 0.3,
) -> _SourceAttributionGuard:
    return _SourceAttributionGuard(
        action=action,
        min_attribution_ratio=min_attribution_ratio,
    )
