"""Enforce fair lending explanation requirements (ECOA/FCRA)."""
from __future__ import annotations

import re
import time

from open_guardrail.core import GuardResult

_DECISION_PATTERNS = [
    re.compile(r"loan\s+(approved|denied)", re.I),
    re.compile(r"credit\s+application", re.I),
    re.compile(r"\bcreditworthiness\b", re.I),
    re.compile(r"credit\s+score", re.I),
    re.compile(r"lending\s+decision", re.I),
    re.compile(r"mortgage\s+(approved|denied)", re.I),
]

_ADVERSE_NOTICE = [
    re.compile(r"reason\s+for\s+denial", re.I),
    re.compile(r"factors?\s+considered", re.I),
    re.compile(r"adverse\s+action", re.I),
]

_SPECIFIC_REASONS = [
    re.compile(r"\bincome\b", re.I),
    re.compile(r"debt[- ]to[- ]income", re.I),
    re.compile(r"credit\s+history", re.I),
    re.compile(r"\bemployment\b", re.I),
    re.compile(r"\bcollateral\b", re.I),
]

_PROHIBITED_FACTORS = [
    re.compile(r"\brace\b", re.I),
    re.compile(r"\breligion\b", re.I),
    re.compile(r"\bgender\b", re.I),
    re.compile(r"marital\s+status", re.I),
    re.compile(r"national\s+origin", re.I),
]


class _CreditDecisionExplain:
    def __init__(self, *, action: str = "block"):
        self.name = "credit-decision-explain"
        self.action = action

    def check(self, text: str, stage: str = "output") -> GuardResult:
        start = time.perf_counter()
        has_decision = any(p.search(text) for p in _DECISION_PATTERNS)

        if not has_decision:
            elapsed = (time.perf_counter() - start) * 1000
            return GuardResult(
                guard_name="credit-decision-explain",
                passed=True,
                action="allow",
                latency_ms=round(elapsed, 2),
            )

        prohibited = [p.pattern for p in _PROHIBITED_FACTORS if p.search(text)]
        if prohibited:
            elapsed = (time.perf_counter() - start) * 1000
            return GuardResult(
                guard_name="credit-decision-explain",
                passed=False,
                action=self.action,
                message="Prohibited factors found in credit decision",
                latency_ms=round(elapsed, 2),
                details={"reason": "prohibited-factors", "prohibited_found": prohibited},
            )

        has_adverse = any(p.search(text) for p in _ADVERSE_NOTICE)
        has_specific = any(p.search(text) for p in _SPECIFIC_REASONS)
        missing = not has_adverse or not has_specific
        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(
            guard_name="credit-decision-explain",
            passed=not missing,
            action=self.action if missing else "allow",
            message="Credit decision missing required explanation" if missing else None,
            latency_ms=round(elapsed, 2),
            details={"has_adverse_notice": has_adverse, "has_specific_reason": has_specific} if missing else None,
        )


def credit_decision_explain(*, action: str = "block") -> _CreditDecisionExplain:
    return _CreditDecisionExplain(action=action)
