"""Ensure KYC flows collect only legally required data."""
from __future__ import annotations

import re
import time

from open_guardrail.core import GuardResult

_KYC_CONTEXT = [
    re.compile(r"\bkyc\b", re.I),
    re.compile(r"know\s+your\s+customer", re.I),
    re.compile(r"identity\s+verification", re.I),
    re.compile(r"customer\s+verification", re.I),
]

_EXCESSIVE_DATA = [
    ("religion", re.compile(r"\breligion\b|\breligious\s+affiliation\b", re.I)),
    ("political-affiliation", re.compile(r"political\s+(affiliation|party|belief)", re.I)),
    ("sexual-orientation", re.compile(r"sexual\s+orientation", re.I)),
    ("genetic-data", re.compile(r"genetic\s+(data|information|testing)", re.I)),
    ("union-membership", re.compile(r"union\s+membership", re.I)),
    ("biometric-excessive", re.compile(r"\b(fingerprint|retina|iris|dna)\s+(scan|sample|data)", re.I)),
    ("browsing-history", re.compile(r"browsing\s+history", re.I)),
    ("social-media-password", re.compile(r"social\s+media\s+password", re.I)),
]


class _KycDataMinimization:
    def __init__(self, *, action: str = "block"):
        self.name = "kyc-data-minimization"
        self.action = action

    def check(self, text: str, stage: str = "output") -> GuardResult:
        start = time.perf_counter()
        is_kyc = any(p.search(text) for p in _KYC_CONTEXT)
        excessive: list[str] = []
        if is_kyc:
            excessive = [name for name, pat in _EXCESSIVE_DATA if pat.search(text)]
        triggered = len(excessive) > 0
        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(
            guard_name="kyc-data-minimization",
            passed=not triggered,
            action=self.action if triggered else "allow",
            message="Excessive data collection in KYC context" if triggered else None,
            latency_ms=round(elapsed, 2),
            details={"excessive_fields": excessive} if triggered else None,
        )


def kyc_data_minimization(*, action: str = "block") -> _KycDataMinimization:
    return _KycDataMinimization(action=action)
