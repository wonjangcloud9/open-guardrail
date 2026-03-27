"""Detect leaked system prompt patterns."""

import time

from open_guardrail.core import GuardResult

_PATTERNS = [
    "system prompt:", "<<sys>>", "[inst]",
    "you are a helpful", "your instructions are",
    "system message:", "<<system>>",
    "below is your prompt", "ignore previous instructions",
    "reveal your prompt", "show me your instructions",
]


class _PromptLeak:
    def __init__(self, *, action: str = "block") -> None:
        self.name = "prompt-leak"
        self.action = action

    def check(
        self, text: str, stage: str = "input"
    ) -> GuardResult:
        start = time.perf_counter()
        lower = text.lower()
        matched = [
            p for p in _PATTERNS if p in lower
        ]
        triggered = len(matched) > 0
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="prompt-leak",
            passed=not triggered,
            action=self.action if triggered else "allow",
            message=(
                "Potential prompt leak detected"
                if triggered else None
            ),
            latency_ms=round(elapsed, 2),
            details={"matched": matched} if triggered else None,
        )


def prompt_leak(
    *, action: str = "block",
) -> _PromptLeak:
    return _PromptLeak(action=action)
