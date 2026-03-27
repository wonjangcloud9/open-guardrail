"""Simple in-memory rate limiter."""

import time
from typing import List

from open_guardrail.core import GuardResult


class _RateLimit:
    def __init__(
        self, *, action: str = "block", max_requests: int = 100, window_ms: int = 60000,
    ) -> None:
        self.name = "rate-limit"
        self.action = action
        self.max_requests = max_requests
        self.window_ms = window_ms
        self._timestamps: List[float] = []

    def check(self, text: str, stage: str = "input") -> GuardResult:
        start = time.perf_counter()
        now = time.time() * 1000
        cutoff = now - self.window_ms
        self._timestamps = [t for t in self._timestamps if t > cutoff]
        self._timestamps.append(now)
        triggered = len(self._timestamps) > self.max_requests
        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(
            guard_name=self.name,
            passed=not triggered,
            action=self.action if triggered else "allow",
            message=f"Rate limit exceeded: {len(self._timestamps)}/{self.max_requests} in {self.window_ms}ms" if triggered else None,
            latency_ms=round(elapsed, 2),
            details={"current_count": len(self._timestamps), "max_requests": self.max_requests} if triggered else None,
        )


def rate_limit(
    *, action: str = "block", max_requests: int = 100, window_ms: int = 60000,
) -> _RateLimit:
    return _RateLimit(action=action, max_requests=max_requests, window_ms=window_ms)
