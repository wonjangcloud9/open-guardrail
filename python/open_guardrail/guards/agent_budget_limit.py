"""Tracks cumulative cost and enforces budget caps."""
from __future__ import annotations

import re
import time

from open_guardrail.core import GuardResult

_COST_PATTERNS = [
    re.compile(r"\$[\d.]+"),
    re.compile(r"cost:\s*[\d.]+", re.IGNORECASE),
    re.compile(r"price:\s*[\d.]+", re.IGNORECASE),
    re.compile(r"billing", re.IGNORECASE),
]


class _AgentBudgetLimit:
    def __init__(
        self,
        *,
        action: str = "block",
        max_budget: float = 10.0,
        cost_per_call: float = 0.01,
    ) -> None:
        self.name = "agent-budget-limit"
        self.action = action
        self.max_budget = max_budget
        self.cost_per_call = cost_per_call
        self._total_cost: float = 0.0

    def check(self, text: str, stage: str = "input") -> GuardResult:
        start = time.perf_counter()
        self._total_cost += self.cost_per_call

        cost_mentions = 0
        for pattern in _COST_PATTERNS:
            cost_mentions += len(pattern.findall(text))

        triggered = self._total_cost > self.max_budget
        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(
            guard_name="agent-budget-limit",
            passed=not triggered,
            action=self.action if triggered else "allow",
            message=f"Budget exceeded: ${self._total_cost:.2f} / ${self.max_budget:.2f}" if triggered else None,
            latency_ms=round(elapsed, 2),
            details={"total_cost": round(self._total_cost, 2), "max_budget": self.max_budget, "cost_mentions": cost_mentions},
        )


def agent_budget_limit(
    *,
    action: str = "block",
    max_budget: float = 10.0,
    cost_per_call: float = 0.01,
) -> _AgentBudgetLimit:
    return _AgentBudgetLimit(
        action=action,
        max_budget=max_budget,
        cost_per_call=cost_per_call,
    )
