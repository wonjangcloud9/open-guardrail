"""Check output-to-input length ratio."""
from __future__ import annotations

import time
from typing import Optional

from open_guardrail.core import GuardResult


class _ResponseLengthRatio:
    def __init__(
        self,
        *,
        action: str = "warn",
        input_text: str = "",
        min_ratio: float = 0.1,
        max_ratio: float = 50.0,
    ) -> None:
        self.name = "response-length-ratio"
        self.action = action
        self.input_text = input_text
        self.min_ratio = min_ratio
        self.max_ratio = max_ratio

    def check(
        self, text: str, stage: str = "output"
    ) -> GuardResult:
        start = time.perf_counter()
        in_len = max(len(self.input_text), 1)
        out_len = len(text)
        ratio = out_len / in_len

        triggered = ratio < self.min_ratio or ratio > self.max_ratio
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="response-length-ratio",
            passed=not triggered,
            action=self.action if triggered else "allow",
            message=(
                f"Length ratio {ratio:.2f} out of"
                f" [{self.min_ratio}, {self.max_ratio}]"
                if triggered else None
            ),
            latency_ms=round(elapsed, 2),
            details={
                "ratio": round(ratio, 4),
                "input_length": in_len,
                "output_length": out_len,
            } if triggered else None,
        )


def response_length_ratio(
    *,
    action: str = "warn",
    input_text: str = "",
    min_ratio: float = 0.1,
    max_ratio: float = 50.0,
) -> _ResponseLengthRatio:
    return _ResponseLengthRatio(
        action=action,
        input_text=input_text,
        min_ratio=min_ratio,
        max_ratio=max_ratio,
    )
