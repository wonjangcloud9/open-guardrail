"""Detect LLM reasoning traces leaking into output."""
from __future__ import annotations

import re
import time
from typing import List, Optional

from open_guardrail.core import GuardResult

_DEFAULT_PATTERNS: list[re.Pattern[str]] = [
    re.compile(r"<thinking>", re.IGNORECASE),
    re.compile(r"</thinking>", re.IGNORECASE),
    re.compile(r"<scratchpad>", re.IGNORECASE),
    re.compile(r"</scratchpad>", re.IGNORECASE),
    re.compile(
        r"Let me think step by step", re.IGNORECASE
    ),
    re.compile(r"Internal reasoning:", re.IGNORECASE),
    re.compile(r"My thought process:", re.IGNORECASE),
    re.compile(r"Note to self:", re.IGNORECASE),
    re.compile(
        r"<[a-zA-Z_]+thinking[a-zA-Z_]*>", re.IGNORECASE
    ),
    re.compile(
        r"<[a-zA-Z_]*reason[a-zA-Z_]*>", re.IGNORECASE
    ),
]


class _ReasoningTraceLeak:
    def __init__(
        self,
        *,
        action: str = "block",
        custom_tags: Optional[List[str]] = None,
    ) -> None:
        self.name = "reasoning-trace-leak"
        self.action = action
        self._patterns = list(_DEFAULT_PATTERNS)
        if custom_tags:
            for tag in custom_tags:
                self._patterns.append(
                    re.compile(
                        re.escape(f"<{tag}>"), re.IGNORECASE
                    )
                )
                self._patterns.append(
                    re.compile(
                        re.escape(f"</{tag}>"), re.IGNORECASE
                    )
                )

    def check(
        self, text: str, stage: str = "output"
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
            guard_name="reasoning-trace-leak",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=score,
            message=(
                "Reasoning trace leak detected"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {
                    "matched_patterns": len(matched),
                    "reason": (
                        "Output contains internal reasoning"
                        " traces that should not be exposed"
                        " to end users"
                    ),
                }
                if triggered
                else None
            ),
        )


def reasoning_trace_leak(
    *,
    action: str = "block",
    custom_tags: Optional[List[str]] = None,
) -> _ReasoningTraceLeak:
    return _ReasoningTraceLeak(
        action=action, custom_tags=custom_tags
    )
