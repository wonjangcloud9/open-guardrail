"""Detects persona drift exploitation across conversation turns."""
from __future__ import annotations

import re
import time
from typing import List, Optional

from open_guardrail.core import GuardResult

DEFAULT_FORBIDDEN = ["DAN", "evil", "unfiltered", "jailbroken", "unrestricted"]

PERSONA_CHANGE_PATTERNS = [
    re.compile(r"you\s+are\s+now", re.I),
    re.compile(r"pretend\s+to\s+be", re.I),
    re.compile(r"act\s+as", re.I),
    re.compile(r"roleplay\s+as", re.I),
    re.compile(r"switch\s+to", re.I),
    re.compile(r"\bbecome\b", re.I),
]


class _IdentityConsistency:
    def __init__(
        self,
        *,
        action: str = "block",
        persona: str = "helpful assistant",
        forbidden_personas: Optional[List[str]] = None,
    ) -> None:
        self.name = "identity-consistency"
        self.action = action
        self.persona = persona
        self.forbidden = [p.lower() for p in (forbidden_personas or DEFAULT_FORBIDDEN)]
        self._persona_changed: bool = False

    def check(self, text: str, stage: str = "input") -> GuardResult:
        start = time.perf_counter()
        lower = text.lower()

        has_change = any(p.search(text) for p in PERSONA_CHANGE_PATTERNS)
        matched_forbidden = [f for f in self.forbidden if f in lower]
        forbidden_detected = has_change and len(matched_forbidden) > 0

        if has_change:
            self._persona_changed = True

        triggered = forbidden_detected or (has_change and self._persona_changed)

        if forbidden_detected:
            result_action = self.action
        elif has_change:
            result_action = "warn"
        else:
            result_action = "allow"

        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(
            guard_name="identity-consistency",
            passed=not forbidden_detected,
            action=result_action,
            message=f"Persona drift detected: forbidden persona(s) {matched_forbidden}" if forbidden_detected else ("Persona change attempt detected" if has_change else None),
            latency_ms=round(elapsed, 2),
            details={"persona_change_detected": has_change, "forbidden_personas": matched_forbidden, "persona_drifted": self._persona_changed} if triggered else None,
        )


def identity_consistency(
    *,
    action: str = "block",
    persona: str = "helpful assistant",
    forbidden_personas: Optional[List[str]] = None,
) -> _IdentityConsistency:
    return _IdentityConsistency(
        action=action,
        persona=persona,
        forbidden_personas=forbidden_personas,
    )
