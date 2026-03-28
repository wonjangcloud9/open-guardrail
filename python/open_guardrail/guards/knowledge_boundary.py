"""Detect when AI claims knowledge beyond its training."""
from __future__ import annotations

import re
import time

from open_guardrail.core import GuardResult

_PATTERNS: list[tuple[str, re.Pattern[str]]] = [
    (
        "certain_knowledge",
        re.compile(
            r"I\s+know\s+for\s+(certain|a fact|sure)"
            r"\s+that",
            re.IGNORECASE,
        ),
    ),
    (
        "latest_data_claim",
        re.compile(
            r"the\s+latest\s+(data|statistics|numbers"
            r"|figures)\s+show",
            re.IGNORECASE,
        ),
    ),
    (
        "real_time_claim",
        re.compile(
            r"(real[- ]time|live|current)"
            r"\s+(data|price|stock|weather|status)"
            r"\s+(shows?|is|are)",
            re.IGNORECASE,
        ),
    ),
    (
        "post_cutoff_event",
        re.compile(
            r"(as\s+of|in)\s+(today|now|this\s+moment"
            r"|right\s+now),?\s+(the|we|it)",
            re.IGNORECASE,
        ),
    ),
    (
        "browsing_claim",
        re.compile(
            r"I\s+(just\s+)?(checked|browsed"
            r"|looked\s+up|searched|visited)",
            re.IGNORECASE,
        ),
    ),
    (
        "confirmed_fact",
        re.compile(
            r"I\s+can\s+confirm\s+that\s+this\s+is"
            r"\s+(true|accurate|correct)",
            re.IGNORECASE,
        ),
    ),
    (
        "definitive_future",
        re.compile(
            r"will\s+definitely"
            r"\s+(happen|occur|take\s+place)",
            re.IGNORECASE,
        ),
    ),
    (
        "absolute_claim",
        re.compile(
            r"there\s+is\s+no\s+doubt\s+that",
            re.IGNORECASE,
        ),
    ),
    (
        "current_price",
        re.compile(
            r"the\s+(current|today'?s)"
            r"\s+(price|rate|value)"
            r"\s+(of|for|is)",
            re.IGNORECASE,
        ),
    ),
    (
        "just_announced",
        re.compile(
            r"(just|recently)"
            r"\s+(announced|released|published)"
            r"\s+(today|this)",
            re.IGNORECASE,
        ),
    ),
]


class _KnowledgeBoundary:
    def __init__(self, *, action: str = "warn") -> None:
        self.name = "knowledge-boundary"
        self.action = action

    def check(
        self, text: str, stage: str = "output"
    ) -> GuardResult:
        start = time.perf_counter()
        matched: list[str] = []

        for name, pat in _PATTERNS:
            if pat.search(text):
                matched.append(name)

        triggered = len(matched) > 0
        score = (
            min(len(matched) / 3, 1.0) if triggered else 0.0
        )
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="knowledge-boundary",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=score,
            message=(
                "Knowledge boundary violation detected"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {"matched": matched} if triggered else None
            ),
        )


def knowledge_boundary(
    *, action: str = "warn"
) -> _KnowledgeBoundary:
    return _KnowledgeBoundary(action=action)
