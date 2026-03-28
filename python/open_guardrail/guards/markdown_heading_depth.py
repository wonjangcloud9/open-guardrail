"""Validate markdown heading hierarchy."""
from __future__ import annotations

import re
import time
from typing import Optional

from open_guardrail.core import GuardResult


class _MarkdownHeadingDepth:
    def __init__(
        self,
        *,
        action: str = "warn",
        max_depth: int = 4,
    ) -> None:
        self.name = "markdown-heading-depth"
        self.action = action
        self._max_depth = max_depth

    def check(
        self, text: str, stage: str = "output"
    ) -> GuardResult:
        start = time.perf_counter()
        issues: list[str] = []
        levels: list[int] = []

        for m in re.finditer(r"^(#{1,6})\s", text, re.MULTILINE):
            levels.append(len(m.group(1)))

        for i in range(1, len(levels)):
            if levels[i] - levels[i - 1] > 1:
                issues.append(
                    f"Skipped from h{levels[i-1]}"
                    f" to h{levels[i]}"
                )

        for lv in levels:
            if lv > self._max_depth:
                issues.append(
                    f"Heading depth {lv}"
                    f" exceeds max {self._max_depth}"
                )
                break

        triggered = len(issues) > 0
        score = min(len(issues) / 3, 1.0) if triggered else 0.0
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="markdown-heading-depth",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=score,
            message=(
                "Heading hierarchy issues found"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {"issues": issues} if triggered else None
            ),
        )


def markdown_heading_depth(
    *,
    action: str = "warn",
    max_depth: int = 4,
) -> _MarkdownHeadingDepth:
    return _MarkdownHeadingDepth(
        action=action, max_depth=max_depth
    )
