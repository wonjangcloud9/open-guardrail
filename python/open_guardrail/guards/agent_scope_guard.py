"""Enforces agent scope boundaries."""
from __future__ import annotations

import time
from typing import List, Optional

from open_guardrail.core import GuardResult


class _AgentScopeGuard:
    def __init__(
        self,
        *,
        action: str = "block",
        allowed_topics: Optional[List[str]] = None,
        denied_topics: Optional[List[str]] = None,
    ) -> None:
        self.name = "agent-scope-guard"
        self.action = action
        self.allowed = [t.lower() for t in (allowed_topics or [])]
        self.denied = [t.lower() for t in (denied_topics or [])]

    def check(self, text: str, stage: str = "input") -> GuardResult:
        start = time.perf_counter()
        lower = text.lower()
        violations = 0
        total_checks = 0
        violated_denied: List[str] = []

        if self.allowed:
            total_checks += 1
            if not any(t in lower for t in self.allowed):
                violations += 1

        for topic in self.denied:
            total_checks += 1
            if topic in lower:
                violations += 1
                violated_denied.append(topic)

        triggered = violations > 0
        score = violations / total_checks if total_checks > 0 else 0.0
        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(
            guard_name="agent-scope-guard",
            passed=not triggered,
            action=self.action if triggered else "allow",
            message="Agent scope violation detected" if triggered else None,
            latency_ms=round(elapsed, 2),
            details={"score": score, "violations": violations, "total_checks": total_checks, "violated_denied": violated_denied} if triggered else None,
        )


def agent_scope_guard(
    *,
    action: str = "block",
    allowed_topics: Optional[List[str]] = None,
    denied_topics: Optional[List[str]] = None,
) -> _AgentScopeGuard:
    return _AgentScopeGuard(
        action=action,
        allowed_topics=allowed_topics,
        denied_topics=denied_topics,
    )
