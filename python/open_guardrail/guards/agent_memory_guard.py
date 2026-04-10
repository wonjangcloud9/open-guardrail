"""Validates agent memory/context integrity and detects tampering."""
from __future__ import annotations

import time
from typing import List, Optional

from open_guardrail.core import GuardResult

_MEMORY_MANIPULATION_PATTERNS = [
    "modify memory",
    "change context",
    "alter history",
    "edit conversation",
    "rewrite memory",
    "inject into context",
    "memory override",
    "context injection",
    "history manipulation",
    "forget previous",
    "memory poisoning",
    "corrupt state",
    "manipulate cache",
    "tamper with",
    "overwrite context",
]


class _AgentMemoryGuard:
    def __init__(self, *, action: str = "block") -> None:
        self.name = "agent-memory-guard"
        self.action = action

    def check(self, text: str, stage: str = "input") -> GuardResult:
        start = time.perf_counter()
        lower = text.lower()
        matched = [p for p in _MEMORY_MANIPULATION_PATTERNS if p in lower]

        triggered = len(matched) > 0
        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(
            guard_name="agent-memory-guard",
            passed=not triggered,
            action=self.action if triggered else "allow",
            message=f"Memory tampering detected: {', '.join(matched)}" if triggered else None,
            latency_ms=round(elapsed, 2),
            details={"matched_patterns": matched} if triggered else None,
        )


def agent_memory_guard(*, action: str = "block") -> _AgentMemoryGuard:
    return _AgentMemoryGuard(action=action)
