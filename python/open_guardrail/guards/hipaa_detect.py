"""Detects HIPAA PHI such as MRN, diagnosis codes, medications, and lab results."""
from __future__ import annotations

import re
import time
from typing import List

from open_guardrail.core import GuardResult

_PATTERNS = [
    ("mrn", re.compile(r"medical\s+record\s*#?\s*\d{6,}", re.IGNORECASE)),
    ("icd_code", re.compile(r"\b[A-Z]\d{2}(?:\.\d{1,4})?\b")),
    ("diagnosis", re.compile(r"diagnos(?:is|ed)\b", re.IGNORECASE)),
    ("medication", re.compile(r"medication.*\d+\s*mg", re.IGNORECASE)),
    ("lab_result", re.compile(r"lab\s+result.*\d+", re.IGNORECASE)),
]


class _HipaaDetect:
    def __init__(self, *, action: str = "block") -> None:
        self.name = "hipaa-detect"
        self.action = action

    def check(self, text: str, stage: str = "input") -> GuardResult:
        start = time.perf_counter()
        matched: List[str] = []
        for label, p in _PATTERNS:
            if p.search(text):
                matched.append(label)
        triggered = len(matched) > 0
        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(
            guard_name="hipaa-detect",
            passed=not triggered,
            action=self.action if triggered else "allow",
            message=f"HIPAA PHI detected: {', '.join(matched)}" if triggered else None,
            latency_ms=round(elapsed, 2),
            details={"categories": matched} if triggered else None,
        )


def hipaa_detect(*, action: str = "block") -> _HipaaDetect:
    return _HipaaDetect(action=action)
