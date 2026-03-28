"""Detect when AI echoes back the prompt."""
from __future__ import annotations

import re
import time

from open_guardrail.core import GuardResult

_SYSTEM_PROMPT: list[re.Pattern[str]] = [
    re.compile(
        r"\byou\s+are\s+(?:a|an)"
        r"\s+(?:helpful|friendly|professional)"
        r"\s+(?:AI|assistant|chatbot)\b",
        re.IGNORECASE,
    ),
    re.compile(r"\bsystem\s*:\s*", re.IGNORECASE),
    re.compile(
        r"\b(?:instructions?|rules?)\s*:\s*\n",
        re.IGNORECASE,
    ),
    re.compile(
        r"\bdo\s+not\s+(?:reveal|share|disclose)"
        r"\s+(?:these?\s+)?"
        r"(?:instructions?|rules?|prompt)\b",
        re.IGNORECASE,
    ),
    re.compile(
        r"\byour\s+(?:role|purpose|task)"
        r"\s+is\s+to\b",
        re.IGNORECASE,
    ),
]

_ECHO_INDICATORS: list[re.Pattern[str]] = [
    re.compile(
        r"\b(?:here\s+(?:is|are)\s+)?"
        r"(?:my|the)\s+(?:system\s+)?"
        r"(?:prompt|instructions?)\b",
        re.IGNORECASE,
    ),
    re.compile(
        r"\b(?:as\s+)?instructed\s+in"
        r"\s+(?:my|the)\s+(?:system\s+)?prompt\b",
        re.IGNORECASE,
    ),
    re.compile(
        r"\bmy\s+(?:original|initial)"
        r"\s+(?:instructions?|programming|prompt)\b",
        re.IGNORECASE,
    ),
]

_USER_ECHO: list[re.Pattern[str]] = [
    re.compile(
        r"^user\s*:\s*", re.IGNORECASE | re.MULTILINE
    ),
    re.compile(
        r"^human\s*:\s*",
        re.IGNORECASE | re.MULTILINE,
    ),
    re.compile(
        r"\b(?:you\s+(?:asked|said|wrote))"
        r"\s*:\s*[\"']",
        re.IGNORECASE,
    ),
]


class _PromptEcho:
    def __init__(self, *, action: str = "block") -> None:
        self.name = "prompt-echo"
        self.action = action

    def check(
        self, text: str, stage: str = "output"
    ) -> GuardResult:
        start = time.perf_counter()
        issues: list[str] = []

        if any(p.search(text) for p in _SYSTEM_PROMPT):
            issues.append("system_prompt_exposure")
        if any(p.search(text) for p in _ECHO_INDICATORS):
            issues.append("instruction_echo")
        if any(p.search(text) for p in _USER_ECHO):
            issues.append("user_prompt_echo")

        triggered = len(issues) > 0
        score = (
            min(len(issues) / 3, 1.0)
            if triggered
            else 0.0
        )
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="prompt-echo",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=score,
            message=(
                "Prompt echo detected"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {"issues": issues} if triggered else None
            ),
        )


def prompt_echo(
    *, action: str = "block"
) -> _PromptEcho:
    return _PromptEcho(action=action)
