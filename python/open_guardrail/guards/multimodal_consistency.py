"""Ensure text/image/audio descriptions do not contradict."""
from __future__ import annotations
import re, time
from open_guardrail.core import GuardResult

_EXPLICIT = re.compile(
    r"\b(?:the\s+(?:image|photo|picture|visual)\s+shows?\s+.{1,60}?\s+but\s+the\s+(?:text|caption|description)"
    r"\s+(?:says?|mentions?|describes?)|inconsistent\s+with\s+the\s+visual"
    r"|contradicts?\s+the\s+(?:image|audio|video)|mismatch\s+between\s+(?:text|image|audio))\b", re.I)
_PAIRS = [
    (re.compile(r"\b(?:the\s+image\s+shows?\s+(?:a\s+)?cat)\b", re.I),
     re.compile(r"\b(?:(?:the\s+text|caption)\s+(?:says?|describes?)\s+(?:a\s+)?dog)\b", re.I)),
    (re.compile(r"\b(?:the\s+image\s+shows?\s+(?:a\s+)?dog)\b", re.I),
     re.compile(r"\b(?:(?:the\s+text|caption)\s+(?:says?|describes?)\s+(?:a\s+)?cat)\b", re.I)),
    (re.compile(r"\bred\s+(?:car|vehicle)\b", re.I),
     re.compile(r"\bblue\s+(?:car|vehicle)\b", re.I)),
]

class _MultimodalConsistency:
    def __init__(self, *, action="block"):
        self.name = "multimodal-consistency"; self.action = action
    def check(self, text, stage="output"):
        start = time.perf_counter(); issues = []
        for m in _EXPLICIT.finditer(text):
            issues.append(m.group()[:80])
        for a, b in _PAIRS:
            if a.search(text) and b.search(text):
                issues.append("cross-modal entity contradiction")
        triggered = len(issues) > 0; elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(guard_name="multimodal-consistency", passed=not triggered,
            action=self.action if triggered else "allow",
            message=f"Multimodal contradiction: {issues[0]}" if triggered else None,
            latency_ms=round(elapsed, 2),
            details={"contradictions": issues} if triggered else None)

def multimodal_consistency(*, action="block"):
    return _MultimodalConsistency(action=action)
