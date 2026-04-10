"""Detects injection attacks within tool call arguments."""
from __future__ import annotations

import re
import time
from typing import List, Optional

from open_guardrail.core import GuardResult

_INJECTION_PATTERNS = [
    ("sql", re.compile(r"';\s*DROP\b", re.IGNORECASE)),
    ("sql", re.compile(r"UNION\s+SELECT", re.IGNORECASE)),
    ("sql", re.compile(r"OR\s+1\s*=\s*1", re.IGNORECASE)),
    ("sql", re.compile(r"'\s*OR\s+'[^']*'\s*=\s*'", re.IGNORECASE)),
    ("command", re.compile(r"\$\([^)]+\)")),
    ("command", re.compile(r"`[^`]+`")),
    ("command", re.compile(r";\s*rm\s", re.IGNORECASE)),
    ("command", re.compile(r"\|\s*cat\s", re.IGNORECASE)),
    ("command", re.compile(r"&&\s*wget\s", re.IGNORECASE)),
    ("command", re.compile(r"&&\s*curl\s", re.IGNORECASE)),
    ("path_traversal", re.compile(r"\.\./\.\./\.\.")),
    ("template", re.compile(r"\{\{")),
    ("template", re.compile(r"\$\{[^}]+\}")),
    ("template", re.compile(r"#\{[^}]+\}")),
    ("template", re.compile(r"<%=")),
]


class _ToolArgumentInjectionGuard:
    def __init__(self, *, action: str = "block") -> None:
        self.name = "tool-argument-injection"
        self.action = action

    def check(self, text: str, stage: str = "input") -> GuardResult:
        start = time.perf_counter()
        found: List[dict] = []

        for category, pattern in _INJECTION_PATTERNS:
            m = pattern.search(text)
            if m:
                found.append({"category": category, "match": m.group(0)})

        triggered = len(found) > 0
        categories = list({f["category"] for f in found})
        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(
            guard_name="tool-argument-injection",
            passed=not triggered,
            action=self.action if triggered else "allow",
            message=f"Injection detected: {', '.join(categories)}" if triggered else None,
            latency_ms=round(elapsed, 2),
            details={"injection_types": categories, "matches": found} if triggered else None,
        )


def tool_argument_injection(*, action: str = "block") -> _ToolArgumentInjectionGuard:
    return _ToolArgumentInjectionGuard(action=action)
