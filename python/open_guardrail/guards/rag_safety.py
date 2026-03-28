"""RAG pipeline safety guard."""
from __future__ import annotations

import re
import time
from typing import List, Optional

from open_guardrail.core import GuardResult

_MANIPULATION_PATTERNS: list[re.Pattern[str]] = [
    re.compile(
        r"(ignore|disregard)\s+the\s+context",
        re.IGNORECASE,
    ),
    re.compile(
        r"make\s+up\s+an\s+answer",
        re.IGNORECASE,
    ),
    re.compile(
        r"fabricate\s+response",
        re.IGNORECASE,
    ),
]

_POISONING_PATTERNS: list[re.Pattern[str]] = [
    re.compile(r"\[hidden:", re.IGNORECASE),
    re.compile(r"<!--.*?-->"),
    re.compile(r"[\u200b\u200c\u200d\ufeff]"),
    re.compile(r"data:text/html", re.IGNORECASE),
    re.compile(r"javascript:", re.IGNORECASE),
]

_ATTRIBUTION_PATTERNS: list[re.Pattern[str]] = [
    re.compile(
        r"according\s+to\s+(no|fake)\s+source",
        re.IGNORECASE,
    ),
    re.compile(
        r"source:\s*(none|unavailable)",
        re.IGNORECASE,
    ),
]


class _RagSafety:
    def __init__(
        self,
        *,
        action: str = "block",
        check_manipulation: bool = True,
        extra_patterns: Optional[List[re.Pattern[str]]] = None,
    ) -> None:
        self.name = "rag-safety"
        self.action = action
        self._patterns: list[re.Pattern[str]] = []
        if check_manipulation:
            self._patterns.extend(_MANIPULATION_PATTERNS)
        self._patterns.extend(_POISONING_PATTERNS)
        self._patterns.extend(_ATTRIBUTION_PATTERNS)
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
            guard_name="rag-safety",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=score,
            message=(
                "RAG safety violation detected"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {
                    "matched_patterns": len(matched),
                    "reason": (
                        "Text contains patterns indicating"
                        " RAG pipeline manipulation,"
                        " context poisoning, or"
                        " attribution issues"
                    ),
                }
                if triggered
                else None
            ),
        )


def rag_safety(
    *,
    action: str = "block",
    check_manipulation: bool = True,
    extra_patterns: Optional[List[re.Pattern[str]]] = None,
) -> _RagSafety:
    return _RagSafety(
        action=action,
        check_manipulation=check_manipulation,
        extra_patterns=extra_patterns,
    )
