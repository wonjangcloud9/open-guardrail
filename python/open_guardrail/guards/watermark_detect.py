"""Detect watermark patterns in text."""

import re
import time

from open_guardrail.core import GuardResult

_WATERMARK_PATTERNS = [
    re.compile(r"WATERMARK", re.IGNORECASE),
    re.compile(r"DO\s+NOT\s+DISTRIBUTE", re.IGNORECASE),
    re.compile(r"CONFIDENTIAL", re.IGNORECASE),
    re.compile(r"DRAFT", re.IGNORECASE),
]

_ZERO_WIDTH_SEQ = re.compile(
    r"[\u200b\u200c\u200d\u2060\ufeff]{3,}"
)


class _WatermarkDetect:
    def __init__(
        self, *, action: str = "warn"
    ) -> None:
        self.name = "watermark-detect"
        self.action = action

    def check(
        self, text: str, stage: str = "input"
    ) -> GuardResult:
        start = time.perf_counter()
        found: list[str] = []

        for pat in _WATERMARK_PATTERNS:
            if pat.search(text):
                found.append(pat.pattern)

        if _ZERO_WIDTH_SEQ.search(text):
            found.append("zero-width-watermark")

        elapsed = (
            time.perf_counter() - start
        ) * 1000

        if not found:
            return GuardResult(
                guard_name="watermark-detect",
                passed=True,
                action="allow",
                latency_ms=round(elapsed, 2),
            )

        return GuardResult(
            guard_name="watermark-detect",
            passed=False,
            action=self.action,
            message=(
                "Watermark pattern(s) detected"
            ),
            latency_ms=round(elapsed, 2),
            details={
                "matched": found,
                "reason": (
                    "Text contains watermark"
                    " or distribution markers"
                ),
            },
        )


def watermark_detect(
    *, action: str = "warn"
) -> _WatermarkDetect:
    return _WatermarkDetect(action=action)
