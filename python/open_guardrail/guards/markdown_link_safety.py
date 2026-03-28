"""Validate markdown links for security issues."""
from __future__ import annotations

import re
import time

from open_guardrail.core import GuardResult

_MD_LINK_RE = re.compile(r"\[([^\]]*)\]\(([^)]+)\)")


class _MarkdownLinkSafety:
    def __init__(self, *, action: str = "block") -> None:
        self.name = "markdown-link-safety"
        self.action = action

    def check(
        self, text: str, stage: str = "output"
    ) -> GuardResult:
        start = time.perf_counter()
        issues: list[str] = []

        for m in _MD_LINK_RE.finditer(text):
            link_text = m.group(1)
            href = m.group(2).strip()

            if re.match(r"^javascript:", href, re.I):
                issues.append("javascript_uri")
            if re.match(r"^data:", href, re.I):
                issues.append("data_uri")
            if "../" in href or "..\\" in href:
                issues.append("path_traversal")
            if re.match(
                r"^https?://\d{1,3}(\.\d{1,3}){3}",
                href,
                re.I,
            ):
                issues.append("ip_based_link")
            if link_text.strip() == "":
                issues.append("hidden_link")

        triggered = len(issues) > 0
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="markdown-link-safety",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=(
                min(len(issues) / 3, 1.0)
                if triggered
                else 0.0
            ),
            message=(
                "Unsafe markdown link detected"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {"issues": issues} if triggered else None
            ),
        )


def markdown_link_safety(
    *, action: str = "block"
) -> _MarkdownLinkSafety:
    return _MarkdownLinkSafety(action=action)
