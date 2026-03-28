"""Detect leaked conversation context."""
from __future__ import annotations

import time

from open_guardrail.core import GuardResult

_PATTERNS = [
    "previous conversation",
    "earlier you said",
    "in our last chat",
    "you told me before",
    "remember when",
    "last time we spoke",
    "you mentioned earlier",
    "from our previous",
    "as you said before",
    "in our prior discussion",
]


class _ConversationMemoryLeak:
    def __init__(self, *, action: str = "warn") -> None:
        self.name = "conversation-memory-leak"
        self.action = action

    def check(
        self, text: str, stage: str = "input"
    ) -> GuardResult:
        start = time.perf_counter()
        lower = text.lower()
        matched = [p for p in _PATTERNS if p in lower]
        triggered = len(matched) > 0
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="conversation-memory-leak",
            passed=not triggered,
            action=self.action if triggered else "allow",
            message=(
                "Conversation context leak detected"
                if triggered else None
            ),
            latency_ms=round(elapsed, 2),
            details={
                "matched": matched,
            } if triggered else None,
        )


def conversation_memory_leak(
    *, action: str = "warn",
) -> _ConversationMemoryLeak:
    return _ConversationMemoryLeak(action=action)
