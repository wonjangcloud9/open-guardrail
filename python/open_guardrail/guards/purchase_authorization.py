"""Enforce spend limits and merchant restrictions for AI-initiated purchases."""
from __future__ import annotations

import re
import time
from typing import List, Optional

from open_guardrail.core import GuardResult

_PURCHASE_PATTERNS = [
    re.compile(r"\bbuy\b", re.IGNORECASE),
    re.compile(r"\bpurchase\b", re.IGNORECASE),
    re.compile(r"\border\b", re.IGNORECASE),
    re.compile(r"\bcheckout\b", re.IGNORECASE),
    re.compile(r"\badd\s+to\s+cart\b", re.IGNORECASE),
    re.compile(r"\bpay\s+\$", re.IGNORECASE),
    re.compile(r"\bsubscribe\b", re.IGNORECASE),
    re.compile(r"\bcharge\s+\$", re.IGNORECASE),
]

_AUTO_BUY_PATTERNS = [
    re.compile(r"\bauto[- ]?buy\b", re.IGNORECASE),
    re.compile(r"\bautomatic\s+purchase\b", re.IGNORECASE),
    re.compile(r"\bbuy\s+without\s+confirmation\b", re.IGNORECASE),
]

_AMOUNT_RE = re.compile(r"\$([\d,]+(?:\.\d{1,2})?)")


class _PurchaseAuthorization:
    def __init__(
        self,
        *,
        action: str = "block",
        max_amount: float = 500,
        allowed_categories: Optional[List[str]] = None,
    ) -> None:
        self.name = "purchase-authorization"
        self.action = action
        self.max_amount = max_amount
        self.allowed_categories = allowed_categories

    def check(self, text: str, stage: str = "output") -> GuardResult:
        start = time.perf_counter()
        reasons: list[str] = []

        has_purchase = any(p.search(text) for p in _PURCHASE_PATTERNS)

        amounts = [float(m.replace(",", "")) for m in _AMOUNT_RE.findall(text)]
        over = [a for a in amounts if a > self.max_amount]
        if over:
            reasons.append(f"Amount exceeds limit: {', '.join(f'${a}' for a in over)} > ${self.max_amount}")

        if any(p.search(text) for p in _AUTO_BUY_PATTERNS):
            reasons.append("Auto-purchase without user confirmation detected")

        if self.allowed_categories and has_purchase:
            lower = text.lower()
            if not any(c.lower() in lower for c in self.allowed_categories):
                reasons.append("Product/merchant category not in allowed list")

        triggered = len(reasons) > 0
        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(
            guard_name="purchase-authorization",
            passed=not triggered,
            action=self.action if triggered else "allow",
            message="; ".join(reasons) if triggered else None,
            latency_ms=round(elapsed, 2),
            details={"reasons": reasons, "amounts": amounts, "max_amount": self.max_amount} if triggered else None,
        )


def purchase_authorization(
    *,
    action: str = "block",
    max_amount: float = 500,
    allowed_categories: Optional[List[str]] = None,
) -> _PurchaseAuthorization:
    return _PurchaseAuthorization(action=action, max_amount=max_amount, allowed_categories=allowed_categories)
