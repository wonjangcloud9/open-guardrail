"""Check for professional tone."""
from __future__ import annotations

import re
import time

from open_guardrail.core import GuardResult

_SLANG: list[re.Pattern[str]] = [
    re.compile(
        r"\b(lol|lmao|rofl|omg|brb|tbh|fyi|btw"
        r"|idk|ngl|smh|imo|imho|af|tho|gonna"
        r"|wanna|gotta|kinda|sorta)\b",
        re.IGNORECASE,
    ),
    re.compile(
        r"\b(dude|bro|fam|yolo|lit|slay|vibe"
        r"|sus|cap|no\s+cap|bet|salty|flex)\b",
        re.IGNORECASE,
    ),
]

_ALL_CAPS = re.compile(r"\b[A-Z]{4,}\b")


class _ToneProfessional:
    def __init__(
        self,
        *,
        action: str = "warn",
        max_exclamations: int = 2,
    ) -> None:
        self.name = "tone-professional"
        self.action = action
        self._max_excl = max_exclamations

    def check(
        self, text: str, stage: str = "output"
    ) -> GuardResult:
        start = time.perf_counter()
        issues: list[str] = []

        for pat in _SLANG:
            if pat.search(text):
                issues.append("informal_language")

        excl = text.count("!")
        if excl > self._max_excl:
            issues.append("excessive_exclamations")

        if _ALL_CAPS.search(text):
            issues.append("all_caps_shouting")

        unique = list(dict.fromkeys(issues))
        triggered = len(unique) > 0
        score = (
            min(len(unique) / 3, 1.0)
            if triggered
            else 0.0
        )
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="tone-professional",
            passed=not triggered,
            action=(
                self.action if triggered else "allow"
            ),
            score=score,
            message=(
                f"Unprofessional tone: "
                f"{', '.join(unique)}"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {
                    "issues": unique,
                    "exclamation_count": excl,
                }
                if triggered
                else None
            ),
        )


def tone_professional(
    *,
    action: str = "warn",
    max_exclamations: int = 2,
) -> _ToneProfessional:
    return _ToneProfessional(
        action=action,
        max_exclamations=max_exclamations,
    )
