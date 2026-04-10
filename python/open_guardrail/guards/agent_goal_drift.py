"""Detects when an agent drifts from its stated goal."""
from __future__ import annotations

import time
from typing import List

from open_guardrail.core import GuardResult


class _AgentGoalDrift:
    def __init__(
        self,
        *,
        action: str = "block",
        goal_keywords: List[str],
        drift_threshold: float = 0.3,
    ) -> None:
        self.name = "agent-goal-drift"
        self.action = action
        self.keywords = [k.lower() for k in goal_keywords]
        self.threshold = drift_threshold

    def check(self, text: str, stage: str = "input") -> GuardResult:
        start = time.perf_counter()
        lower = text.lower()
        found = sum(1 for kw in self.keywords if kw in lower)
        ratio = found / len(self.keywords) if self.keywords else 1.0
        triggered = ratio < self.threshold
        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(
            guard_name="agent-goal-drift",
            passed=not triggered,
            action=self.action if triggered else "allow",
            message=f"Goal drift detected: only {found}/{len(self.keywords)} keywords present ({ratio:.0%})" if triggered else None,
            latency_ms=round(elapsed, 2),
            details={"keyword_ratio": ratio, "threshold": self.threshold, "found_keywords": found, "total_keywords": len(self.keywords)} if triggered else None,
        )


def agent_goal_drift(
    *,
    action: str = "block",
    goal_keywords: List[str],
    drift_threshold: float = 0.3,
) -> _AgentGoalDrift:
    return _AgentGoalDrift(
        action=action,
        goal_keywords=goal_keywords,
        drift_threshold=drift_threshold,
    )
