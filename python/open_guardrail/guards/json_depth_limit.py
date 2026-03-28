"""Limit JSON nesting depth to prevent DoS."""
from __future__ import annotations

import time

from open_guardrail.core import GuardResult


def _measure_depth(text: str) -> int:
    max_d = 0
    cur = 0
    for ch in text:
        if ch in ("{", "["):
            cur += 1
            if cur > max_d:
                max_d = cur
        elif ch in ("}", "]"):
            cur -= 1
    return max_d


class _JsonDepthLimit:
    def __init__(
        self,
        *,
        action: str = "block",
        max_depth: int = 20,
    ) -> None:
        self.name = "json-depth-limit"
        self.action = action
        self._max = max_depth

    def check(
        self, text: str, stage: str = "input"
    ) -> GuardResult:
        start = time.perf_counter()
        depth = _measure_depth(text)
        triggered = depth > self._max
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="json-depth-limit",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=(
                min(depth / (self._max * 2), 1.0)
                if triggered
                else 0.0
            ),
            message=(
                f"JSON depth {depth} exceeds {self._max}"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details={
                "depth": depth,
                "max_depth": self._max,
            },
        )


def json_depth_limit(
    *,
    action: str = "block",
    max_depth: int = 20,
) -> _JsonDepthLimit:
    return _JsonDepthLimit(
        action=action, max_depth=max_depth
    )
