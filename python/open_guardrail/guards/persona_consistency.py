"""Detect AI breaking character or persona."""
from __future__ import annotations

import re
import time
from typing import List, Optional

from open_guardrail.core import GuardResult

_DEFAULT_PATTERNS: list[re.Pattern[str]] = [
    re.compile(r"\bas an AI\b", re.IGNORECASE),
    re.compile(
        r"\bas a language model\b", re.IGNORECASE
    ),
    re.compile(
        r"I'm just a chatbot", re.IGNORECASE
    ),
    re.compile(
        r"I don't have feelings", re.IGNORECASE
    ),
    re.compile(
        r"I was trained by", re.IGNORECASE
    ),
    re.compile(
        r"my training data", re.IGNORECASE
    ),
    re.compile(
        r"I cannot browse the internet", re.IGNORECASE
    ),
    re.compile(
        r"my knowledge cutoff", re.IGNORECASE
    ),
]


class _PersonaConsistency:
    def __init__(
        self,
        *,
        action: str = "warn",
        allowed_phrases: Optional[List[str]] = None,
    ) -> None:
        self.name = "persona-consistency"
        self.action = action
        self._patterns = list(_DEFAULT_PATTERNS)
        self._allowed = set(
            p.lower() for p in (allowed_phrases or [])
        )

    def check(
        self, text: str, stage: str = "output"
    ) -> GuardResult:
        start = time.perf_counter()
        matched: list[str] = []
        text_lower = text.lower()

        for pat in self._patterns:
            m = pat.search(text)
            if m:
                phrase = m.group(0).lower()
                if phrase not in self._allowed:
                    matched.append(pat.pattern)

        triggered = len(matched) > 0
        score = (
            min(len(matched) / 3, 1.0)
            if triggered
            else 0.0
        )
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="persona-consistency",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=score,
            message=(
                "AI persona break detected"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {
                    "matched_patterns": len(matched),
                    "reason": (
                        "Output contains phrases that"
                        " break the assigned persona or"
                        " reveal AI nature"
                    ),
                }
                if triggered
                else None
            ),
        )


def persona_consistency(
    *,
    action: str = "warn",
    allowed_phrases: Optional[List[str]] = None,
) -> _PersonaConsistency:
    return _PersonaConsistency(
        action=action, allowed_phrases=allowed_phrases
    )
