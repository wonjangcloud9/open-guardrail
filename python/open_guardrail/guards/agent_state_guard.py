"""Validates agent state transitions are safe and expected."""
from __future__ import annotations

import re
import time
from typing import Dict, List, Optional

from open_guardrail.core import GuardResult

_DEFAULT_TRANSITIONS: Dict[str, List[str]] = {
    "idle": ["thinking", "executing"],
    "thinking": ["executing", "idle", "responding"],
    "executing": ["responding", "error", "idle"],
    "responding": ["idle", "thinking"],
    "error": ["idle"],
}

_STATE_INDICATORS = [
    re.compile(r"state:\s*(\w+)", re.IGNORECASE),
    re.compile(r"status:\s*(\w+)", re.IGNORECASE),
    re.compile(r"transitioning to\s+(\w+)", re.IGNORECASE),
    re.compile(r"moving to state\s+(\w+)", re.IGNORECASE),
    re.compile(r"entering phase\s+(\w+)", re.IGNORECASE),
]


class _AgentStateGuard:
    def __init__(
        self,
        *,
        action: str = "block",
        valid_transitions: Optional[Dict[str, List[str]]] = None,
        initial_state: str = "idle",
    ) -> None:
        self.name = "agent-state-guard"
        self.action = action
        self.transitions = valid_transitions or _DEFAULT_TRANSITIONS
        self.current_state = initial_state

    def check(self, text: str, stage: str = "input") -> GuardResult:
        start = time.perf_counter()
        target_state: Optional[str] = None

        for pattern in _STATE_INDICATORS:
            match = pattern.search(text)
            if match:
                target_state = match.group(1).lower()
                break

        triggered = False
        message: Optional[str] = None

        if target_state is not None:
            allowed = self.transitions.get(self.current_state)
            if allowed is None:
                triggered = True
                message = f"Unknown current state: {self.current_state}"
            elif target_state not in allowed:
                triggered = True
                message = f"Invalid transition: {self.current_state} -> {target_state}"
            else:
                self.current_state = target_state

        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(
            guard_name="agent-state-guard",
            passed=not triggered,
            action=self.action if triggered else "allow",
            message=message,
            latency_ms=round(elapsed, 2),
            details={"current_state": self.current_state, "target_state": target_state} if triggered else None,
        )


def agent_state_guard(
    *,
    action: str = "block",
    valid_transitions: Optional[Dict[str, List[str]]] = None,
    initial_state: str = "idle",
) -> _AgentStateGuard:
    return _AgentStateGuard(
        action=action,
        valid_transitions=valid_transitions,
        initial_state=initial_state,
    )
