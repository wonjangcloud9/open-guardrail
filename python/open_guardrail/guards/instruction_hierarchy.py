"""Enforce instruction hierarchy against override attempts."""

import re
import time
from typing import List, Optional

from open_guardrail.core import GuardResult

_DEFAULT_PATTERNS: list[re.Pattern[str]] = [
    re.compile(
        r"ignore\s+system\s+instructions", re.IGNORECASE
    ),
    re.compile(
        r"override\s+the\s+system\s+prompt", re.IGNORECASE
    ),
    re.compile(
        r"your\s+real\s+instructions\s+are",
        re.IGNORECASE,
    ),
    re.compile(
        r"the\s+developer\s+told\s+me\s+to\s+tell\s+you",
        re.IGNORECASE,
    ),
    re.compile(
        r"new\s+system\s+prompt\s*:", re.IGNORECASE
    ),
]


class _InstructionHierarchy:
    def __init__(
        self,
        *,
        action: str = "block",
        extra_patterns: Optional[List[re.Pattern[str]]] = None,
    ) -> None:
        self.name = "instruction-hierarchy"
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
        score = (
            min(len(matched) / 3, 1.0)
            if triggered
            else 0.0
        )
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="instruction-hierarchy",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=score,
            message=(
                "Instruction hierarchy violation detected"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {
                    "matched_patterns": len(matched),
                    "reason": (
                        "Input attempts to override or"
                        " circumvent system-level"
                        " instructions"
                    ),
                }
                if triggered
                else None
            ),
        )


def instruction_hierarchy(
    *,
    action: str = "block",
    extra_patterns: Optional[List[re.Pattern[str]]] = None,
) -> _InstructionHierarchy:
    return _InstructionHierarchy(
        action=action, extra_patterns=extra_patterns
    )
