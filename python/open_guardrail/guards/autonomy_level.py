"""Enforces autonomy level constraints on agent actions."""
from __future__ import annotations

import time
from typing import List, Optional

from open_guardrail.core import GuardResult

_RESTRICTED_ACTIONS = [
    "execute", "create", "modify", "delete", "send",
    "deploy", "install", "update", "write", "run",
]

_SUPERVISED_ACTIONS = [
    "delete", "deploy", "send", "publish",
    "transfer", "drop", "remove permanently",
]

_AUTONOMOUS_PATTERNS = [
    "drop database", "rm -rf /", "format disk",
    "shutdown", "destroy",
]


class _AutonomyLevel:
    def __init__(
        self,
        *,
        action: str = "block",
        level: str = "supervised",
    ) -> None:
        self.name = "autonomy-level"
        self.action = action
        self.level = level

    def check(self, text: str, stage: str = "input") -> GuardResult:
        start = time.perf_counter()
        lower = text.lower()
        flagged: List[str] = []

        if self.level == "restricted":
            flagged = [a for a in _RESTRICTED_ACTIONS if a in lower]
        elif self.level == "supervised":
            flagged = [a for a in _SUPERVISED_ACTIONS if a in lower]
        else:
            flagged = [p for p in _AUTONOMOUS_PATTERNS if p in lower]

        triggered = len(flagged) > 0
        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(
            guard_name="autonomy-level",
            passed=not triggered,
            action=self.action if triggered else "allow",
            message=f"Autonomy violation at {self.level} level" if triggered else None,
            latency_ms=round(elapsed, 2),
            details={"level": self.level, "flagged_actions": flagged} if triggered else None,
        )


def autonomy_level(
    *,
    action: str = "block",
    level: str = "supervised",
) -> _AutonomyLevel:
    return _AutonomyLevel(action=action, level=level)
