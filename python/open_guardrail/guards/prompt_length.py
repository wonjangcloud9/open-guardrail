"""Check prompt character length bounds."""
from __future__ import annotations

import time

from open_guardrail.core import GuardResult


class _PromptLength:
    def __init__(
        self,
        *,
        action: str = "block",
        max_length: int = 10000,
        min_length: int = 1,
    ) -> None:
        self.name = "prompt-length"
        self.action = action
        self._max = max_length
        self._min = min_length

    def check(
        self, text: str, stage: str = "input"
    ) -> GuardResult:
        start = time.perf_counter()
        length = len(text)
        triggered = (
            length > self._max
            or length < self._min
        )
        elapsed = (
            time.perf_counter() - start
        ) * 1000

        if not triggered:
            return GuardResult(
                guard_name="prompt-length",
                passed=True,
                action="allow",
                latency_ms=round(elapsed, 2),
            )

        if length > self._max:
            msg = (
                f"Prompt too long: {length}"
                f" > {self._max} chars"
            )
        else:
            msg = (
                f"Prompt too short: {length}"
                f" < {self._min} chars"
            )

        return GuardResult(
            guard_name="prompt-length",
            passed=False,
            action=self.action,
            message=msg,
            latency_ms=round(elapsed, 2),
            details={
                "length": length,
                "max_length": self._max,
                "min_length": self._min,
                "reason": msg,
            },
        )


def prompt_length(
    *,
    action: str = "block",
    max_length: int = 10000,
    min_length: int = 1,
) -> _PromptLength:
    return _PromptLength(
        action=action,
        max_length=max_length,
        min_length=min_length,
    )
