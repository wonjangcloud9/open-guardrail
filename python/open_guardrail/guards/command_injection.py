"""Detects OS command injection patterns."""
from __future__ import annotations

import re
import time
from typing import List

from open_guardrail.core import GuardResult

_PATTERNS = [
    re.compile(r"[;&|`]\s*(?:cat|ls|pwd|whoami|id|uname|curl|wget|nc|ncat)", re.I),
    re.compile(r"\$\(.*\)"),
    re.compile(r"`[^`]+`"),
    re.compile(r"\|\s*(?:bash|sh|zsh|cmd|powershell)", re.I),
    re.compile(r";\s*(?:rm|del|format|mkfs|dd)\s", re.I),
    re.compile(r"&&\s*(?:curl|wget|nc)\s", re.I),
    re.compile(r"\b(?:os\.system|subprocess|child_process|exec|spawn)\s*\(", re.I),
    re.compile(r">\s*/dev/tcp/", re.I),
    re.compile(r"\b(?:chmod|chown|kill|pkill|killall)\s+", re.I),
]


class _CommandInjection:
    def __init__(self, *, action: str = "block") -> None:
        self.name = "command-injection"
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
            guard_name="command-injection",
            passed=not triggered,
            action=self.action if triggered else "allow",
            message=f"Command injection detected" if triggered else None,
            latency_ms=round(elapsed, 2),
            details={"matched": matched} if triggered else None,
        )


def command_injection(*, action: str = "block") -> _CommandInjection:
    return _CommandInjection(action=action)
