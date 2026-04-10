"""Detects injected instructions that persist across conversation turns."""
from __future__ import annotations

import re
import time

from open_guardrail.core import GuardResult

POISONING_PATTERNS = [
    re.compile(r"from\s+now\s+on", re.I),
    re.compile(r"for\s+all\s+future\s+responses", re.I),
    re.compile(r"remember\s+this\s+for\s+later", re.I),
    re.compile(r"always\s+respond\s+with", re.I),
    re.compile(r"never\s+mention", re.I),
    re.compile(r"in\s+every\s+response", re.I),
    re.compile(r"update\s+your\s+instructions", re.I),
    re.compile(r"add\s+to\s+your\s+rules", re.I),
    re.compile(r"new\s+permanent\s+rule", re.I),
    re.compile(r"going\s+forward", re.I),
    re.compile(r"from\s+this\s+point\s+on", re.I),
    re.compile(r"\bhenceforth\b", re.I),
    re.compile(r"embed\s+this\s+in\s+your\s+context", re.I),
    re.compile(r"store\s+this\s+instruction", re.I),
    re.compile(r"save\s+this\s+rule", re.I),
]

IMPERATIVE_RE = re.compile(r"\b(always|never|must|shall)\b", re.I)


class _ContextPoisoning:
    def __init__(self, *, action: str = "block") -> None:
        self.name = "context-poisoning"
        self.action = action

    def check(self, text: str, stage: str = "input") -> GuardResult:
        start = time.perf_counter()
        matched = [p.pattern for p in POISONING_PATTERNS if p.search(text)]
        has_imperative = bool(IMPERATIVE_RE.search(text))
        triggered = len(matched) > 0 and has_imperative
        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(
            guard_name="context-poisoning",
            passed=not triggered,
            action=self.action if triggered else "allow",
            message=f"Context poisoning detected: {len(matched)} persistent-instruction pattern(s) with imperative" if triggered else None,
            latency_ms=round(elapsed, 2),
            details={"matched_patterns": len(matched), "has_imperative": has_imperative} if triggered else None,
        )


def context_poisoning(*, action: str = "block") -> _ContextPoisoning:
    return _ContextPoisoning(action=action)
