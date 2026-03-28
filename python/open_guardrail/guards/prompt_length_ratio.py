"""Check input length ratio vs typical queries for anomalies."""
from __future__ import annotations

import time

from open_guardrail.core import GuardResult


class _PromptLengthRatio:
    def __init__(
        self,
        *,
        action: str = "block",
        typical_min_length: int = 10,
        typical_max_length: int = 2000,
    ) -> None:
        self.name = "prompt-length-ratio"
        self.action = action
        self._min_len = typical_min_length
        self._max_len = typical_max_length

    def check(
        self, text: str, stage: str = "input"
    ) -> GuardResult:
        start = time.perf_counter()
        length = len(text)
        issues: list[str] = []

        if length > self._max_len:
            ratio = length / self._max_len
            issues.append(f"input_too_long:{ratio:.1f}x")

        if 0 < length < self._min_len:
            issues.append("input_suspiciously_short")

        if length == 0:
            issues.append("empty_input")

        ws = sum(1 for c in text if c.isspace())
        padding_ratio = ws / max(length, 1)
        if padding_ratio > 0.7 and length > 100:
            issues.append("excessive_whitespace_padding")

        triggered = len(issues) > 0
        score = min(len(issues) / 2, 1.0) if triggered else 0.0
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="prompt-length-ratio",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=score,
            message=(
                "Input length anomaly detected"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {"issues": issues, "input_length": length}
                if triggered
                else None
            ),
        )


def prompt_length_ratio(
    *,
    action: str = "block",
    typical_min_length: int = 10,
    typical_max_length: int = 2000,
) -> _PromptLengthRatio:
    return _PromptLengthRatio(
        action=action,
        typical_min_length=typical_min_length,
        typical_max_length=typical_max_length,
    )
