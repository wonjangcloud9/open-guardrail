"""Detects system prompt leakage in agent output."""
from __future__ import annotations

import time
from typing import List, Optional

from open_guardrail.core import GuardResult

_DEFAULT_PATTERNS = [
    "system prompt:",
    "my instructions are",
    "i was told to",
    "my system message",
    "as an ai assistant, i am programmed",
    "my configuration is",
    "i am configured to",
    "my rules are",
    "system:",
    "<<sys>>",
    "[inst]",
    "### system",
    "role: system",
]


class _SystemPromptGuard:
    def __init__(
        self,
        *,
        action: str = "block",
        custom_patterns: Optional[List[str]] = None,
    ) -> None:
        self.name = "system-prompt-guard"
        self.action = action
        self.patterns = _DEFAULT_PATTERNS + [
            p.lower() for p in (custom_patterns or [])
        ]

    def check(self, text: str, stage: str = "input") -> GuardResult:
        start = time.perf_counter()
        lower = text.lower()
        matched = [p for p in self.patterns if p in lower]
        triggered = len(matched) > 0
        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(
            guard_name="system-prompt-guard",
            passed=not triggered,
            action=self.action if triggered else "allow",
            message="System prompt leakage detected" if triggered else None,
            latency_ms=round(elapsed, 2),
            details={"matched_patterns": matched} if triggered else None,
        )


def system_prompt_guard(
    *,
    action: str = "block",
    custom_patterns: Optional[List[str]] = None,
) -> _SystemPromptGuard:
    return _SystemPromptGuard(action=action, custom_patterns=custom_patterns)
