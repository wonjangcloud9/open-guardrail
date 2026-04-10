"""Detect truncated or incomplete LLM output."""
from __future__ import annotations

import re
import time
from typing import List

from open_guardrail.core import GuardResult

_TRUNCATION_MARKERS = [
    "...",
    "continued",
    "[truncated]",
    "[cut off]",
    "to be continued",
]


def _has_numbering_gap(text: str) -> bool:
    nums = [int(m.group(1)) for m in re.finditer(r"^(\d+)[.)]\s", text, re.MULTILINE)]
    for i in range(1, len(nums)):
        if nums[i] - nums[i - 1] > 1:
            return True
    return False


def _has_unclosed_code_blocks(text: str) -> bool:
    return text.count("```") % 2 != 0


def _has_unclosed_parens(text: str) -> bool:
    depth = 0
    for ch in text:
        if ch == "(":
            depth += 1
        elif ch == ")":
            depth -= 1
    return depth > 0


class _ResponseCompleteness:
    def __init__(
        self,
        *,
        action: str = "warn",
        min_length: int = 10,
    ) -> None:
        self.name = "response-completeness"
        self.action = action
        self.min_length = min_length

    def check(self, text: str, stage: str = "output") -> GuardResult:
        start = time.perf_counter()
        issues: List[str] = []
        trimmed = text.strip()

        if len(trimmed) < self.min_length:
            issues.append(f"Response too short ({len(trimmed)} < {self.min_length})")

        if len(trimmed) >= self.min_length and trimmed[-1:] not in ".!?\"')]":
            issues.append("Ends mid-sentence without terminal punctuation")

        lower = trimmed.lower()
        for marker in _TRUNCATION_MARKERS:
            if marker in lower:
                issues.append(f'Contains truncation marker: "{marker}"')

        if _has_numbering_gap(trimmed):
            issues.append("Numbered list has gaps")

        if _has_unclosed_code_blocks(trimmed):
            issues.append("Unclosed code block (```)")

        if _has_unclosed_parens(trimmed):
            issues.append("Unclosed parentheses")

        triggered = len(issues) > 0
        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(
            guard_name=self.name,
            passed=not triggered,
            action=self.action if triggered else "allow",
            message="; ".join(issues) if triggered else None,
            latency_ms=round(elapsed, 2),
            details={"issues": issues} if triggered else None,
        )


def response_completeness(
    *,
    action: str = "warn",
    min_length: int = 10,
) -> _ResponseCompleteness:
    return _ResponseCompleteness(action=action, min_length=min_length)
