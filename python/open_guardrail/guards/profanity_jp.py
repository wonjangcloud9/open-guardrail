"""Japanese profanity detection."""
from __future__ import annotations

import re
import time

from open_guardrail.core import GuardResult

_BASE_WORDS: list[str] = [
    "くそ", "クソ", "ばか", "バカ", "馬鹿",
    "あほ", "アホ", "阿呆", "しね", "シネ",
    "死ね", "きもい", "キモい", "キモイ",
    "うざい", "ウザい", "ウザイ",
    "ふざけるな", "ブス", "デブ",
    "ちくしょう", "くたばれ", "ゴミ",
    "カス", "ボケ", "ぼけ",
    "きちがい", "キチガイ",
    "クズ", "くず",
]

_KANJI_WORDS: list[str] = [
    "糞", "阿呆", "馬鹿", "畜生",
    "気違い", "屑",
]

_VARIANT_PATTERNS: list[tuple[re.Pattern[str], str]] = [
    (re.compile(r"く[そソ]"), "くそ"),
    (re.compile(r"ば[かカ]"), "ばか"),
    (re.compile(r"バ[カか]"), "バカ"),
    (re.compile(r"し[ねネ]"), "しね"),
    (re.compile(r"う[ざザ][いイ]"), "うざい"),
    (re.compile(r"き[もモ][いイ]"), "きもい"),
    (re.compile(r"ク[ソそ]"), "クソ"),
    (re.compile(r"氏[ねネ]"), "死ね"),
    (re.compile(r"タヒ[ねネ]?"), "死ね"),
]


def _find_base(text: str) -> list[str]:
    found: list[str] = []
    for w in _BASE_WORDS:
        if w in text:
            found.append(w)
    for w in _KANJI_WORDS:
        if w in text:
            found.append(w)
    return found


def _find_variants(text: str) -> list[str]:
    found: list[str] = []
    for pat, label in _VARIANT_PATTERNS:
        if pat.search(text):
            found.append(label)
    return found


class _ProfanityJp:
    def __init__(
        self,
        *,
        action: str = "block",
        detect_variants: bool = True,
    ) -> None:
        self.name = "profanity-jp"
        self.action = action
        self._detect_variants = detect_variants

    def check(
        self, text: str, stage: str = "input"
    ) -> GuardResult:
        start = time.perf_counter()
        matched: list[str] = []

        matched.extend(_find_base(text))

        if self._detect_variants:
            matched.extend(_find_variants(text))

        unique = list(dict.fromkeys(matched))
        triggered = len(unique) > 0
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="profanity-jp",
            passed=not triggered,
            action=self.action if triggered else "allow",
            message=(
                "Japanese profanity detected"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {
                    "matched": unique,
                    "reason": (
                        "Text contains Japanese"
                        " profanity or variants"
                    ),
                }
                if triggered
                else None
            ),
        )


def profanity_jp(
    *,
    action: str = "block",
    detect_variants: bool = True,
) -> _ProfanityJp:
    return _ProfanityJp(
        action=action,
        detect_variants=detect_variants,
    )
