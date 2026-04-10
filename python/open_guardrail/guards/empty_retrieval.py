"""Detect confident answers despite no retrieval context."""
from __future__ import annotations

import re
import time
from typing import List, Optional

from open_guardrail.core import GuardResult

_DEFAULT_EMPTY_MARKERS = [
    "no results found", "no documents",
    "no relevant", "empty context",
    "no matches", "nothing retrieved",
    "0 results",
]

_CONFIDENT_ASSERTIONS: list[re.Pattern[str]] = [
    re.compile(r"\bthe\s+answer\s+is\b", re.IGNORECASE),
    re.compile(r"\bspecifically\b", re.IGNORECASE),
    re.compile(r"\bexactly\b", re.IGNORECASE),
    re.compile(r"\bcertainly\b", re.IGNORECASE),
    re.compile(r"\bdefinitely\b", re.IGNORECASE),
    re.compile(r"\bthe\s+data\s+shows?\b", re.IGNORECASE),
    re.compile(r"\baccording\s+to\b", re.IGNORECASE),
]


class _EmptyRetrieval:
    def __init__(
        self,
        *,
        action: str = "warn",
        empty_context_markers: Optional[List[str]] = None,
    ) -> None:
        self.name = "empty-retrieval"
        self.action = action
        self._markers = (
            empty_context_markers
            if empty_context_markers is not None
            else _DEFAULT_EMPTY_MARKERS
        )

    def check(
        self, text: str, stage: str = "output"
    ) -> GuardResult:
        start = time.perf_counter()
        lower = text.lower()

        has_empty = any(
            m.lower() in lower for m in self._markers
        )
        has_confidence = any(
            p.search(text) for p in _CONFIDENT_ASSERTIONS
        )

        triggered = has_empty and has_confidence
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="empty-retrieval",
            passed=not triggered,
            action=self.action if triggered else "allow",
            message=(
                "Confident assertion with empty retrieval"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {
                    "reason": (
                        "Confident assertion found"
                        " alongside empty retrieval marker"
                    ),
                }
                if triggered
                else None
            ),
        )


def empty_retrieval(
    *,
    action: str = "warn",
    empty_context_markers: Optional[List[str]] = None,
) -> _EmptyRetrieval:
    return _EmptyRetrieval(
        action=action,
        empty_context_markers=empty_context_markers,
    )
