"""Detect credit card numbers with Luhn validation."""
from __future__ import annotations

import re
import time
from typing import Optional

from open_guardrail.core import GuardResult

_CARD_PATTERN = re.compile(
    r"\b(?:4\d{3}|5[1-5]\d{2}|3[47]\d{2}"
    r"|6(?:011|5\d{2}))"
    r"[\s.-]?\d{4}[\s.-]?\d{4}[\s.-]?\d{1,4}\b"
)


def _luhn_check(num: str) -> bool:
    digits = re.sub(r"\D", "", num)
    if len(digits) < 13 or len(digits) > 19:
        return False
    total = 0
    alt = False
    for ch in reversed(digits):
        n = int(ch)
        if alt:
            n *= 2
            if n > 9:
                n -= 9
        total += n
        alt = not alt
    return total % 10 == 0


class _CreditCardLuhn:
    def __init__(
        self,
        *,
        action: str = "block",
        mask_card: bool = True,
    ) -> None:
        self.name = "credit-card-luhn"
        self.action = action
        self.mask_card = mask_card

    def check(
        self, text: str, stage: str = "input"
    ) -> GuardResult:
        start = time.perf_counter()
        raw = _CARD_PATTERN.findall(text)
        validated = [m for m in raw if _luhn_check(m)]
        triggered = len(validated) > 0
        elapsed = (time.perf_counter() - start) * 1000

        details = None
        if triggered:
            details = {"card_count": len(validated)}
            if self.mask_card:
                details["masked"] = [
                    f"****{re.sub(r'[^0-9]', '', c)[-4:]}"
                    for c in validated
                ]

        return GuardResult(
            guard_name="credit-card-luhn",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=1.0 if triggered else 0.0,
            message=(
                "Credit card number detected"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=details,
        )


def credit_card_luhn(
    *,
    action: str = "block",
    mask_card: bool = True,
) -> _CreditCardLuhn:
    return _CreditCardLuhn(
        action=action, mask_card=mask_card
    )
