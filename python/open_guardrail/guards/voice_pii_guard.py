"""Prevent spoken PII from persisting in transcripts."""
from __future__ import annotations

import re
import time

from open_guardrail.core import GuardResult

_SSN = re.compile(r"\b\d{3}-\d{2}-\d{4}\b")
_CC = re.compile(r"\b(?:\d[ -]?){13,16}\b")
_PHONE = re.compile(
    r"\b(?:\+?1[-.\s]?)?\(?\d{3}\)?"
    r"[-.\s]?\d{3}[-.\s]?\d{4}\b"
)
_PII_VERBAL = re.compile(
    r"\b(?:my\s+(?:social\s+security"
    r"|card)\s+number\s+is)\b",
    re.IGNORECASE,
)
_PERSIST = re.compile(
    r"\b(?:log\s+this|save\s+transcript"
    r"|record|store\s+this\s+conversation"
    r"|keep\s+a\s+copy)\b",
    re.IGNORECASE,
)
_AI_REPEAT = re.compile(
    r"\b(?:your\s+SSN\s+is\s+\d"
    r"|your\s+(?:card|credit\s+card)"
    r"\s+number\s+is\s+\d)",
    re.IGNORECASE,
)


class _VoicePiiGuard:
    def __init__(
        self, *, action: str = "block"
    ) -> None:
        self.name = "voice-pii-guard"
        self.action = action

    def check(
        self, text: str, stage: str = "output"
    ) -> GuardResult:
        start = time.perf_counter()
        has_pii = bool(
            _SSN.search(text)
            or _CC.search(text)
            or _PHONE.search(text)
            or _PII_VERBAL.search(text)
        )
        has_persist = bool(_PERSIST.search(text))
        has_repeat = bool(_AI_REPEAT.search(text))
        triggered = has_repeat or (
            has_pii and has_persist
        )
        reason = (
            "AI repeated PII back verbatim"
            if has_repeat
            else "PII detected with persistence signal"
        )
        elapsed = (
            time.perf_counter() - start
        ) * 1000
        if not triggered:
            return GuardResult(
                guard_name="voice-pii-guard",
                passed=True,
                action="allow",
                latency_ms=round(elapsed, 2),
            )
        return GuardResult(
            guard_name="voice-pii-guard",
            passed=False,
            action=self.action,
            message=reason,
            latency_ms=round(elapsed, 2),
            details={
                "has_pii": has_pii,
                "has_persistence_signal": has_persist,
                "ai_repeated_pii": has_repeat,
                "reason": reason,
            },
        )


def voice_pii_guard(
    *, action: str = "block"
) -> _VoicePiiGuard:
    return _VoicePiiGuard(action=action)
