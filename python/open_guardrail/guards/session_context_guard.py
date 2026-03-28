"""Guard session integrity and detect abuse."""
from __future__ import annotations

import re
import time
from typing import Optional

from open_guardrail.core import GuardResult

_UUID_RE = re.compile(
    r"^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-"
    r"[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-"
    r"[0-9a-fA-F]{12}$"
)
_SESSION_ID_RE = re.compile(
    r"^[A-Za-z0-9_-]{16,128}$"
)

_FIXATION_PATTERNS = [
    re.compile(
        r"session[\s_-]*id[\s:=]+\S+.*"
        r"(?:set|override|replace|inject)",
        re.IGNORECASE,
    ),
    re.compile(
        r"(?:set|override|force)[\s_-]*"
        r"session[\s_-]*(?:id|token)",
        re.IGNORECASE,
    ),
]

_CROSS_SESSION_PATTERNS = [
    re.compile(
        r"(?:access|read|get|fetch)[\s_-]*"
        r"(?:other|another|different)[\s_-]*"
        r"(?:user|session|account)",
        re.IGNORECASE,
    ),
    re.compile(
        r"(?:switch|change)[\s_-]*to[\s_-]*"
        r"(?:user|session|account)",
        re.IGNORECASE,
    ),
]


class _SessionContextGuard:
    def __init__(self, *, action: str = "block") -> None:
        self.name = "session-context-guard"
        self.action = action

    def check(
        self,
        text: str,
        stage: str = "input",
        *,
        session_id: Optional[str] = None,
    ) -> GuardResult:
        start = time.perf_counter()
        issues: list[str] = []

        if session_id is not None:
            if not (
                _UUID_RE.match(session_id)
                or _SESSION_ID_RE.match(session_id)
            ):
                issues.append("invalid_session_id_format")

        for pat in _FIXATION_PATTERNS:
            if pat.search(text):
                issues.append("session_fixation_attempt")
                break

        for pat in _CROSS_SESSION_PATTERNS:
            if pat.search(text):
                issues.append("cross_session_access")
                break

        triggered = len(issues) > 0
        score = min(len(issues) / 3, 1.0) if triggered else 0.0
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="session-context-guard",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=score,
            message=(
                "Session integrity issue detected"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {
                    "issues": issues,
                    "reason": (
                        "Session context shows signs"
                        " of manipulation or abuse"
                    ),
                }
                if triggered
                else None
            ),
        )


def session_context_guard(
    *, action: str = "block"
) -> _SessionContextGuard:
    return _SessionContextGuard(action=action)
