"""Ensure agentic transactions include refund/cancellation rights."""
from __future__ import annotations

import re
import time

from open_guardrail.core import GuardResult

_TRANSACTION_PATTERNS = [
    re.compile(r"\bpurchase\b", re.IGNORECASE),
    re.compile(r"\border\b", re.IGNORECASE),
    re.compile(r"\bsubscrib", re.IGNORECASE),
    re.compile(r"\bpayment\b", re.IGNORECASE),
    re.compile(r"\bcharge\b", re.IGNORECASE),
    re.compile(r"\bbuy\b", re.IGNORECASE),
    re.compile(r"\bcheckout\b", re.IGNORECASE),
]

_CONSUMER_PROTECTION = [
    re.compile(r"\brefund\b", re.IGNORECASE),
    re.compile(r"\breturn\s+policy\b", re.IGNORECASE),
    re.compile(r"\bcancell?ation\b", re.IGNORECASE),
    re.compile(r"\bcooling[- ]off\s+period\b", re.IGNORECASE),
    re.compile(r"\bmoney[- ]?back\b", re.IGNORECASE),
    re.compile(r"\bcancel\s+anytime\b", re.IGNORECASE),
    re.compile(r"\bcancel\s+subscription\b", re.IGNORECASE),
    re.compile(r"\bopt\s+out\b", re.IGNORECASE),
]


class _RefundPolicyGuard:
    def __init__(self, *, action: str = "block") -> None:
        self.name = "refund-policy-guard"
        self.action = action

    def check(self, text: str, stage: str = "output") -> GuardResult:
        start = time.perf_counter()

        has_transaction = any(p.search(text) for p in _TRANSACTION_PATTERNS)
        has_protection = any(p.search(text) for p in _CONSUMER_PROTECTION)

        triggered = has_transaction and not has_protection
        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(
            guard_name="refund-policy-guard",
            passed=not triggered,
            action=self.action if triggered else "allow",
            message="Transaction detected without consumer protection information" if triggered else None,
            latency_ms=round(elapsed, 2),
            details={"reason": "Transaction detected without consumer protection information"} if triggered else None,
        )


def refund_policy_guard(*, action: str = "block") -> _RefundPolicyGuard:
    return _RefundPolicyGuard(action=action)
