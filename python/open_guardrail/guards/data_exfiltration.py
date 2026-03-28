"""Detect data exfiltration attempts."""

import re
import time
from typing import List, Optional

from open_guardrail.core import GuardResult

_DEFAULT_PATTERNS: list[re.Pattern[str]] = [
    re.compile(
        r"(send|transmit)\s+data\s+to",
        re.IGNORECASE,
    ),
    re.compile(
        r"curl\s+-d\b",
        re.IGNORECASE,
    ),
    re.compile(
        r"fetch\s*\(\s*[\"']https?://",
        re.IGNORECASE,
    ),
    re.compile(
        r"\bwebhook\b",
        re.IGNORECASE,
    ),
    re.compile(
        r"base64\s+encode\s+(password|secret)",
        re.IGNORECASE,
    ),
    re.compile(
        r"exfiltrat",
        re.IGNORECASE,
    ),
    re.compile(
        r"dump\s+user\s+data",
        re.IGNORECASE,
    ),
    re.compile(
        r"copy\s+database\s+to\s+external",
        re.IGNORECASE,
    ),
    re.compile(
        r"DNS\s+tunnel",
        re.IGNORECASE,
    ),
    re.compile(
        r"steganograph",
        re.IGNORECASE,
    ),
    re.compile(
        r"encode\s+data\s+in\s+image",
        re.IGNORECASE,
    ),
]


class _DataExfiltration:
    def __init__(
        self,
        *,
        action: str = "block",
        extra_patterns: Optional[List[re.Pattern[str]]] = None,
    ) -> None:
        self.name = "data-exfiltration"
        self.action = action
        self._patterns = list(_DEFAULT_PATTERNS)
        if extra_patterns:
            self._patterns.extend(extra_patterns)

    def check(
        self, text: str, stage: str = "input"
    ) -> GuardResult:
        start = time.perf_counter()
        matched: list[str] = []

        for pat in self._patterns:
            if pat.search(text):
                matched.append(pat.pattern)

        triggered = len(matched) > 0
        score = min(len(matched) / 3, 1.0) if triggered else 0.0
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="data-exfiltration",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=score,
            message=(
                "Data exfiltration attempt detected"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {
                    "matched_patterns": len(matched),
                    "reason": (
                        "Text contains patterns indicating"
                        " an attempt to exfiltrate data"
                        " to external destinations"
                    ),
                }
                if triggered
                else None
            ),
        )


def data_exfiltration(
    *,
    action: str = "block",
    extra_patterns: Optional[List[re.Pattern[str]]] = None,
) -> _DataExfiltration:
    return _DataExfiltration(
        action=action, extra_patterns=extra_patterns
    )
