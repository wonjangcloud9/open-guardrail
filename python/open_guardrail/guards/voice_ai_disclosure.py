"""Mandate AI identity disclosure in voice conversations."""
from __future__ import annotations

import re
import time

from open_guardrail.core import GuardResult

_VOICE_CTX = re.compile(
    r"\b(?:call|phone|speaking\s+with"
    r"|voice|conversation|hello"
    r"|good\s+(?:morning|afternoon"
    r"|evening))\b",
    re.IGNORECASE,
)
_DISCLOSURE = re.compile(
    r"\b(?:(?:you\s+are\s+)?speaking\s+"
    r"with\s+(?:an?\s+)?AI|AI\s+assistant"
    r"|automated\s+system|virtual\s+agent"
    r"|this\s+is\s+an\s+AI"
    r"|AI[- ]powered)\b",
    re.IGNORECASE,
)
_DENIAL = re.compile(
    r"\b(?:I\s+am\s+a\s+real\s+person"
    r"|I\s+am\s+human"
    r"|(?:I(?:'m| am)\s+)?not\s+a\s+"
    r"robot)\b",
    re.IGNORECASE,
)


class _VoiceAiDisclosure:
    def __init__(
        self, *, action: str = "block"
    ) -> None:
        self.name = "voice-ai-disclosure"
        self.action = action

    def check(
        self, text: str, stage: str = "output"
    ) -> GuardResult:
        start = time.perf_counter()
        has_voice = bool(_VOICE_CTX.search(text))
        has_disc = bool(_DISCLOSURE.search(text))
        has_deny = bool(_DENIAL.search(text))
        triggered = has_deny or (
            has_voice and not has_disc
        )
        reason = (
            "AI explicitly denied its identity"
            if has_deny
            else "Voice context without AI disclosure"
        )
        elapsed = (
            time.perf_counter() - start
        ) * 1000
        if not triggered:
            return GuardResult(
                guard_name="voice-ai-disclosure",
                passed=True,
                action="allow",
                latency_ms=round(elapsed, 2),
            )
        return GuardResult(
            guard_name="voice-ai-disclosure",
            passed=False,
            action=self.action,
            message=reason,
            latency_ms=round(elapsed, 2),
            details={
                "has_voice_context": has_voice,
                "has_disclosure": has_disc,
                "has_denial": has_deny,
                "reason": reason,
            },
        )


def voice_ai_disclosure(
    *, action: str = "block"
) -> _VoiceAiDisclosure:
    return _VoiceAiDisclosure(action=action)
