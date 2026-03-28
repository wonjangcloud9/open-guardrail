"""Check content vs markup ratio in responses."""
from __future__ import annotations

import re
import time

from open_guardrail.core import GuardResult

_TAG_RE = re.compile(r"<[^>]+>")
_WS_RE = re.compile(r"\s+")


class _ContentLengthRatio:
    def __init__(
        self,
        *,
        action: str = "warn",
        min_content_ratio: float = 0.5,
    ) -> None:
        self.name = "content-length-ratio"
        self.action = action
        self._min_ratio = min_content_ratio

    def check(
        self, text: str, stage: str = "output"
    ) -> GuardResult:
        start = time.perf_counter()
        total = len(text)

        if total == 0:
            elapsed = (
                time.perf_counter() - start
            ) * 1000
            return GuardResult(
                guard_name="content-length-ratio",
                passed=False,
                action=self.action,
                score=1.0,
                message="Empty response",
                latency_ms=round(elapsed, 2),
                details={"reason": "empty-response"},
            )

        stripped = _WS_RE.sub(
            " ", _TAG_RE.sub("", text)
        ).strip()
        ratio = len(stripped) / total
        triggered = ratio < self._min_ratio
        score = 1.0 - ratio if triggered else 0.0
        elapsed = (
            time.perf_counter() - start
        ) * 1000

        return GuardResult(
            guard_name="content-length-ratio",
            passed=not triggered,
            action=(
                self.action if triggered else "allow"
            ),
            score=score,
            message=(
                "Low content-to-markup ratio"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details={
                "content_ratio": round(ratio, 2)
            },
        )


def content_length_ratio(
    *,
    action: str = "warn",
    min_content_ratio: float = 0.5,
) -> _ContentLengthRatio:
    return _ContentLengthRatio(
        action=action,
        min_content_ratio=min_content_ratio,
    )
