"""Detect system prompt leakage via canary tokens."""
from __future__ import annotations

import time

from open_guardrail.core import GuardResult


class _CanaryToken:
    def __init__(
        self, *, action: str = "block", token: str
    ) -> None:
        self.name = "canary-token"
        self.action = action
        self._token = token

    def check(
        self, text: str, stage: str = "output"
    ) -> GuardResult:
        start = time.perf_counter()
        found = self._token in text
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="canary-token",
            passed=not found,
            action=self.action if found else "allow",
            message=(
                "Canary token detected in output"
                " -- system prompt leakage"
                if found
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {
                    "leaked": True,
                    "reason": (
                        "Canary token detected in"
                        " output -- system prompt"
                        " leakage"
                    ),
                }
                if found
                else None
            ),
        )


def canary_token(
    *, action: str = "block", token: str
) -> _CanaryToken:
    return _CanaryToken(action=action, token=token)
