"""Extended Korean profanity detection with internet slang."""
from __future__ import annotations

import re
import time

from open_guardrail.core import GuardResult

_PATTERNS: list[re.Pattern[str]] = [
    re.compile(r"ㅅㅂ"),
    re.compile(r"ㅈㄹ"),
    re.compile(r"ㄲㅈ"),
    re.compile(r"ㅂㅅ"),
    re.compile(r"ㅁㅊ"),
    re.compile(r"시발"),
    re.compile(r"씨발"),
    re.compile(r"좆"),
    re.compile(r"개새끼"),
    re.compile(r"미친놈"),
    re.compile(r"미친년"),
    re.compile(r"병신"),
    re.compile(r"또라이"),
    re.compile(r"찐따"),
    re.compile(r"돌아이"),
    re.compile(r"돌+아이"),
    re.compile(r"ㅆㅂ"),
    re.compile(r"ㅄ"),
    re.compile(r"시[빠바]럴"),
    re.compile(r"씨[빠바]럴"),
    re.compile(r"개[씹쌍]"),
    re.compile(r"느금마"),
    re.compile(r"지랄"),
    re.compile(r"꺼져"),
    re.compile(r"닥[쳐치]"),
    re.compile(r"엠창"),
    re.compile(r"니[애에]미"),
    re.compile(r"새[끼기]야"),
]


class _ProfanityKoExtended:
    def __init__(self, *, action: str = "block") -> None:
        self.name = "profanity-ko-extended"
        self.action = action

    def check(
        self, text: str, stage: str = "input"
    ) -> GuardResult:
        start = time.perf_counter()
        matched: list[str] = []

        for pat in _PATTERNS:
            if pat.search(text):
                matched.append(pat.pattern)

        triggered = len(matched) > 0
        score = (
            min(len(matched) / 3, 1.0) if triggered else 0.0
        )
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="profanity-ko-extended",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=score,
            message=(
                "Korean profanity detected"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {"matched_count": len(matched)}
                if triggered
                else None
            ),
        )


def profanity_ko_extended(
    *, action: str = "block"
) -> _ProfanityKoExtended:
    return _ProfanityKoExtended(action=action)
