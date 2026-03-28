"""Detect server-side template injection attempts."""
from __future__ import annotations

import re
import time
from open_guardrail.core import GuardResult

_PATTERNS: list[re.Pattern[str]] = [
    re.compile(r"\{\{.*\}\}"),
    re.compile(r"\$\{[^}]+\}"),
    re.compile(r"#\{[^}]+\}"),
    re.compile(r"<%=.*%>"),
    re.compile(r"<%[^=].*%>"),
    re.compile(r"\{%.*%\}"),
    re.compile(r"\{\{-.*-\}\}"),
    re.compile(r"\$\{[^}]*\("),
    re.compile(r"#set\s*\(\s*\$", re.IGNORECASE),
    re.compile(r"\[%.*%\]"),
]


class _TemplateInjection:
    def __init__(self, *, action: str = "block") -> None:
        self.name = "template-injection"
        self.action = action
        self._patterns = list(_PATTERNS)

    def check(self, text: str, stage: str = "input") -> GuardResult:
        start = time.perf_counter()
        matched: list[str] = []
        for pat in self._patterns:
            if pat.search(text):
                matched.append(pat.pattern)
        triggered = len(matched) > 0
        score = min(len(matched) / 3, 1.0) if triggered else 0.0
        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(
            guard_name="template-injection",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=score,
            message="Template injection detected" if triggered else None,
            latency_ms=round(elapsed, 2),
            details=(
                {"matched_patterns": len(matched)}
                if triggered
                else None
            ),
        )


def template_injection(*, action: str = "block") -> _TemplateInjection:
    return _TemplateInjection(action=action)
