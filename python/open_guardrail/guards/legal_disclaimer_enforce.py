"""Ensure legal advice includes appropriate disclaimers."""
from __future__ import annotations

import re
import time

from open_guardrail.core import GuardResult

_ADVICE = [
    re.compile(r"\byou\s+should\s+sue\b", re.I),
    re.compile(r"\byou\s+have\s+a\s+strong\s+case\b", re.I),
    re.compile(r"\bfile\s+a\s+lawsuit\b", re.I),
    re.compile(r"\byou\s+are\s+liable\b", re.I),
    re.compile(r"\bthis\s+constitutes\s+a\s+breach\b", re.I),
    re.compile(r"\byour\s+rights\s+under\b", re.I),
    re.compile(r"\blegal\s+grounds\s+for\b", re.I),
    re.compile(r"\bas\s+your\s+attorney\b", re.I),
]

_DISCLAIMERS = [
    re.compile(r"\bnot\s+legal\s+advice\b", re.I),
    re.compile(r"\bconsult\s+an?\s+attorney\b", re.I),
    re.compile(r"\bconsult\s+a\s+lawyer\b", re.I),
    re.compile(r"\bfor\s+informational\s+purposes\b", re.I),
    re.compile(r"\bnot\s+a\s+substitute\s+for\s+legal\s+counsel\b", re.I),
]


class _LegalDisclaimerEnforce:
    def __init__(self, *, action: str = "block") -> None:
        self.name = "legal-disclaimer-enforce"
        self.action = action

    def check(self, text: str, stage: str = "output") -> GuardResult:
        start = time.perf_counter()
        advice: list[str] = []
        for p in _ADVICE:
            m = p.search(text)
            if m:
                advice.append(m.group())
        has_disc = any(p.search(text) for p in _DISCLAIMERS)
        triggered = len(advice) > 0 and not has_disc
        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(
            guard_name="legal-disclaimer-enforce",
            passed=not triggered,
            action=self.action if triggered else "allow",
            message=f'Legal advice without disclaimer: "{advice[0]}"' if triggered else None,
            latency_ms=round(elapsed, 2),
            details={"advice_patterns": advice, "has_disclaimer": has_disc} if triggered else None,
        )


def legal_disclaimer_enforce(*, action: str = "block") -> _LegalDisclaimerEnforce:
    return _LegalDisclaimerEnforce(action=action)
