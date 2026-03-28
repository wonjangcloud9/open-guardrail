"""Validate agent actions against allowlist."""

import re
import time
from typing import List, Optional

from open_guardrail.core import GuardResult

_DEFAULT_DENIED: list[str] = [
    "delete",
    "execute",
    "sudo",
    "rm -rf",
    "DROP TABLE",
    "shutdown",
    "reboot",
    "send email",
    "make payment",
    "transfer funds",
]


class _AgentPermission:
    def __init__(
        self,
        *,
        action: str = "block",
        allowed_actions: Optional[List[str]] = None,
        denied_actions: Optional[List[str]] = None,
    ) -> None:
        self.name = "agent-permission"
        self.action = action
        self._allowed = allowed_actions
        self._denied_patterns = [
            re.compile(re.escape(d), re.IGNORECASE)
            for d in (denied_actions or _DEFAULT_DENIED)
        ]

    def check(
        self, text: str, stage: str = "input"
    ) -> GuardResult:
        start = time.perf_counter()
        violations: list[str] = []

        for pat in self._denied_patterns:
            if pat.search(text):
                violations.append(pat.pattern)

        if self._allowed:
            allowed_pats = [
                re.compile(re.escape(a), re.IGNORECASE)
                for a in self._allowed
            ]
            has_allowed = any(
                p.search(text) for p in allowed_pats
            )
            if not has_allowed and not violations:
                violations.append("action_not_in_allowlist")

        triggered = len(violations) > 0
        score = min(len(violations) / 3, 1.0) if triggered else 0.0
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="agent-permission",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=score,
            message=(
                "Agent action not permitted"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {
                    "violations": violations,
                    "reason": (
                        "Text contains agent actions"
                        " that are denied or not in"
                        " the allowed actions list"
                    ),
                }
                if triggered
                else None
            ),
        )


def agent_permission(
    *,
    action: str = "block",
    allowed_actions: Optional[List[str]] = None,
    denied_actions: Optional[List[str]] = None,
) -> _AgentPermission:
    return _AgentPermission(
        action=action,
        allowed_actions=allowed_actions,
        denied_actions=denied_actions,
    )
