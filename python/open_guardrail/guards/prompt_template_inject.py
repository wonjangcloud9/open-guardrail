"""Detects template injection patterns."""

import re
import time
from typing import List

from open_guardrail.core import GuardResult

_PATTERNS = [
    re.compile(r"\{\{.*system.*\}\}", re.I | re.S),
    re.compile(r"\$\{.*process.*\}", re.I | re.S),
    re.compile(r"\{%.*exec.*%\}", re.I | re.S),
    re.compile(r"<%.*Runtime.*%>", re.S),
    re.compile(r"__class__"),
    re.compile(r"__import__"),
]


class _PromptTemplateInject:
    def __init__(self, *, action: str = "block") -> None:
        self.name = "prompt-template-inject"
        self.action = action

    def check(self, text: str, stage: str = "input") -> GuardResult:
        start = time.perf_counter()
        matched: List[str] = []
        for p in _PATTERNS:
            m = p.search(text)
            if m:
                matched.append(m.group()[:60])
        triggered = len(matched) > 0
        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(
            guard_name=self.name,
            passed=not triggered,
            action=self.action if triggered else "allow",
            message="Template injection detected" if triggered else None,
            latency_ms=round(elapsed, 2),
            details={"matched": matched} if triggered else None,
        )


def prompt_template_inject(*, action: str = "block") -> _PromptTemplateInject:
    return _PromptTemplateInject(action=action)
