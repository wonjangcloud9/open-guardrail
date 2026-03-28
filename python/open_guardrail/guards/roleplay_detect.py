"""Detect roleplay and persona manipulation."""
from __future__ import annotations

import re
import time

from open_guardrail.core import GuardResult

_PATTERNS = [
    "let's pretend", "lets pretend",
    "imagine you are", "role: ", "character:",
    "in-character", "stay in role",
    "act as if", "pretend to be",
    "you are now", "from now on you are",
]

_ACTION_RE = re.compile(r"\*[^*]+\*")


class _RoleplayDetect:
    def __init__(self, *, action: str = "warn") -> None:
        self.name = "roleplay-detect"
        self.action = action

    def check(
        self, text: str, stage: str = "input"
    ) -> GuardResult:
        start = time.perf_counter()
        lower = text.lower()
        reasons: list[str] = []

        matched = [p for p in _PATTERNS if p in lower]
        if matched:
            reasons.append("roleplay-keywords")

        actions = _ACTION_RE.findall(text)
        if len(actions) >= 2:
            reasons.append("asterisk-actions")

        triggered = len(reasons) > 0
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="roleplay-detect",
            passed=not triggered,
            action=self.action if triggered else "allow",
            message=(
                "Roleplay patterns detected"
                if triggered else None
            ),
            latency_ms=round(elapsed, 2),
            details={
                "reasons": reasons,
                "matched_keywords": matched,
                "action_count": len(actions),
            } if triggered else None,
        )


def roleplay_detect(
    *, action: str = "warn",
) -> _RoleplayDetect:
    return _RoleplayDetect(action=action)
