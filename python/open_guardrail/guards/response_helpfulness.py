"""Score response helpfulness and detect non-answers."""
from __future__ import annotations

import re
import time
from typing import Optional

from open_guardrail.core import GuardResult

_NON_ANSWER_PATTERNS: list[re.Pattern[str]] = [
    re.compile(
        r"^I\s+(don't|do not)\s+know\.?\s*$",
        re.IGNORECASE,
    ),
    re.compile(
        r"^I('m|\s+am)\s+not\s+sure\.?\s*$",
        re.IGNORECASE,
    ),
    re.compile(
        r"^I\s+cannot\s+(help|assist)"
        r"\s+with\s+that\.?\s*$",
        re.IGNORECASE,
    ),
    re.compile(
        r"^sorry,?\s+I\s+(don't|do not)"
        r"\s+have\s+(that\s+)?information",
        re.IGNORECASE,
    ),
]

_CIRCULAR_PATTERNS: list[re.Pattern[str]] = [
    re.compile(
        r"as\s+(?:I\s+)?(?:just\s+)?(?:mentioned"
        r"|said|stated)\s+(?:above|earlier|before)",
        re.IGNORECASE,
    ),
]


def _is_restatement(text: str) -> bool:
    sentences = [
        s.strip()
        for s in re.split(r"[.!?]+", text)
        if s.strip()
    ]
    if len(sentences) < 2:
        return False
    first = re.sub(
        r"[^a-z0-9\s]", "", sentences[0].lower()
    )
    last = re.sub(
        r"[^a-z0-9\s]", "", sentences[-1].lower()
    )
    if not first or not last:
        return False
    first_words = set(first.split())
    last_words = last.split()
    overlap = sum(1 for w in last_words if w in first_words)
    return overlap / max(len(last_words), 1) > 0.8


class _ResponseHelpfulness:
    def __init__(
        self, *, action: str = "warn"
    ) -> None:
        self.name = "response-helpfulness"
        self.action = action

    def check(
        self, text: str, stage: str = "output"
    ) -> GuardResult:
        start = time.perf_counter()
        issues: list[str] = []

        for pat in _NON_ANSWER_PATTERNS:
            if pat.search(text.strip()):
                issues.append("non-answer")
                break

        for pat in _CIRCULAR_PATTERNS:
            if pat.search(text):
                issues.append("circular")
                break

        if _is_restatement(text):
            issues.append("restatement")

        words = text.strip().split()
        if len(words) < 3 and not re.match(
            r"^\d+$", text.strip()
        ):
            issues.append("too-short")

        triggered = len(issues) > 0
        score = (
            min(len(issues) / 3, 1.0)
            if triggered
            else 0.0
        )
        elapsed = (
            time.perf_counter() - start
        ) * 1000

        return GuardResult(
            guard_name="response-helpfulness",
            passed=not triggered,
            action=(
                self.action if triggered else "allow"
            ),
            score=score,
            message=(
                "Response lacks helpfulness"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {"issues": issues}
                if triggered
                else None
            ),
        )


def response_helpfulness(
    *, action: str = "warn"
) -> _ResponseHelpfulness:
    return _ResponseHelpfulness(action=action)
