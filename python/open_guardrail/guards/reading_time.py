"""Estimate and limit reading time."""

import time
from typing import Optional

from open_guardrail.core import GuardResult


class _ReadingTime:
    def __init__(
        self,
        *,
        action: str = "block",
        max_minutes: float = 5.0,
        words_per_minute: int = 200,
    ) -> None:
        self.name = "reading-time"
        self.action = action
        self._max_minutes = max_minutes
        self._wpm = words_per_minute

    def check(
        self, text: str, stage: str = "output"
    ) -> GuardResult:
        start = time.perf_counter()
        words = [w for w in text.split() if w]
        word_count = len(words)
        minutes = round(word_count / self._wpm, 1)
        triggered = minutes > self._max_minutes
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="reading-time",
            passed=not triggered,
            action=self.action if triggered else "allow",
            message=(
                f"Reading time {minutes}min exceeds"
                f" max {self._max_minutes}min"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details={
                "estimated_minutes": minutes,
                "word_count": word_count,
                "max_minutes": self._max_minutes,
            },
        )


def reading_time(
    *,
    action: str = "block",
    max_minutes: float = 5.0,
    words_per_minute: int = 200,
) -> _ReadingTime:
    return _ReadingTime(
        action=action,
        max_minutes=max_minutes,
        words_per_minute=words_per_minute,
    )
