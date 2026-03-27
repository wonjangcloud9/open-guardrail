"""Checks that redaction markers and raw PII do not coexist."""

import re
import time
from typing import List

from open_guardrail.core import GuardResult

_REDACTION_MARKERS = re.compile(r"\[(EMAIL|PHONE|REDACTED)\]")

_RAW_PII = [
    ("email", re.compile(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}")),
    ("ssn", re.compile(r"\b\d{3}-\d{2}-\d{4}\b")),
    ("phone", re.compile(r"\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b")),
]


class _PiiRedactConsistency:
    def __init__(self, *, action: str = "block") -> None:
        self.name = "pii-redact-consistency"
        self.action = action

    def check(self, text: str, stage: str = "input") -> GuardResult:
        start = time.perf_counter()
        has_markers = bool(_REDACTION_MARKERS.search(text))
        leaked: List[str] = []
        if has_markers:
            for label, p in _RAW_PII:
                if p.search(text):
                    leaked.append(label)
        triggered = len(leaked) > 0
        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(
            guard_name="pii-redact-consistency",
            passed=not triggered,
            action=self.action if triggered else "allow",
            message=f"Raw PII coexists with redaction markers: {', '.join(leaked)}" if triggered else None,
            latency_ms=round(elapsed, 2),
            details={"leaked_types": leaked} if triggered else None,
        )


def pii_redact_consistency(*, action: str = "block") -> _PiiRedactConsistency:
    return _PiiRedactConsistency(action=action)
