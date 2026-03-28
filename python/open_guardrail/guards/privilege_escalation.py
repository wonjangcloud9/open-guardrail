"""Detect privilege escalation attempts."""
from __future__ import annotations

import re
import time

from open_guardrail.core import GuardResult

_PATTERNS: list[re.Pattern[str]] = [
    re.compile(r"run\s+as\s+admin", re.IGNORECASE),
    re.compile(r"grant\s+root\s+access", re.IGNORECASE),
    re.compile(r"escalate\s+privileges", re.IGNORECASE),
    re.compile(
        r"bypass\s+authentication", re.IGNORECASE
    ),
    re.compile(r"disable\s+security", re.IGNORECASE),
    re.compile(
        r"turn\s+off\s+firewall", re.IGNORECASE
    ),
    re.compile(
        r"override\s+permissions", re.IGNORECASE
    ),
    re.compile(r"sudo\s+su", re.IGNORECASE),
    re.compile(
        r"privilege\s+escalation", re.IGNORECASE
    ),
    re.compile(
        r"gain\s+admin\s+access", re.IGNORECASE
    ),
    re.compile(
        r"elevate\s+(my\s+)?permissions",
        re.IGNORECASE,
    ),
    re.compile(
        r"disable\s+(the\s+)?access\s+control",
        re.IGNORECASE,
    ),
    re.compile(
        r"bypass\s+(the\s+)?authorization",
        re.IGNORECASE,
    ),
]


class _PrivilegeEscalation:
    def __init__(self, *, action: str = "block") -> None:
        self.name = "privilege-escalation"
        self.action = action

    def check(
        self, text: str, stage: str = "input"
    ) -> GuardResult:
        start = time.perf_counter()
        matched: list[str] = []

        for pat in _PATTERNS:
            if pat.search(text):
                matched.append(pat.pattern)

        triggered = len(matched) > 0
        score = min(len(matched) / 3, 1.0) if triggered else 0.0
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="privilege-escalation",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=score,
            message=(
                "Privilege escalation detected"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {"matched_patterns": len(matched)}
                if triggered
                else None
            ),
        )


def privilege_escalation(
    *, action: str = "block"
) -> _PrivilegeEscalation:
    return _PrivilegeEscalation(action=action)
