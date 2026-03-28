"""Detects consent withdrawal and data deletion requests."""
from __future__ import annotations

import re
import time
from typing import List

from open_guardrail.core import GuardResult

_PATTERNS = [
    re.compile(r"withdraw\s+consent", re.IGNORECASE),
    re.compile(r"opt\s+out", re.IGNORECASE),
    re.compile(r"delete\s+my\s+data", re.IGNORECASE),
    re.compile(r"right\s+to\s+be\s+forgotten", re.IGNORECASE),
    re.compile(r"동의\s*철회"),
    re.compile(r"개인정보\s*삭제"),
]


class _ConsentWithdrawal:
    def __init__(self, *, action: str = "warn") -> None:
        self.name = "consent-withdrawal"
        self.action = action

    def check(self, text: str, stage: str = "input") -> GuardResult:
        start = time.perf_counter()
        matched: List[str] = []
        for p in _PATTERNS:
            m = p.search(text)
            if m:
                matched.append(m.group())
        triggered = len(matched) > 0
        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(
            guard_name="consent-withdrawal",
            passed=not triggered,
            action=self.action if triggered else "allow",
            message=f"Consent withdrawal detected: {len(matched)} signal(s)" if triggered else None,
            latency_ms=round(elapsed, 2),
            details={"matched": matched} if triggered else None,
        )


def consent_withdrawal(*, action: str = "warn") -> _ConsentWithdrawal:
    return _ConsentWithdrawal(action=action)
