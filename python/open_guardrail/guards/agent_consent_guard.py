"""Ensures user consent exists before sensitive agent actions."""
from __future__ import annotations

import time
from typing import List, Optional

from open_guardrail.core import GuardResult

_DEFAULT_SENSITIVE_ACTIONS = [
    "purchase",
    "payment",
    "subscribe",
    "sign up",
    "register",
    "share data",
    "send personal",
    "access camera",
    "access microphone",
    "access location",
    "install",
    "download",
    "grant permission",
]

_CONSENT_INDICATORS = [
    "i agree",
    "i consent",
    "yes, proceed",
    "confirmed",
    "approved",
    "go ahead",
    "i authorize",
]


class _AgentConsentGuard:
    def __init__(
        self,
        *,
        action: str = "block",
        sensitive_actions: Optional[List[str]] = None,
    ) -> None:
        self.name = "agent-consent-guard"
        self.action = action
        self.sensitive_actions = sensitive_actions or _DEFAULT_SENSITIVE_ACTIONS

    def check(self, text: str, stage: str = "input") -> GuardResult:
        start = time.perf_counter()
        lower = text.lower()

        found_actions = [a for a in self.sensitive_actions if a.lower() in lower]

        has_consent = False
        if found_actions:
            has_consent = any(ind in lower for ind in _CONSENT_INDICATORS)

        triggered = len(found_actions) > 0 and not has_consent
        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(
            guard_name="agent-consent-guard",
            passed=not triggered,
            action=self.action if triggered else "allow",
            message=f"Sensitive actions without consent: {', '.join(found_actions)}" if triggered else None,
            latency_ms=round(elapsed, 2),
            details={"sensitive_actions_found": found_actions, "consent_found": has_consent} if triggered else None,
        )


def agent_consent_guard(
    *,
    action: str = "block",
    sensitive_actions: Optional[List[str]] = None,
) -> _AgentConsentGuard:
    return _AgentConsentGuard(
        action=action,
        sensitive_actions=sensitive_actions,
    )
