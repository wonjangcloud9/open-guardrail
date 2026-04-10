"""Limits conversation turns to prevent unbounded consumption (OWASP #10)."""
from __future__ import annotations

import time

from open_guardrail.core import GuardResult


class _TurnBudget:
    def __init__(
        self,
        *,
        action: str = "block",
        max_turns: int = 100,
        warn_at: int = 80,
    ) -> None:
        self.name = "turn-budget"
        self.action = action
        self.max_turns = max_turns
        self.warn_at = warn_at
        self._current_turn: int = 0

    def reset(self) -> None:
        self._current_turn = 0

    def check(self, text: str, stage: str = "input") -> GuardResult:
        start = time.perf_counter()
        self._current_turn += 1

        exceeded = self._current_turn > self.max_turns
        near_limit = self._current_turn > self.warn_at
        triggered = exceeded or (near_limit and self.action == "warn")

        if exceeded:
            result_action = "block"
        elif near_limit and self.action == "warn":
            result_action = "warn"
        else:
            result_action = "allow"

        remaining = max(0, self.max_turns - self._current_turn)
        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(
            guard_name="turn-budget",
            passed=not exceeded,
            action=result_action,
            message=f"Turn budget {'exceeded' if exceeded else 'approaching'}: {self._current_turn}/{self.max_turns} (remaining: {remaining})" if triggered else None,
            latency_ms=round(elapsed, 2),
            details={"current_turn": self._current_turn, "max_turns": self.max_turns, "remaining": remaining} if triggered else None,
        )


def turn_budget(
    *,
    action: str = "block",
    max_turns: int = 100,
    warn_at: int = 80,
) -> _TurnBudget:
    return _TurnBudget(action=action, max_turns=max_turns, warn_at=warn_at)
