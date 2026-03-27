"""Adaptive rate limiting guard."""

import time

from open_guardrail.core import GuardResult


class _RateAdaptive:
    def __init__(
        self,
        *,
        action: str = "warn",
        soft_limit: int = 50,
        hard_limit: int = 100,
        window_ms: int = 60000,
    ) -> None:
        self.name = "rate-adaptive"
        self.action = action
        self.soft_limit = soft_limit
        self.hard_limit = hard_limit
        self.window_ms = window_ms
        self._timestamps: list[float] = []

    def _prune(self, now: float) -> None:
        cutoff = now - self.window_ms / 1000.0
        self._timestamps = [
            t for t in self._timestamps if t > cutoff
        ]

    def check(
        self, text: str, stage: str = "input"
    ) -> GuardResult:
        start = time.perf_counter()
        now = time.time()
        self._prune(now)
        self._timestamps.append(now)
        count = len(self._timestamps)

        if count > self.hard_limit:
            action = "block"
            triggered = True
            msg = (
                f"Hard limit exceeded: {count}"
                f" > {self.hard_limit}"
            )
        elif count > self.soft_limit:
            action = self.action
            triggered = True
            msg = (
                f"Soft limit exceeded: {count}"
                f" > {self.soft_limit}"
            )
        else:
            action = "allow"
            triggered = False
            msg = None

        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="rate-adaptive",
            passed=not triggered,
            action=action,
            message=msg,
            latency_ms=round(elapsed, 2),
            details={
                "request_count": count,
                "soft_limit": self.soft_limit,
                "hard_limit": self.hard_limit,
                "window_ms": self.window_ms,
            } if triggered else None,
        )


def rate_adaptive(
    *,
    action: str = "warn",
    soft_limit: int = 50,
    hard_limit: int = 100,
    window_ms: int = 60000,
) -> _RateAdaptive:
    return _RateAdaptive(
        action=action,
        soft_limit=soft_limit,
        hard_limit=hard_limit,
        window_ms=window_ms,
    )
