"""Token-based rate limiting using word-level approximation."""
from __future__ import annotations

import time
from typing import Optional

from open_guardrail.core import GuardResult

_state: list[dict] = []


def _estimate_tokens(text: str) -> int:
    return len(text.split())


class _RateLimitToken:
    def __init__(
        self,
        *,
        action: str = "block",
        max_tokens_per_minute: int = 10000,
        window_ms: int = 60000,
    ) -> None:
        self.name = "rate-limit-token"
        self.action = action
        self._max_tokens = max_tokens_per_minute
        self._window_ms = window_ms

    def check(
        self, text: str, stage: str = "input"
    ) -> GuardResult:
        start = time.perf_counter()
        now = time.time() * 1000
        tokens = _estimate_tokens(text)

        while _state and now - _state[0]["ts"] > self._window_ms:
            _state.pop(0)

        used = sum(r["tokens"] for r in _state)
        total = used + tokens
        triggered = total > self._max_tokens

        _state.append({"tokens": tokens, "ts": now})
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="rate-limit-token",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=min(total / self._max_tokens, 1.0) if triggered else 0.0,
            message="Token rate limit exceeded" if triggered else None,
            latency_ms=round(elapsed, 2),
            details=(
                {
                    "used_tokens": used,
                    "request_tokens": tokens,
                    "max_tokens_per_minute": self._max_tokens,
                }
                if triggered
                else None
            ),
        )


def rate_limit_token(
    *,
    action: str = "block",
    max_tokens_per_minute: int = 10000,
    window_ms: int = 60000,
) -> _RateLimitToken:
    return _RateLimitToken(
        action=action,
        max_tokens_per_minute=max_tokens_per_minute,
        window_ms=window_ms,
    )
