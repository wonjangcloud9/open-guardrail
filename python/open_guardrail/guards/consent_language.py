"""Validate consent language quality and detect dark patterns."""
from __future__ import annotations

import re
import time

from open_guardrail.core import GuardResult

_PATTERNS: list[tuple[str, re.Pattern[str]]] = [
    (
        "pre_ticked_consent",
        re.compile(
            r"pre[- ]?(ticked|checked|selected)"
            r"\s+(box|checkbox|consent)",
            re.IGNORECASE,
        ),
    ),
    (
        "bundled_consent",
        re.compile(
            r"by\s+(signing|agreeing|accepting)"
            r"\s+you\s+(also|additionally)\s+consent",
            re.IGNORECASE,
        ),
    ),
    (
        "hidden_terms",
        re.compile(
            r"hidden\s+(terms|conditions|clauses)",
            re.IGNORECASE,
        ),
    ),
    (
        "by_continuing_agree",
        re.compile(
            r"by\s+(continuing|using|accessing"
            r"|proceeding)\s+(you\s+)?"
            r"(agree|consent|accept)",
            re.IGNORECASE,
        ),
    ),
    (
        "dark_pattern_urgency",
        re.compile(
            r"(act\s+now|limited\s+time"
            r"|don'?t\s+miss|hurry)",
            re.IGNORECASE,
        ),
    ),
    (
        "missing_opt_out",
        re.compile(
            r"no\s+(option|way|ability)\s+to"
            r"\s+(opt[- ]?out|unsubscribe|withdraw)",
            re.IGNORECASE,
        ),
    ),
    (
        "forced_consent",
        re.compile(
            r"(must|required\s+to)"
            r"\s+(agree|consent|accept)"
            r"\s+to\s+(all|every)",
            re.IGNORECASE,
        ),
    ),
    (
        "deceptive_button",
        re.compile(
            r"(accept\s+all|agree\s+to\s+all"
            r"|yes\s+to\s+everything)",
            re.IGNORECASE,
        ),
    ),
    (
        "auto_enroll",
        re.compile(
            r"auto(matically)?\s*(enroll|subscribe"
            r"|opt[- ]?in)",
            re.IGNORECASE,
        ),
    ),
]


class _ConsentLanguage:
    def __init__(self, *, action: str = "block") -> None:
        self.name = "consent-language"
        self.action = action

    def check(
        self, text: str, stage: str = "output"
    ) -> GuardResult:
        start = time.perf_counter()
        matched: list[str] = []

        for name, pat in _PATTERNS:
            if pat.search(text):
                matched.append(name)

        triggered = len(matched) > 0
        score = (
            min(len(matched) / 3, 1.0) if triggered else 0.0
        )
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="consent-language",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=score,
            message=(
                "Consent language issue detected"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {"matched": matched} if triggered else None
            ),
        )


def consent_language(
    *, action: str = "block"
) -> _ConsentLanguage:
    return _ConsentLanguage(action=action)
