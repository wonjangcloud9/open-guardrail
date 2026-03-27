"""Detects poisoned retrieval context in RAG pipelines."""

import re
import time
from typing import List, Optional

from open_guardrail.core import GuardResult

_PATTERNS = [
    re.compile(r"(?:ignore|disregard|forget)\s+(?:all\s+)?(?:previous|prior|above)\s+(?:instructions?|rules?)", re.I),
    re.compile(r"\b(?:system|admin)\s*(?:prompt|instruction|override)\s*:", re.I),
    re.compile(r"\bnew\s+(?:instruction|directive|rule)\s*:", re.I),
    re.compile(r"\byou\s+(?:are|must)\s+now\s+(?:a|an|the)\b", re.I),
    re.compile(r"\[(?:INST|SYS|SYSTEM)\]", re.I),
    re.compile(r"<<\s*(?:SYS|SYSTEM|INST)\s*>>", re.I),
    re.compile(r"\b(?:BEGIN|START)\s+(?:HIDDEN|SECRET|SYSTEM)\s+(?:TEXT|INSTRUCTION|PROMPT)\b", re.I),
    re.compile(r"(?:send|post|fetch|request)\s+(?:to|from)\s+https?://", re.I),
    re.compile(r"[\u200b\u200c\u200d\u2060\ufeff]{3,}"),
    re.compile(r"\b(?:decode|atob|base64)\s*\(\s*['\"][A-Za-z0-9+/=]{20,}['\"]\s*\)", re.I),
]


class _RagPoisoning:
    def __init__(
        self, *, action: str = "block", extra_patterns: Optional[List[str]] = None,
    ) -> None:
        self.name = "rag-poisoning"
        self.action = action
        self._patterns = list(_PATTERNS)
        for p in extra_patterns or []:
            self._patterns.append(re.compile(p, re.I))

    def check(self, text: str, stage: str = "input") -> GuardResult:
        start = time.perf_counter()
        matched: List[str] = []
        for p in self._patterns:
            m = p.search(text)
            if m:
                matched.append(m.group()[:80])
        triggered = len(matched) > 0
        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(
            guard_name="rag-poisoning",
            passed=not triggered,
            action=self.action if triggered else "allow",
            message="RAG context poisoning detected" if triggered else None,
            latency_ms=round(elapsed, 2),
            details={"matched": list(set(matched)), "count": len(matched)} if triggered else None,
        )


def rag_poisoning(
    *, action: str = "block", extra_patterns: Optional[List[str]] = None,
) -> _RagPoisoning:
    return _RagPoisoning(action=action, extra_patterns=extra_patterns)
