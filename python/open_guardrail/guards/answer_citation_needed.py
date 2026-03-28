"""Flag claims that need citations."""
from __future__ import annotations

import re
import time

from open_guardrail.core import GuardResult

_UNCITED: list[re.Pattern[str]] = [
    re.compile(r"\b\d{1,3}(?:,\d{3})*(?:\.\d+)?\s*%"),
    re.compile(
        r"\bstudies?\s+(?:show|suggest|indicate"
        r"|found|demonstrate)\b",
        re.IGNORECASE,
    ),
    re.compile(
        r"\bresearch\s+(?:shows?|suggests?"
        r"|indicates?|found|demonstrates?)\b",
        re.IGNORECASE,
    ),
    re.compile(
        r"\baccording\s+to\s+(?:experts?"
        r"|scientists?|researchers?)\b",
        re.IGNORECASE,
    ),
    re.compile(r"\bstatistic(?:s|ally)\s", re.IGNORECASE),
    re.compile(
        r"\b(?:survey|poll|report)"
        r"\s+(?:shows?|found|reveals?)\b",
        re.IGNORECASE,
    ),
    re.compile(
        r"\bscientific(?:ally)?\s+(?:proven|established)\b",
        re.IGNORECASE,
    ),
    re.compile(
        r"\b(?:data|evidence)"
        r"\s+(?:shows?|suggests?|indicates?)\b",
        re.IGNORECASE,
    ),
    re.compile(
        r"\bin\s+\d{4}\s*,\s*(?:a\s+)?"
        r"(?:study|report|survey)\b",
        re.IGNORECASE,
    ),
    re.compile(
        r"\b(?:approximately|roughly|about)"
        r"\s+\d+(?:\.\d+)?\s*"
        r"(?:million|billion|trillion|percent|%)\b",
        re.IGNORECASE,
    ),
]

_CITATION_MARKERS: list[re.Pattern[str]] = [
    re.compile(r"\[[\d,\s]+\]"),
    re.compile(r"\((?:(?:19|20)\d{2})\)"),
    re.compile(r"https?://"),
    re.compile(
        r"(?:source|reference|citation|ref)\s*[:]",
        re.IGNORECASE,
    ),
]


def _has_citation(text: str) -> bool:
    return any(p.search(text) for p in _CITATION_MARKERS)


class _AnswerCitationNeeded:
    def __init__(
        self, *, action: str = "warn", threshold: int = 3
    ) -> None:
        self.name = "answer-citation-needed"
        self.action = action
        self._threshold = threshold

    def check(
        self, text: str, stage: str = "output"
    ) -> GuardResult:
        start = time.perf_counter()
        uncited = 0

        sentences = re.split(r"(?<=[.!?])\s+", text)
        for s in sentences:
            needs = any(p.search(s) for p in _UNCITED)
            if needs and not _has_citation(s):
                uncited += 1

        triggered = uncited >= self._threshold
        score = (
            min(uncited / (self._threshold * 2), 1.0)
            if triggered
            else 0.0
        )
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="answer-citation-needed",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=score,
            message=(
                "Uncited claims detected"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {
                    "uncited_claims": uncited,
                    "threshold": self._threshold,
                }
                if triggered
                else None
            ),
        )


def answer_citation_needed(
    *, action: str = "warn", threshold: int = 3
) -> _AnswerCitationNeeded:
    return _AnswerCitationNeeded(
        action=action, threshold=threshold
    )
