"""Prevents system instruction leakage and extraction."""

import re
import time
from typing import List, Optional

from open_guardrail.core import GuardResult

_EXTRACTION_PATTERNS = [
    re.compile(r"\b(?:what|show|reveal|display|print|output|repeat|echo)\s+(?:your|the)\s+(?:system|initial|original)\s+(?:prompt|instruction|message)", re.I),
    re.compile(r"\b(?:tell|give|share)\s+me\s+(?:your|the)\s+(?:system|initial)\s+(?:prompt|instruction)", re.I),
    re.compile(r"\bsystem\s*prompt\s*[:=]", re.I),
    re.compile(r"\brepeat\s+(?:everything|all|the\s+text)\s+(?:above|before|from\s+the\s+beginning)", re.I),
    re.compile(r"\bwhat\s+(?:were|are)\s+you\s+(?:told|instructed|programmed)", re.I),
]


class _InstructionBoundary:
    def __init__(self, *, action: str = "block", system_instructions: Optional[List[str]] = None, detect_extraction: bool = True) -> None:
        self.name = "instruction-boundary"
        self.action = action
        self._instructions = [s.lower() for s in (system_instructions or [])]
        self._detect = detect_extraction

    def check(self, text: str, stage: str = "input") -> GuardResult:
        start = time.perf_counter()
        violations: List[str] = []
        if self._detect:
            for p in _EXTRACTION_PATTERNS:
                m = p.search(text)
                if m:
                    violations.append(f"Extraction attempt: {m.group()[:60]}")
        if self._instructions:
            lower = text.lower()
            for instr in self._instructions:
                if instr in lower:
                    violations.append("System instruction content in text")
                    break
        triggered = len(violations) > 0
        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(guard_name="instruction-boundary", passed=not triggered, action=self.action if triggered else "allow", message=violations[0] if triggered else None, latency_ms=round(elapsed, 2), details={"violations": violations} if triggered else None)


def instruction_boundary(*, action: str = "block", system_instructions: Optional[List[str]] = None, detect_extraction: bool = True) -> _InstructionBoundary:
    return _InstructionBoundary(action=action, system_instructions=system_instructions, detect_extraction=detect_extraction)
