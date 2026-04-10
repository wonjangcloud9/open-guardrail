"""Detects whether sensitive operations have human approval markers."""
from __future__ import annotations

import time
from typing import List, Optional

from open_guardrail.core import GuardResult

_DEFAULT_SENSITIVE = [
    "delete",
    "payment",
    "transfer",
    "deploy",
    "publish",
    "execute",
    "send_email",
    "modify_production",
]

_DEFAULT_APPROVAL = [
    "[APPROVED]",
    "[HUMAN_CONFIRMED]",
    "[USER_CONSENT]",
    "approved_by:",
]


class _HumanInLoopGuard:
    def __init__(
        self,
        *,
        action: str = "block",
        sensitive_patterns: Optional[List[str]] = None,
        approval_markers: Optional[List[str]] = None,
    ) -> None:
        self.name = "human-in-loop"
        self.action = action
        self.sensitive = sensitive_patterns or _DEFAULT_SENSITIVE
        self.approval = approval_markers or _DEFAULT_APPROVAL

    def check(self, text: str, stage: str = "input") -> GuardResult:
        start = time.perf_counter()
        lower = text.lower()

        matched = [p for p in self.sensitive if p.lower() in lower]
        has_sensitive = len(matched) > 0
        has_approval = any(m in text for m in self.approval)

        triggered = has_sensitive and not has_approval
        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(
            guard_name="human-in-loop",
            passed=not triggered,
            action=self.action if triggered else "allow",
            message=f"Sensitive operation without approval: {', '.join(matched)}" if triggered else None,
            latency_ms=round(elapsed, 2),
            details={"sensitive_operations": matched, "approval_found": False} if triggered else None,
        )


def human_in_loop(
    *,
    action: str = "block",
    sensitive_patterns: Optional[List[str]] = None,
    approval_markers: Optional[List[str]] = None,
) -> _HumanInLoopGuard:
    return _HumanInLoopGuard(
        action=action,
        sensitive_patterns=sensitive_patterns,
        approval_markers=approval_markers,
    )
