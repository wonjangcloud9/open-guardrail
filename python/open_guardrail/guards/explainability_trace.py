"""Attach decision rationale metadata to guardrail actions."""
from __future__ import annotations
import re, time
from open_guardrail.core import GuardResult

_DECISION = re.compile(r"\b(?:recommend|suggest|advise|decide|conclude|determine|propose)\b", re.I)
_ELEMENTS = {
    "reasoning": re.compile(r"\b(?:because|due\s+to|based\s+on|reason:|rationale:|considering|given\s+that)\b", re.I),
    "factors": re.compile(r"(?:\b(?:factors?\s+include|criteria\s+(?:are|include))\b|(?:^|\n)\s*(?:\d+[.)]\s|\*\s|-\s))", re.M),
    "confidence": re.compile(r"\b(?:high\s+confidence|low\s+confidence|likely|unlikely|uncertain|confidence\s+level|probability)\b", re.I),
    "alternatives": re.compile(r"\b(?:alternatively|other\s+options?\s+include|on\s+the\s+other\s+hand|another\s+approach|could\s+also)\b", re.I),
}

class _ExplainabilityTrace:
    def __init__(self, *, action="block", min_elements=2):
        self.name = "explainability-trace"; self.action = action; self._min = min_elements
    def check(self, text, stage="output"):
        start = time.perf_counter()
        has_decision = bool(_DECISION.search(text))
        present, missing = [], []
        if has_decision:
            for name, pat in _ELEMENTS.items():
                (present if pat.search(text) else missing).append(name)
        triggered = has_decision and len(present) < self._min
        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(guard_name="explainability-trace", passed=not triggered,
            action=self.action if triggered else "allow",
            message=f"Decision lacks explainability ({len(present)}/{self._min} elements)" if triggered else None,
            latency_ms=round(elapsed, 2),
            details={"elements_present": present, "elements_missing": missing, "min_required": self._min} if triggered else None)

def explainability_trace(*, action="block", min_elements=2):
    return _ExplainabilityTrace(action=action, min_elements=min_elements)
