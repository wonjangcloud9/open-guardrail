"""Language detection and filtering guard."""
from __future__ import annotations

import time
from typing import List, Optional

from open_guardrail.core import GuardResult

_SCRIPT_RANGES: dict[str, list[tuple[int, int]]] = {
    "ko": [(0xAC00, 0xD7AF), (0x3130, 0x318F), (0x1100, 0x11FF)],
    "ja": [(0x3040, 0x309F), (0x30A0, 0x30FF), (0x4E00, 0x9FFF)],
    "zh": [(0x4E00, 0x9FFF), (0x3400, 0x4DBF)],
    "ar": [(0x0600, 0x06FF), (0x0750, 0x077F)],
    "th": [(0x0E00, 0x0E7F)],
    "hi": [(0x0900, 0x097F)],
    "ru": [(0x0400, 0x04FF)],
}

_COMMON_WORDS: dict[str, list[str]] = {
    "en": ["the", "is", "are", "was", "were", "have", "has", "and", "for", "that", "this", "with"],
    "ko": ["이", "그", "저", "것", "수", "를", "에", "의", "은", "는", "가"],
    "ja": ["の", "は", "が", "を", "に", "で", "と", "も", "から", "まで"],
    "zh": ["的", "是", "在", "了", "不", "和", "有", "这", "人", "我"],
    "es": ["el", "la", "de", "en", "que", "los", "del", "las", "por", "con"],
    "fr": ["le", "la", "de", "et", "les", "des", "en", "un", "une", "est"],
    "de": ["der", "die", "und", "den", "von", "ist", "das", "ein", "mit", "auf"],
}


def _detect_language(text: str) -> Optional[str]:
    scores: dict[str, int] = {}
    for ch in text:
        cp = ord(ch)
        for lang, ranges in _SCRIPT_RANGES.items():
            for lo, hi in ranges:
                if lo <= cp <= hi:
                    scores[lang] = scores.get(lang, 0) + 1
    words = text.lower().split()
    for lang, word_list in _COMMON_WORDS.items():
        count = sum(1 for w in words if w in word_list)
        if count >= 2:
            scores[lang] = scores.get(lang, 0) + count * 3
    if not scores:
        return None
    return max(scores, key=lambda k: scores[k])


class _Language:
    def __init__(self, *, allowed: List[str], action: str = "block") -> None:
        self.name = "language"
        self.action = action
        self.allowed = [a.lower() for a in allowed]

    def check(self, text: str, stage: str = "input") -> GuardResult:
        start = time.perf_counter()
        detected = _detect_language(text)
        triggered = detected is not None and detected not in self.allowed
        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(
            guard_name="language",
            passed=not triggered,
            action=self.action if triggered else "allow",
            message=f"Language '{detected}' not allowed" if triggered else None,
            latency_ms=round(elapsed, 2),
            details={"detected": detected, "allowed": self.allowed} if triggered else None,
        )


def language(*, allowed: List[str], action: str = "block") -> _Language:
    return _Language(allowed=allowed, action=action)
