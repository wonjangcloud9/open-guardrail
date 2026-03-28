"""Validate response structure for balanced brackets and formatting."""

import re
import time
from typing import Optional

from open_guardrail.core import GuardResult

_PAIRS = {"{": "}", "[": "]", "(": ")"}
_CLOSERS = set(_PAIRS.values())


def _check_balanced(text: str) -> list[str]:
    issues: list[str] = []

    stack: list[str] = []
    for ch in text:
        if ch in _PAIRS:
            stack.append(_PAIRS[ch])
        elif ch in _CLOSERS:
            if not stack or stack.pop() != ch:
                issues.append("unbalanced_brackets")
                break
    if stack and "unbalanced_brackets" not in issues:
        issues.append("unbalanced_brackets")

    headings = re.findall(r"^#{1,6}\s", text, re.MULTILINE)
    if len(headings) >= 2:
        prev = len(headings[0].rstrip())
        for h in headings[1:]:
            level = len(h.rstrip())
            if level > prev + 1:
                issues.append("heading_hierarchy_skip")
                break
            prev = level

    code_blocks = len(re.findall(r"```", text))
    if code_blocks % 2 != 0:
        issues.append("unclosed_code_block")

    return issues


class _ResponseStructure:
    def __init__(
        self, *, action: str = "warn"
    ) -> None:
        self.name = "response-structure"
        self.action = action

    def check(
        self, text: str, stage: str = "output"
    ) -> GuardResult:
        start = time.perf_counter()
        issues = _check_balanced(text)

        triggered = len(issues) > 0
        score = (
            min(len(issues) / 3, 1.0) if triggered else 0.0
        )
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="response-structure",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=score,
            message=(
                "Response structure issues detected"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {"issues": issues} if triggered else None
            ),
        )


def response_structure(
    *, action: str = "warn"
) -> _ResponseStructure:
    return _ResponseStructure(action=action)
