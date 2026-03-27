"""Enforce min/max word count on output."""

import time
from typing import Optional

from open_guardrail.core import GuardResult


class _OutputLengthGuard:
    def __init__(
        self,
        *,
        action: str = "block",
        min_words: int = 1,
        max_words: int = 5000,
    ) -> None:
        self.name = "output-length-guard"
        self.action = action
        self._min = min_words
        self._max = max_words

    def check(
        self, text: str, stage: str = "output"
    ) -> GuardResult:
        start = time.perf_counter()
        words = [w for w in text.strip().split() if w]
        count = len(words)
        too_short = count < self._min
        too_long = count > self._max
        triggered = too_short or too_long
        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(
            guard_name="output-length-guard",
            passed=not triggered,
            action=self.action if triggered else "allow",
            message=(
                f"Output has {count} words"
                f" (allowed: {self._min}-{self._max})"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details={
                "word_count": count,
                "min_words": self._min,
                "max_words": self._max,
            },
        )


def output_length_guard(
    *,
    action: str = "block",
    min_words: int = 1,
    max_words: int = 5000,
) -> _OutputLengthGuard:
    return _OutputLengthGuard(
        action=action,
        min_words=min_words,
        max_words=max_words,
    )
