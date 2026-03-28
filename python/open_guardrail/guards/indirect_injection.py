"""Detect indirect prompt injection via RAG contexts and tool outputs."""
from __future__ import annotations

import re
import time
from typing import List, Optional

from open_guardrail.core import GuardResult

_DEFAULT_PATTERNS: list[re.Pattern[str]] = [
    re.compile(r"\[INST\]", re.IGNORECASE),
    re.compile(r"<\|system\|>", re.IGNORECASE),
    re.compile(r"<\|user\|>", re.IGNORECASE),
    re.compile(
        r"IMPORTANT:\s*ignore",
        re.IGNORECASE,
    ),
    re.compile(r"ADMIN\s+OVERRIDE", re.IGNORECASE),
    re.compile(r"DEVELOPER\s+MODE", re.IGNORECASE),
    re.compile(
        r"ignore\s+the\s+above\s+context",
        re.IGNORECASE,
    ),
    re.compile(
        r"instead\s+respond\s+with",
        re.IGNORECASE,
    ),
    re.compile(
        r"<\|im_start\|>", re.IGNORECASE,
    ),
    re.compile(
        r"<<\s*SYS\s*>>", re.IGNORECASE,
    ),
]


class _IndirectInjection:
    def __init__(
        self,
        *,
        action: str = "block",
        extra_patterns: Optional[List[re.Pattern[str]]] = None,
    ) -> None:
        self.name = "indirect-injection"
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
            guard_name="indirect-injection",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=score,
            message=(
                "Indirect prompt injection detected"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {
                    "matched_patterns": len(matched),
                    "reason": (
                        "Text contains indirect injection"
                        " patterns embedded in context"
                        " or tool outputs"
                    ),
                }
                if triggered
                else None
            ),
        )


def indirect_injection(
    *,
    action: str = "block",
    extra_patterns: Optional[List[re.Pattern[str]]] = None,
) -> _IndirectInjection:
    return _IndirectInjection(
        action=action, extra_patterns=extra_patterns
    )
