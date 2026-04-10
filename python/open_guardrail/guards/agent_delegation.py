"""Validates safety of agent-to-agent delegation."""
from __future__ import annotations

import re
import time
from typing import List, Optional

from open_guardrail.core import GuardResult

_DELEGATION_PATTERNS = [
    re.compile(r"delegate\s+to\s+(\w[\w-]*)", re.IGNORECASE),
    re.compile(r"hand\s+off\s+to\s+(\w[\w-]*)", re.IGNORECASE),
    re.compile(r"transfer\s+to\s+agent\s+(\w[\w-]*)", re.IGNORECASE),
    re.compile(r"invoke\s+agent\s+(\w[\w-]*)", re.IGNORECASE),
    re.compile(r"call\s+agent\s+(\w[\w-]*)", re.IGNORECASE),
    re.compile(r"spawn\s+agent\s+(\w[\w-]*)", re.IGNORECASE),
]

_DEPTH_PATTERN = re.compile(r"delegation[_-]?depth[:\s=]+(\d+)", re.IGNORECASE)


class _AgentDelegationGuard:
    def __init__(
        self,
        *,
        action: str = "block",
        allowed_delegates: Optional[List[str]] = None,
        max_delegation_depth: int = 3,
    ) -> None:
        self.name = "agent-delegation"
        self.action = action
        self.allowed = allowed_delegates
        self.max_depth = max_delegation_depth

    def check(self, text: str, stage: str = "input") -> GuardResult:
        start = time.perf_counter()
        issues: List[str] = []
        targets: List[str] = []

        for pattern in _DELEGATION_PATTERNS:
            m = pattern.search(text)
            if m and m.group(1):
                targets.append(m.group(1))

        if self.allowed and targets:
            for t in targets:
                if t not in self.allowed:
                    issues.append(f"Unauthorized delegate: {t}")

        depth_match = _DEPTH_PATTERN.search(text)
        depth = int(depth_match.group(1)) if depth_match else 0
        if depth > self.max_depth:
            issues.append(f"Delegation depth {depth} exceeds max {self.max_depth}")

        if len(targets) > self.max_depth:
            issues.append(f"Too many delegations ({len(targets)}) exceeds max depth {self.max_depth}")

        triggered = len(issues) > 0
        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(
            guard_name="agent-delegation",
            passed=not triggered,
            action=self.action if triggered else "allow",
            message="; ".join(issues) if triggered else None,
            latency_ms=round(elapsed, 2),
            details={"issues": issues, "targets": targets, "depth": depth, "max_depth": self.max_depth} if triggered else None,
        )


def agent_delegation(
    *,
    action: str = "block",
    allowed_delegates: Optional[List[str]] = None,
    max_delegation_depth: int = 3,
) -> _AgentDelegationGuard:
    return _AgentDelegationGuard(
        action=action,
        allowed_delegates=allowed_delegates,
        max_delegation_depth=max_delegation_depth,
    )
