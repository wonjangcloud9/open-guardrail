"""Limits the number of agent execution steps."""
from __future__ import annotations

import time

from open_guardrail.core import GuardResult


class _AgentStepLimit:
    def __init__(
        self,
        *,
        action: str = "block",
        max_steps: int = 50,
        warn_at_percent: float = 0.8,
    ) -> None:
        self.name = "agent-step-limit"
        self.action = action
        self.max_steps = max_steps
        self.warn_at_percent = warn_at_percent
        self._current_step: int = 0

    def check(self, text: str, stage: str = "input") -> GuardResult:
        start = time.perf_counter()
        self._current_step += 1

        exceeded = self._current_step > self.max_steps
        near_limit = self._current_step > self.warn_at_percent * self.max_steps
        triggered = exceeded or (near_limit and self.action == "warn")

        if exceeded:
            result_action = "block"
        elif near_limit and self.action == "warn":
            result_action = "warn"
        else:
            result_action = "allow"

        elapsed = (time.perf_counter() - start) * 1000
        pct_used = round((self._current_step / self.max_steps) * 100)
        return GuardResult(
            guard_name="agent-step-limit",
            passed=not exceeded,
            action=result_action,
            message=f"Step limit {'exceeded' if exceeded else 'approaching'}: {self._current_step}/{self.max_steps} ({pct_used}%)" if triggered else None,
            latency_ms=round(elapsed, 2),
            details={"current_step": self._current_step, "max_steps": self.max_steps, "percent_used": pct_used} if triggered else None,
        )


def agent_step_limit(
    *,
    action: str = "block",
    max_steps: int = 50,
    warn_at_percent: float = 0.8,
) -> _AgentStepLimit:
    return _AgentStepLimit(
        action=action,
        max_steps=max_steps,
        warn_at_percent=warn_at_percent,
    )
