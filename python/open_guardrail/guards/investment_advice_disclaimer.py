"""Detect unlicensed financial advice and enforce disclaimers (SEC/FCA compliance)."""
from __future__ import annotations

import re
import time

from open_guardrail.core import GuardResult

_ADVICE_PATTERNS = [
    re.compile(r"you\s+should\s+invest\s+in", re.I),
    re.compile(r"buy\s+this\s+stock", re.I),
    re.compile(r"I\s+recommend\s+buying", re.I),
    re.compile(r"sell\s+your\s+shares", re.I),
    re.compile(r"guaranteed\s+returns", re.I),
    re.compile(r"this\s+stock\s+will\s+go\s+up", re.I),
    re.compile(r"put\s+your\s+money\s+in", re.I),
    re.compile(r"best\s+investment\s+right\s+now", re.I),
]

_DISCLAIMER_PATTERNS = [
    re.compile(r"not\s+financial\s+advice", re.I),
    re.compile(r"consult\s+a\s+financial\s+advisor", re.I),
    re.compile(r"for\s+informational\s+purposes\s+only", re.I),
    re.compile(r"past\s+performance", re.I),
    re.compile(r"no\s+guarantee", re.I),
]


class _InvestmentAdviceDisclaimer:
    def __init__(self, *, action: str = "block"):
        self.name = "investment-advice-disclaimer"
        self.action = action

    def check(self, text: str, stage: str = "output") -> GuardResult:
        start = time.perf_counter()
        advice_found = [p.pattern for p in _ADVICE_PATTERNS if p.search(text)]
        has_disclaimer = any(p.search(text) for p in _DISCLAIMER_PATTERNS) if advice_found else False
        triggered = len(advice_found) > 0 and not has_disclaimer
        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(
            guard_name="investment-advice-disclaimer",
            passed=not triggered,
            action=self.action if triggered else "allow",
            message="Financial advice detected without disclaimer" if triggered else None,
            latency_ms=round(elapsed, 2),
            details={"advice_patterns": advice_found, "disclaimer_found": has_disclaimer} if triggered else None,
        )


def investment_advice_disclaimer(*, action: str = "block") -> _InvestmentAdviceDisclaimer:
    return _InvestmentAdviceDisclaimer(action=action)
