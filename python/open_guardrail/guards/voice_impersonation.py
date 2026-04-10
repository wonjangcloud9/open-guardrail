"""Detect voice cloning or unauthorized persona mimicry."""
from __future__ import annotations

import re
import time

from open_guardrail.core import GuardResult

_IMPERSONATION = re.compile(
    r"\b(?:speak\s+as"
    r"|imitate\s+the\s+voice\s+of"
    r"|sound\s+like"
    r"|voice\s+clon(?:e|ing)"
    r"|deepfake\s+voice"
    r"|mimic|impersonate"
    r"|pretend\s+to\s+be\s+\w+"
    r"|use\s+the\s+voice\s+of"
    r"|synthesize\s+voice\s+of"
    r"|generate\s+speech\s+as\s+\w+)\b",
    re.IGNORECASE,
)


class _VoiceImpersonation:
    def __init__(
        self, *, action: str = "block"
    ) -> None:
        self.name = "voice-impersonation"
        self.action = action

    def check(
        self, text: str, stage: str = "input"
    ) -> GuardResult:
        start = time.perf_counter()
        m = _IMPERSONATION.search(text)
        triggered = m is not None
        elapsed = (
            time.perf_counter() - start
        ) * 1000
        if not triggered:
            return GuardResult(
                guard_name="voice-impersonation",
                passed=True,
                action="allow",
                latency_ms=round(elapsed, 2),
            )
        return GuardResult(
            guard_name="voice-impersonation",
            passed=False,
            action=self.action,
            message=(
                "Voice impersonation attempt: "
                f'"{m.group()}"'  # type: ignore[union-attr]
            ),
            latency_ms=round(elapsed, 2),
            details={
                "matched": m.group(),  # type: ignore[union-attr]
                "reason": (
                    "Attempt to clone or mimic"
                    " a specific voice"
                ),
            },
        )


def voice_impersonation(
    *, action: str = "block"
) -> _VoiceImpersonation:
    return _VoiceImpersonation(action=action)
