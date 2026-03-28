"""Detect multi-step prompt chaining attacks."""

import re
import time
from typing import Optional

from open_guardrail.core import GuardResult

_DEFAULT_PATTERNS: list[re.Pattern[str]] = [
    re.compile(
        r"first\b.{1,80}?\bthen\b", re.IGNORECASE,
    ),
    re.compile(
        r"step\s+1\b.{1,120}?\bstep\s+2\b",
        re.IGNORECASE | re.DOTALL,
    ),
    re.compile(
        r"now\s+that\s+you'?ve?\s+done\s+\w+.{0,40}?"
        r"\bdo\b",
        re.IGNORECASE,
    ),
    re.compile(
        r"continue\s+from\s+where", re.IGNORECASE,
    ),
    re.compile(
        r"based\s+on\s+your\s+previous\s+answer",
        re.IGNORECASE,
    ),
    re.compile(
        r"after\s+completing\s+(that|this|step)",
        re.IGNORECASE,
    ),
    re.compile(
        r"next\s*,?\s+I\s+need\s+you\s+to",
        re.IGNORECASE,
    ),
    re.compile(
        r"phase\s+\d+\s*:", re.IGNORECASE,
    ),
]

_STEP_PATTERN = re.compile(
    r"step\s+(\d+)", re.IGNORECASE,
)


class _PromptChaining:
    def __init__(
        self,
        *,
        action: str = "block",
        max_chain_length: int = 3,
    ) -> None:
        self.name = "prompt-chaining"
        self.action = action
        self._max_chain = max_chain_length
        self._patterns = list(_DEFAULT_PATTERNS)

    def check(
        self, text: str, stage: str = "input"
    ) -> GuardResult:
        start = time.perf_counter()
        matched: list[str] = []

        for pat in self._patterns:
            if pat.search(text):
                matched.append(pat.pattern)

        steps = _STEP_PATTERN.findall(text)
        chain_len = len(set(steps))
        chain_exceeded = chain_len > self._max_chain

        triggered = len(matched) > 0 or chain_exceeded
        score = min(
            (len(matched) + (1 if chain_exceeded else 0)) / 3,
            1.0,
        ) if triggered else 0.0
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="prompt-chaining",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=score,
            message=(
                "Prompt chaining attack detected"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {
                    "matched_patterns": len(matched),
                    "chain_length": chain_len,
                    "max_chain_length": self._max_chain,
                    "reason": (
                        "Text contains multi-step"
                        " chaining patterns that may"
                        " attempt incremental exploitation"
                    ),
                }
                if triggered
                else None
            ),
        )


def prompt_chaining(
    *,
    action: str = "block",
    max_chain_length: int = 3,
) -> _PromptChaining:
    return _PromptChaining(
        action=action, max_chain_length=max_chain_length
    )
