"""Token bucket rate limiting guard."""
from __future__ import annotations

import time

from open_guardrail.core import GuardResult


class _ApiRateGuard:
    def __init__(
        self,
        *,
        action: str = "block",
        max_tokens: int = 100,
        refill_rate: int = 10,
        refill_interval_ms: int = 1000,
    ) -> None:
        self.name = "api-rate-guard"
        self.action = action
        self.max_tokens = max_tokens
        self.refill_rate = refill_rate
        self.refill_interval_ms = refill_interval_ms
        self._tokens = float(max_tokens)
        self._last_refill = time.monotonic()

    def _refill(self) -> None:
        now = time.monotonic()
        elapsed_ms = (now - self._last_refill) * 1000
        intervals = elapsed_ms / self.refill_interval_ms
        added = intervals * self.refill_rate
        self._tokens = min(
            self.max_tokens, self._tokens + added
        )
        self._last_refill = now

    def check(
        self, text: str, stage: str = "input"
    ) -> GuardResult:
        start = time.perf_counter()
        self._refill()

        if self._tokens >= 1.0:
            self._tokens -= 1.0
            triggered = False
        else:
            triggered = True

        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="api-rate-guard",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=1.0 if triggered else 0.0,
            message=(
                "Rate limit exceeded"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {
                    "remaining_tokens": round(
                        self._tokens, 2
                    ),
                    "reason": (
                        "Token bucket exhausted;"
                        " request rate exceeds limit"
                    ),
                }
                if triggered
                else {
                    "remaining_tokens": round(
                        self._tokens, 2
                    ),
                }
            ),
        )


def api_rate_guard(
    *,
    action: str = "block",
    max_tokens: int = 100,
    refill_rate: int = 10,
    refill_interval_ms: int = 1000,
) -> _ApiRateGuard:
    return _ApiRateGuard(
        action=action,
        max_tokens=max_tokens,
        refill_rate=refill_rate,
        refill_interval_ms=refill_interval_ms,
    )
