"""Word/character count limit guard."""

import time
from typing import Optional

from open_guardrail.core import GuardResult


class _WordCount:
    def __init__(
        self,
        *,
        action: str = "block",
        min_count: Optional[int] = None,
        max_count: Optional[int] = None,
        unit: str = "words",
    ) -> None:
        self.name = "word-count"
        self.action = action
        self._min = min_count
        self._max = max_count
        self._unit = unit

    def check(
        self, text: str, stage: str = "input"
    ) -> GuardResult:
        start = time.perf_counter()

        if self._unit == "words":
            count = len(
                [w for w in text.strip().split() if w]
            )
        else:
            count = len(text)

        too_short = (
            self._min is not None and count < self._min
        )
        too_long = (
            self._max is not None and count > self._max
        )
        triggered = too_short or too_long
        elapsed = (time.perf_counter() - start) * 1000

        key = (
            "word_count"
            if self._unit == "words"
            else "char_count"
        )

        return GuardResult(
            guard_name="word-count",
            passed=not triggered,
            action=self.action if triggered else "allow",
            message=(
                f"Text {self._unit} count {count}"
                " is out of range"
                f" (min={self._min},"
                f" max={self._max})"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details={
                key: count,
                "min": self._min,
                "max": self._max,
            },
        )


def word_count(
    *,
    action: str = "block",
    min_count: Optional[int] = None,
    max_count: Optional[int] = None,
    unit: str = "words",
) -> _WordCount:
    return _WordCount(
        action=action,
        min_count=min_count,
        max_count=max_count,
        unit=unit,
    )
