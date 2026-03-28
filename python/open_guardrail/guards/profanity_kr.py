"""Korean profanity detection with choseong variants."""
from __future__ import annotations

import re
import time

from open_guardrail.core import GuardResult

_BASE_WORDS: list[str] = [
    "시발", "씨발", "개새끼", "병신", "지랄",
    "미친놈", "미친년", "좆", "닥쳐", "꺼져",
    "개년", "썅", "엿먹어",
]

_CHOSEONG_MAP: dict[str, str] = {
    "ㅅㅂ": "시발",
    "ㅆㅂ": "씨발",
    "ㄱㅅㄲ": "개새끼",
    "ㅂㅅ": "병신",
    "ㅈㄹ": "지랄",
}

_VARIANT_PATTERNS: list[tuple[re.Pattern[str], str]] = [
    (re.compile(r"시[1!]발"), "시발"),
    (re.compile(r"씨[빨팔]"), "씨발"),
    (re.compile(r"시[.\s]발"), "시발"),
    (re.compile(r"씨[.\s]발"), "씨발"),
    (re.compile(r"s발", re.I), "시발"),
    (re.compile(r"개[새세]끼"), "개새끼"),
    (re.compile(r"병[씬신]"), "병신"),
    (re.compile(r"ㅂr보"), "바보"),
]


def _find_base(text: str) -> list[str]:
    return [w for w in _BASE_WORDS if w in text]


def _find_choseong(text: str) -> list[str]:
    found: list[str] = []
    for abbr, word in _CHOSEONG_MAP.items():
        if abbr in text:
            found.append(f"{abbr}({word})")
    return found


def _find_variants(text: str) -> list[str]:
    found: list[str] = []
    for pat, label in _VARIANT_PATTERNS:
        if pat.search(text):
            found.append(label)
    return found


class _ProfanityKr:
    def __init__(
        self,
        *,
        action: str = "block",
        detect_variants: bool = True,
    ) -> None:
        self.name = "profanity-kr"
        self.action = action
        self._detect_variants = detect_variants

    def check(
        self, text: str, stage: str = "input"
    ) -> GuardResult:
        start = time.perf_counter()
        matched: list[str] = []

        matched.extend(_find_base(text))

        if self._detect_variants:
            matched.extend(_find_choseong(text))
            matched.extend(_find_variants(text))

        unique = list(dict.fromkeys(matched))
        triggered = len(unique) > 0
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="profanity-kr",
            passed=not triggered,
            action=self.action if triggered else "allow",
            message=(
                "Korean profanity detected"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {
                    "matched": unique,
                    "reason": (
                        "Text contains Korean"
                        " profanity or variants"
                    ),
                }
                if triggered
                else None
            ),
        )


def profanity_kr(
    *,
    action: str = "block",
    detect_variants: bool = True,
) -> _ProfanityKr:
    return _ProfanityKr(
        action=action,
        detect_variants=detect_variants,
    )
