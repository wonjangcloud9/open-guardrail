"""Estimates token cost and blocks if over budget."""
from __future__ import annotations

import time
from typing import Optional

from open_guardrail.core import GuardResult


class _CostGuard:
    def __init__(
        self, *, action: str = "warn", max_cost_usd: float = 1.0, cost_per_1k_tokens: float = 0.01,
    ) -> None:
        self.name = "cost-guard"
        self.action = action
        self.max_cost_usd = max_cost_usd
        self.cost_per_1k_tokens = cost_per_1k_tokens

    def check(self, text: str, stage: str = "output") -> GuardResult:
        start = time.perf_counter()
        estimated_tokens = len(text) / 4
        estimated_cost = (estimated_tokens / 1000) * self.cost_per_1k_tokens
        triggered = estimated_cost > self.max_cost_usd
        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(
            guard_name=self.name,
            passed=not triggered,
            action=self.action if triggered else "allow",
            message=f"Estimated cost ${estimated_cost:.4f} exceeds max ${self.max_cost_usd:.4f}" if triggered else None,
            latency_ms=round(elapsed, 2),
            details={"estimated_tokens": estimated_tokens, "estimated_cost_usd": round(estimated_cost, 6)} if triggered else None,
        )


def cost_guard(
    *, action: str = "warn", max_cost_usd: float = 1.0, cost_per_1k_tokens: float = 0.01,
) -> _CostGuard:
    return _CostGuard(action=action, max_cost_usd=max_cost_usd, cost_per_1k_tokens=cost_per_1k_tokens)
