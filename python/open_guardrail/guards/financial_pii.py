"""Detect financial PII in text."""
from __future__ import annotations

import re
import time

from open_guardrail.core import GuardResult

_PATTERNS: list[re.Pattern[str]] = [
    # US bank account number (8-17 digits)
    re.compile(
        r"\b(account|acct)\s*#?\s*[:#]?\s*\d{8,17}\b",
        re.IGNORECASE,
    ),
    # US routing number (9 digits)
    re.compile(
        r"\b(routing|ABA)\s*#?\s*[:#]?\s*\d{9}\b",
        re.IGNORECASE,
    ),
    # SWIFT/BIC code
    re.compile(
        r"\b(SWIFT|BIC)\s*[:#]?\s*"
        r"[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?\b",
        re.IGNORECASE,
    ),
    # IBAN
    re.compile(
        r"\b[A-Z]{2}\d{2}\s?"
        r"[A-Z0-9]{4}(\s?[A-Z0-9]{4}){2,7}\s?"
        r"[A-Z0-9]{1,4}\b",
    ),
    # US EIN (XX-XXXXXXX)
    re.compile(
        r"\b(EIN)\s*[:#]?\s*\d{2}-\d{7}\b",
        re.IGNORECASE,
    ),
    # US ITIN (9XX-XX-XXXX)
    re.compile(
        r"\b(ITIN)\s*[:#]?\s*9\d{2}-\d{2}-\d{4}\b",
        re.IGNORECASE,
    ),
    # Stock/brokerage account
    re.compile(
        r"\b(brokerage|stock\s+account|trading\s+account)"
        r"\s*#?\s*[:#]?\s*[A-Z0-9]{6,15}\b",
        re.IGNORECASE,
    ),
    # Wire transfer details
    re.compile(
        r"\b(wire\s+transfer|wire\s+details"
        r"|beneficiary\s+account)"
        r"\s*[:#]?\s*[A-Z0-9]{6,20}\b",
        re.IGNORECASE,
    ),
]

_MASK_RE = re.compile(
    r"("
    r"\b(account|acct)\s*#?\s*[:#]?\s*\d{8,17}\b"
    r"|\b(routing|ABA)\s*#?\s*[:#]?\s*\d{9}\b"
    r"|\b(SWIFT|BIC)\s*[:#]?\s*"
    r"[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?\b"
    r"|\b(EIN)\s*[:#]?\s*\d{2}-\d{7}\b"
    r"|\b(ITIN)\s*[:#]?\s*9\d{2}-\d{2}-\d{4}\b"
    r")",
    re.IGNORECASE,
)


class _FinancialPii:
    def __init__(
        self,
        *,
        action: str = "redact",
        mask_financial: bool = True,
    ) -> None:
        self.name = "financial-pii"
        self.action = action
        self.mask_financial = mask_financial

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

        redacted = None
        if triggered and self.mask_financial:
            redacted = _MASK_RE.sub(
                "[FINANCIAL_REDACTED]", text
            )

        return GuardResult(
            guard_name="financial-pii",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=score,
            message=(
                "Financial PII detected"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {
                    "matched_categories": len(matched),
                    "redacted_text": redacted,
                    "reason": (
                        "Text contains financial personally"
                        " identifiable information"
                    ),
                }
                if triggered
                else None
            ),
        )


def financial_pii(
    *,
    action: str = "redact",
    mask_financial: bool = True,
) -> _FinancialPii:
    return _FinancialPii(
        action=action, mask_financial=mask_financial
    )
