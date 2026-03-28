"""Enforces approximate token count limits."""
from __future__ import annotations

import time
from typing import Optional

from open_guardrail.core import GuardResult


class _TokenLimit:
    def __init__(
        self, *, action: str = "block", max_tokens: int = 4096, chars_per_token: float = 4.0,
    ) -> None:
        self.name = "token-limit"
        self.action = action
        self.max_tokens = max_tokens
        self.chars_per_token = chars_per_token

    def check(self, text: str, stage: str = "input") -> GuardResult:
        start = time.perf_counter()
        estimated = int(len(text) / self.chars_per_token + 0.5)
        triggered = estimated > self.max_tokens
        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(
            guard_name="token-limit",
            passed=not triggered,
            action=self.action if triggered else "allow",
            message=f"Token limit exceeded: ~{estimated} > {self.max_tokens}" if triggered else None,
            latency_ms=round(elapsed, 2),
            details={"estimated_tokens": estimated, "max_tokens": self.max_tokens} if triggered else None,
        )


def token_limit(
    *, action: str = "block", max_tokens: int = 4096, chars_per_token: float = 4.0,
) -> _TokenLimit:
    return _TokenLimit(action=action, max_tokens=max_tokens, chars_per_token=chars_per_token)
