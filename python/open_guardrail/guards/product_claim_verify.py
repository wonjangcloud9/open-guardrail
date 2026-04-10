"""Block unsubstantiated product claims for FTC compliance."""
from __future__ import annotations

import re
import time

from open_guardrail.core import GuardResult

_UNSUBSTANTIATED: list[tuple[re.Pattern[str], str]] = [
    (re.compile(r"clinically\s+proven", re.IGNORECASE), "clinically proven"),
    (re.compile(r"scientifically\s+proven", re.IGNORECASE), "scientifically proven"),
    (re.compile(r"guaranteed\s+results?", re.IGNORECASE), "guaranteed results"),
    (re.compile(r"miracle\s+cure", re.IGNORECASE), "miracle cure"),
    (re.compile(r"fda\s+approved", re.IGNORECASE), "FDA approved claim"),
    (re.compile(r"100%\s+effective", re.IGNORECASE), "100% effective"),
    (re.compile(r"no\s+side\s+effects?", re.IGNORECASE), "no side effects"),
    (re.compile(r"instant\s+results?", re.IGNORECASE), "instant results"),
    (re.compile(r"lose\s+weight\s+fast", re.IGNORECASE), "lose weight fast"),
    (re.compile(r"anti[- ]?aging", re.IGNORECASE), "anti-aging claim"),
    (re.compile(r"cures?\s+cancer", re.IGNORECASE), "cures cancer"),
    (re.compile(r"prevents?\s+disease", re.IGNORECASE), "prevents disease"),
    (re.compile(r"#1\s+rated", re.IGNORECASE), "#1 rated without source"),
    (re.compile(r"doctor\s+recommended", re.IGNORECASE), "doctor recommended without citation"),
    (re.compile(r"all\s+natural\s+means?\s+safe", re.IGNORECASE), "all natural means safe"),
]


class _ProductClaimVerify:
    def __init__(self, *, action: str = "block") -> None:
        self.name = "product-claim-verify"
        self.action = action

    def check(self, text: str, stage: str = "output") -> GuardResult:
        start = time.perf_counter()
        matched: list[str] = []

        for pattern, label in _UNSUBSTANTIATED:
            if pattern.search(text):
                matched.append(label)

        triggered = len(matched) > 0
        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(
            guard_name="product-claim-verify",
            passed=not triggered,
            action=self.action if triggered else "allow",
            message=f"Unsubstantiated claims: {', '.join(matched)}" if triggered else None,
            latency_ms=round(elapsed, 2),
            details={"unsubstantiated_claims": matched} if triggered else None,
        )


def product_claim_verify(*, action: str = "block") -> _ProductClaimVerify:
    return _ProductClaimVerify(action=action)
