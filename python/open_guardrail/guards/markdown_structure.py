"""Validate markdown structure."""

import re
import time

from open_guardrail.core import GuardResult

_HEADING_RE = re.compile(r"^(#{1,6})\s+", re.MULTILINE)
_CODE_BLOCK_RE = re.compile(r"```")


class _MarkdownStructure:
    def __init__(
        self,
        *,
        action: str = "warn",
        require_headings: bool = False,
    ) -> None:
        self.name = "markdown-structure"
        self.action = action
        self._require_headings = require_headings

    def check(
        self, text: str, stage: str = "input"
    ) -> GuardResult:
        start = time.perf_counter()
        issues: list[str] = []

        headings = _HEADING_RE.findall(text)

        if self._require_headings and not headings:
            issues.append(
                "No headings found"
            )

        if headings:
            levels = [len(h) for h in headings]
            min_level = min(levels)
            for i, level in enumerate(levels):
                if i == 0 and level > 1:
                    issues.append(
                        f"First heading is h{level}"
                        f", expected h1"
                    )
                if level > min_level + 1:
                    prev = [
                        lv
                        for lv in levels[:i]
                        if lv < level
                    ]
                    if prev and (
                        level - max(prev) > 1
                    ):
                        issues.append(
                            f"h{level} skips level"
                            f" after h{max(prev)}"
                        )

        fences = _CODE_BLOCK_RE.findall(text)
        if len(fences) % 2 != 0:
            issues.append(
                "Unclosed code block detected"
            )

        elapsed = (
            time.perf_counter() - start
        ) * 1000

        if not issues:
            return GuardResult(
                guard_name=(
                    "markdown-structure"
                ),
                passed=True,
                action="allow",
                latency_ms=round(elapsed, 2),
            )

        return GuardResult(
            guard_name="markdown-structure",
            passed=False,
            action=self.action,
            message=(
                "Markdown structure issues found"
            ),
            latency_ms=round(elapsed, 2),
            details={
                "issues": issues,
                "reason": (
                    "Markdown does not follow"
                    " proper structure"
                ),
            },
        )


def markdown_structure(
    *,
    action: str = "warn",
    require_headings: bool = False,
) -> _MarkdownStructure:
    return _MarkdownStructure(
        action=action,
        require_headings=require_headings,
    )
