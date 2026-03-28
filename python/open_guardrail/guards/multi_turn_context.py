"""Track multi-turn conversation context."""
from __future__ import annotations

import time

from open_guardrail.core import GuardResult


def _jaccard(a: set, b: set) -> float:
    if not a and not b:
        return 1.0
    union = a | b
    if not union:
        return 1.0
    return len(a & b) / len(union)


class _MultiTurnContext:
    def __init__(
        self,
        *,
        action: str = "warn",
        max_turns: int = 20,
    ) -> None:
        self.name = "multi-turn-context"
        self.action = action
        self.max_turns = max_turns
        self._history: list[set[str]] = []

    def check(
        self, text: str, stage: str = "input"
    ) -> GuardResult:
        start = time.perf_counter()
        words = set(text.lower().split())
        reasons: list[str] = []

        if self._history:
            prev = self._history[-1]
            sim = _jaccard(prev, words)
            if sim < 0.1:
                reasons.append("topic-drift")

        self._history.append(words)

        if len(self._history) > self.max_turns:
            reasons.append("excessive-turns")

        triggered = len(reasons) > 0
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="multi-turn-context",
            passed=not triggered,
            action=self.action if triggered else "allow",
            message=(
                f"Conversation issue: {', '.join(reasons)}"
                if triggered else None
            ),
            latency_ms=round(elapsed, 2),
            details={
                "reasons": reasons,
                "turn_count": len(self._history),
            } if triggered else None,
        )


def multi_turn_context(
    *, action: str = "warn", max_turns: int = 20,
) -> _MultiTurnContext:
    return _MultiTurnContext(
        action=action, max_turns=max_turns,
    )
