"""Customizable content policy guard."""

import re
import time
from typing import List, Optional

from open_guardrail.core import GuardResult

_DEFAULT_RULES = [
    r"you\s+should\s+(always|definitely)\s+(invest|buy|take)",
    r"i\s+am\s+a\s+(licensed|certified)"
    r"\s+(doctor|lawyer|therapist)",
    r"(100%\s+)?guaranteed\s+(results|success|returns)",
    r"\b(always|never|guaranteed)\b"
    r".*\b(works?|cures?|fixes?)\b",
    r"this\s+will\s+(definitely|certainly|absolutely)"
    r"\s+(cure|fix|solve)",
    r"no\s+risk\s+(whatsoever|involved|at\s+all)",
]


class _ContentPolicy:
    def __init__(
        self,
        *,
        action: str = "block",
        rules: Optional[List[str]] = None,
    ) -> None:
        self.name = "content-policy"
        self.action = action
        src = rules if rules is not None else _DEFAULT_RULES
        self._patterns = [
            re.compile(r, re.IGNORECASE) for r in src
        ]

    def check(
        self, text: str, stage: str = "output"
    ) -> GuardResult:
        start = time.perf_counter()
        matched: list[str] = []
        for p in self._patterns:
            if p.search(text):
                matched.append(p.pattern)
        triggered = len(matched) > 0
        score = min(len(matched) / 3, 1.0) if triggered else 0.0
        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(
            guard_name="content-policy",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=score,
            message=(
                "Content policy violation detected"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {
                    "matched_rules": len(matched),
                    "reason": "Content policy violation",
                }
                if triggered
                else None
            ),
        )


def content_policy(
    *,
    action: str = "block",
    rules: Optional[List[str]] = None,
) -> _ContentPolicy:
    return _ContentPolicy(action=action, rules=rules)
