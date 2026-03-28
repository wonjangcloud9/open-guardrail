"""Detect CVE references and known vulnerability patterns."""
from __future__ import annotations

import re
import time
from open_guardrail.core import GuardResult

_PATTERNS: list[re.Pattern[str]] = [
    re.compile(r"CVE-\d{4}-\d{4,}"),
    re.compile(r"exploit\s+(for|in|of|the)\b", re.IGNORECASE),
    re.compile(
        r"vulnerability\s+in\s+\S+\s+\d+\.\d+", re.IGNORECASE
    ),
    re.compile(r"proof[- ]of[- ]concept\s+exploit", re.IGNORECASE),
    re.compile(r"remote\s+code\s+execution", re.IGNORECASE),
    re.compile(r"0[- ]?day\s+(exploit|vulnerability)", re.IGNORECASE),
    re.compile(r"buffer\s+overflow\s+in\s+\S+", re.IGNORECASE),
    re.compile(r"CWE-\d{1,4}"),
    re.compile(r"CVSS\s*:\s*\d+\.\d+", re.IGNORECASE),
    re.compile(r"known\s+vulnerable\s+version", re.IGNORECASE),
]


class _CveDetect:
    def __init__(self, *, action: str = "block") -> None:
        self.name = "cve-detect"
        self.action = action
        self._patterns = list(_PATTERNS)

    def check(self, text: str, stage: str = "input") -> GuardResult:
        start = time.perf_counter()
        matched: list[str] = []
        for pat in self._patterns:
            if pat.search(text):
                matched.append(pat.pattern)
        triggered = len(matched) > 0
        score = min(len(matched) / 3, 1.0) if triggered else 0.0
        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(
            guard_name="cve-detect",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=score,
            message="CVE/vulnerability detected" if triggered else None,
            latency_ms=round(elapsed, 2),
            details=(
                {"matched_patterns": len(matched)}
                if triggered
                else None
            ),
        )


def cve_detect(*, action: str = "block") -> _CveDetect:
    return _CveDetect(action=action)
