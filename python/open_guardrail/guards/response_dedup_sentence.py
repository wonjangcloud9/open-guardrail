"""Detect repeated sentences in AI output."""
from __future__ import annotations

import re
import time

from open_guardrail.core import GuardResult


def _split_sentences(text: str) -> list[str]:
    parts = re.split(r"(?<=[.!?])\s+", text)
    return [s.strip() for s in parts if s.strip()]


def _normalize(s: str) -> str:
    s = s.lower()
    s = re.sub(r"[^a-z0-9\s]", "", s)
    return re.sub(r"\s+", " ", s).strip()


class _ResponseDedupSentence:
    def __init__(
        self,
        *,
        action: str = "warn",
        max_duplicates: int = 2,
    ) -> None:
        self.name = "response-dedup-sentence"
        self.action = action
        self._max_dup = max_duplicates

    def check(
        self, text: str, stage: str = "output"
    ) -> GuardResult:
        start = time.perf_counter()
        sentences = _split_sentences(text)
        counts: dict[str, int] = {}
        duplicates: list[str] = []

        for s in sentences:
            key = _normalize(s)
            if not key:
                continue
            counts[key] = counts.get(key, 0) + 1
            if (
                counts[key] > self._max_dup
                and key not in duplicates
            ):
                duplicates.append(key)

        triggered = len(duplicates) > 0
        score = (
            min(len(duplicates) / 3, 1.0)
            if triggered
            else 0.0
        )
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="response-dedup-sentence",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=score,
            message=(
                "Duplicate sentences detected"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {
                    "duplicate_count": len(duplicates),
                    "samples": duplicates[:3],
                }
                if triggered
                else None
            ),
        )


def response_dedup_sentence(
    *,
    action: str = "warn",
    max_duplicates: int = 2,
) -> _ResponseDedupSentence:
    return _ResponseDedupSentence(
        action=action, max_duplicates=max_duplicates
    )
