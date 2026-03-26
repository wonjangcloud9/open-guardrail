"""Detect LLM refusal responses."""

import re
import time
from typing import List, Optional

from open_guardrail.core import GuardResult

_REFUSAL_PATTERNS: list[re.Pattern[str]] = [
    re.compile(
        r"I('m| am) (sorry|afraid|unable)",
        re.IGNORECASE,
    ),
    re.compile(
        r"I can('t|not)"
        r" (help|assist|provide|do that"
        r"|generate|create)",
        re.IGNORECASE,
    ),
    re.compile(
        r"I('m| am) not (able|allowed|permitted)",
        re.IGNORECASE,
    ),
    re.compile(
        r"as an AI( language model)?[,.]? I",
        re.IGNORECASE,
    ),
    re.compile(
        r"I don't have"
        r" (the ability|access|permission)",
        re.IGNORECASE,
    ),
    re.compile(
        r"I (must|have to)"
        r" (decline|refuse|refrain)",
        re.IGNORECASE,
    ),
    re.compile(
        r"that('s| is)"
        r" (not something I|beyond my|outside my)",
        re.IGNORECASE,
    ),
    re.compile(
        r"I (cannot|can't)"
        r" (fulfill|comply|assist with)",
        re.IGNORECASE,
    ),
    re.compile(
        r"my (guidelines|programming|instructions)"
        r" (prevent|don't allow|prohibit)",
        re.IGNORECASE,
    ),
    re.compile(
        r"I('m| am) designed to"
        r" (not|avoid|refrain)",
        re.IGNORECASE,
    ),
    re.compile(
        r"I (will not|won't)"
        r" (help|assist|provide|generate)",
        re.IGNORECASE,
    ),
    re.compile(
        r"against my"
        r" (guidelines|policy|programming)",
        re.IGNORECASE,
    ),
]


class _NoRefusal:
    def __init__(
        self,
        *,
        action: str = "block",
        custom_patterns: Optional[List[str]] = None,
    ) -> None:
        self.name = "no-refusal"
        self.action = action
        self._patterns = list(_REFUSAL_PATTERNS)
        if custom_patterns:
            for p in custom_patterns:
                self._patterns.append(
                    re.compile(p, re.IGNORECASE)
                )

    def check(
        self, text: str, stage: str = "output"
    ) -> GuardResult:
        start = time.perf_counter()
        matched: list[str] = []

        for pat in self._patterns:
            m = pat.search(text)
            if m:
                matched.append(m.group())

        triggered = len(matched) > 0
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="no-refusal",
            passed=not triggered,
            action=self.action if triggered else "allow",
            message=(
                f'LLM refusal detected: "{matched[0]}"'
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {
                    "matched": matched,
                    "reason": (
                        "The LLM response contains"
                        " refusal patterns instead of"
                        " answering the question"
                    ),
                }
                if triggered
                else None
            ),
        )


def no_refusal(
    *,
    action: str = "block",
    custom_patterns: Optional[List[str]] = None,
) -> _NoRefusal:
    return _NoRefusal(
        action=action, custom_patterns=custom_patterns
    )
