"""Detect prompt injection and jailbreak attempts."""

import re
import time
from typing import List, Optional

from open_guardrail.core import GuardResult

_DEFAULT_PATTERNS: list[re.Pattern[str]] = [
    re.compile(
        r"ignore\s+(all\s+)?(previous|prior|above)"
        r"\s+(instructions|rules|guidelines)",
        re.IGNORECASE,
    ),
    re.compile(
        r"disregard\s+(all\s+)?(previous|prior|your)"
        r"\s+(instructions|rules|programming)",
        re.IGNORECASE,
    ),
    re.compile(
        r"forget\s+(all\s+)?(previous|prior|your)"
        r"\s+(instructions|rules|context)",
        re.IGNORECASE,
    ),
    re.compile(
        r"you\s+are\s+now\s+\w+\.\s+\w+\s+can\s+do\s+anything",
        re.IGNORECASE,
    ),
    re.compile(
        r"pretend\s+you\s+(are|have)"
        r"\s+(no\s+restrictions|unlimited|DAN)",
        re.IGNORECASE,
    ),
    re.compile(
        r"(print|show|reveal|output|display)"
        r"\s+(your\s+)?"
        r"(system\s+prompt|instructions|initial\s+prompt)",
        re.IGNORECASE,
    ),
    re.compile(r"\bDAN\b.*\bdo\s+anything\b", re.IGNORECASE),
    re.compile(r"jailbreak", re.IGNORECASE),
    re.compile(r"ignore\s+all\s+rules", re.IGNORECASE),
    re.compile(
        r"act\s+as\s+if\s+you\s+have\s+no"
        r"\s+(restrictions|limits|guidelines)",
        re.IGNORECASE,
    ),
]


class _PromptInjection:
    def __init__(
        self,
        *,
        action: str = "block",
        extra_patterns: Optional[List[re.Pattern[str]]] = None,
    ) -> None:
        self.name = "prompt-injection"
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
            guard_name="prompt-injection",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=score,
            message=(
                "Prompt injection detected"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {
                    "matched_patterns": len(matched),
                    "reason": (
                        "Text contains prompt injection"
                        " patterns attempting to override"
                        " system instructions"
                    ),
                }
                if triggered
                else None
            ),
        )


def prompt_injection(
    *,
    action: str = "block",
    extra_patterns: Optional[List[re.Pattern[str]]] = None,
) -> _PromptInjection:
    return _PromptInjection(
        action=action, extra_patterns=extra_patterns
    )
