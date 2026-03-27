"""Detects privilege escalation attempts."""

import re
import time
from typing import List, Optional

from open_guardrail.core import GuardResult

_PATTERNS = [
    re.compile(r"\b(?:sudo|su\s+root|chmod\s+[0-7]*7[0-7]*|chown\s+root)\b", re.I),
    re.compile(r"\b(?:admin|root|superuser)\s+(?:access|privilege|permission|role)", re.I),
    re.compile(r"(?:elevat|escalat|promot)\w*\s+(?:privilege|permission|role|access)", re.I),
    re.compile(r"\b(?:override|bypass|disable)\s+(?:auth|security|permission|access\s*control)", re.I),
    re.compile(r"\brun\s+as\s+(?:admin|root|system|superuser)\b", re.I),
    re.compile(r"\b(?:grant|assign)\s+(?:all|admin|root|super)\s+(?:privilege|permission|role)", re.I),
    re.compile(r"\b(?:delete|drop|truncate)\s+(?:all|database|table|collection|user)", re.I),
    re.compile(r"\b(?:rm\s+-rf\s+/|format\s+[cC]:)", re.I),
    re.compile(r"\b(?:exec|eval|system|spawn)\s*\(", re.I),
    re.compile(r"\b(?:api[_\s]*key|secret|token|password)\s*(?:=|:)\s*\S+", re.I),
]


class _EscalationDetect:
    def __init__(
        self, *, action: str = "block", extra_keywords: Optional[List[str]] = None,
    ) -> None:
        self.name = "escalation-detect"
        self.action = action
        self._extra = [
            re.compile(r"\b" + re.escape(kw) + r"\b", re.I)
            for kw in (extra_keywords or [])
        ]

    def check(self, text: str, stage: str = "input") -> GuardResult:
        start = time.perf_counter()
        matched: List[str] = []
        for p in _PATTERNS:
            m = p.search(text)
            if m:
                matched.append(m.group())
        for p in self._extra:
            m = p.search(text)
            if m:
                matched.append(m.group())
        triggered = len(matched) > 0
        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(
            guard_name="escalation-detect",
            passed=not triggered,
            action=self.action if triggered else "allow",
            message="Privilege escalation detected" if triggered else None,
            latency_ms=round(elapsed, 2),
            details={"matched": list(set(matched))} if triggered else None,
        )


def escalation_detect(
    *, action: str = "block", extra_keywords: Optional[List[str]] = None,
) -> _EscalationDetect:
    return _EscalationDetect(action=action, extra_keywords=extra_keywords)
