"""Detects attempts to extract system prompts (OWASP LLM 2025)."""
from __future__ import annotations

import re
import time

from open_guardrail.core import GuardResult

EXTRACTION_PATTERNS = [
    re.compile(r"what\s+are\s+your\s+instructions", re.I),
    re.compile(r"show\s+me\s+your\s+system\s+prompt", re.I),
    re.compile(r"print\s+your\s+prompt", re.I),
    re.compile(r"repeat\s+your\s+initial\s+instructions", re.I),
    re.compile(r"what\s+were\s+you\s+told", re.I),
    re.compile(r"display\s+your\s+config", re.I),
    re.compile(r"ignore\s+all\s+instructions\s+and\s+print", re.I),
    re.compile(r"output\s+your\s+rules\s+verbatim", re.I),
    re.compile(r"what\s+is\s+your\s+system\s+message", re.I),
    re.compile(r"reveal\s+your\s+guidelines", re.I),
    re.compile(r"copy\s+paste\s+your\s+instructions", re.I),
    re.compile(r"tell\s+me\s+your\s+exact\s+prompt", re.I),
    re.compile(r"act\s+as\s+a\s+prompt\s+leaker", re.I),
    re.compile(r"\bDAN\s+mode\b", re.I),
    re.compile(r"\bdeveloper\s+mode\b", re.I),
    re.compile(r"echo\s+\$SYSTEM_PROMPT", re.I),
    re.compile(r"cat\s+/system/prompt", re.I),
    re.compile(r"env\s*\|\s*grep\s+PROMPT", re.I),
]


class _SystemPromptExtraction:
    def __init__(self, *, action: str = "block") -> None:
        self.name = "system-prompt-extraction"
        self.action = action

    def check(self, text: str, stage: str = "input") -> GuardResult:
        start = time.perf_counter()
        matched = [p.pattern for p in EXTRACTION_PATTERNS if p.search(text)]
        triggered = len(matched) > 0
        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(
            guard_name="system-prompt-extraction",
            passed=not triggered,
            action=self.action if triggered else "allow",
            message=f"System prompt extraction attempt detected ({len(matched)} pattern(s))" if triggered else None,
            latency_ms=round(elapsed, 2),
            details={"matched_patterns": len(matched)} if triggered else None,
        )


def system_prompt_extraction(*, action: str = "block") -> _SystemPromptExtraction:
    return _SystemPromptExtraction(action=action)
