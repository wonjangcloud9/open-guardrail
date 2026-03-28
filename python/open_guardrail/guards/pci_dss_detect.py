"""Detect PCI DSS violations: card numbers, CVV, expiry, cardholder data."""

import re
import time
from typing import Optional

from open_guardrail.core import GuardResult

_CARD_PATTERNS: list[re.Pattern[str]] = [
    re.compile(r"\b4[0-9]{12}(?:[0-9]{3})?\b"),
    re.compile(r"\b5[1-5][0-9]{14}\b"),
    re.compile(r"\b3[47][0-9]{13}\b"),
    re.compile(r"\b6(?:011|5[0-9]{2})[0-9]{12}\b"),
]

_CVV_PATTERN = re.compile(
    r"\b(?:cvv|cvc|cvv2|cvc2|cid)\s*[:=]?\s*[0-9]{3,4}\b",
    re.IGNORECASE,
)

_EXPIRY_PATTERN = re.compile(
    r"\b(?:exp(?:iry|iration)?|valid\s*(?:thru|through))"
    r"\s*[:=]?\s*(?:0[1-9]|1[0-2])\s*[/\-]\s*(?:[0-9]{2,4})\b",
    re.IGNORECASE,
)

_CARDHOLDER_LOG = re.compile(
    r"(?:log|print|console|logger|logging|stdout|write)"
    r".*(?:card.?number|pan|cardholder|account.?number)",
    re.IGNORECASE,
)

_UNENCRYPTED_STORE = re.compile(
    r"(?:plaintext|unencrypted|clear.?text|raw)"
    r".*(?:card|pan|credit|payment|account.?number)",
    re.IGNORECASE,
)


def _luhn_check(number: str) -> bool:
    digits = [int(d) for d in number if d.isdigit()]
    if len(digits) < 13 or len(digits) > 19:
        return False
    total = 0
    reverse = digits[::-1]
    for i, d in enumerate(reverse):
        if i % 2 == 1:
            d *= 2
            if d > 9:
                d -= 9
        total += d
    return total % 10 == 0


def _extract_card_candidates(text: str) -> list[str]:
    candidates: list[str] = []
    for pat in _CARD_PATTERNS:
        for m in pat.finditer(text):
            candidates.append(m.group())
    return candidates


def _mask_card(text: str, candidates: list[str]) -> str:
    result = text
    for card in candidates:
        masked = card[:6] + "*" * (len(card) - 10) + card[-4:]
        result = result.replace(card, masked)
    return result


class _PciDssDetect:
    def __init__(
        self,
        *,
        action: str = "block",
        mask_cards: bool = True,
    ) -> None:
        self.name = "pci-dss-detect"
        self.action = action
        self.mask_cards = mask_cards

    def check(
        self, text: str, stage: str = "input"
    ) -> GuardResult:
        start = time.perf_counter()
        findings: list[str] = []

        candidates = _extract_card_candidates(text)
        valid_cards = [c for c in candidates if _luhn_check(c)]
        if valid_cards:
            findings.append(
                f"card_numbers:{len(valid_cards)}"
            )

        if _CVV_PATTERN.search(text):
            findings.append("cvv_exposed")
        if _EXPIRY_PATTERN.search(text):
            findings.append("expiry_exposed")
        if _CARDHOLDER_LOG.search(text):
            findings.append("cardholder_in_logs")
        if _UNENCRYPTED_STORE.search(text):
            findings.append("unencrypted_storage")

        triggered = len(findings) > 0
        score = min(len(findings) / 3, 1.0) if triggered else 0.0
        elapsed = (time.perf_counter() - start) * 1000

        override: Optional[str] = None
        if triggered and self.mask_cards and valid_cards:
            override = _mask_card(text, valid_cards)

        return GuardResult(
            guard_name="pci-dss-detect",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=score,
            message=(
                "PCI DSS violation detected"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {
                    "findings": findings,
                    "reason": (
                        "Text contains payment card data"
                        " in violation of PCI DSS"
                    ),
                }
                if triggered
                else None
            ),
            override_text=override,
        )


def pci_dss_detect(
    *,
    action: str = "block",
    mask_cards: bool = True,
) -> _PciDssDetect:
    return _PciDssDetect(
        action=action, mask_cards=mask_cards
    )
