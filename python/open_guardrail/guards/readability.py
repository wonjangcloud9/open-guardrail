"""Flesch Reading Ease score validation."""
from __future__ import annotations

import time
from typing import Optional

from open_guardrail.core import GuardResult


def _count_syllables(word: str) -> int:
    w = "".join(c for c in word.lower() if c.isalpha())
    if len(w) <= 3:
        return 1
    count = 0
    vowels = "aeiouy"
    prev_vowel = False
    for ch in w:
        is_v = ch in vowels
        if is_v and not prev_vowel:
            count += 1
        prev_vowel = is_v
    if w.endswith("e") and count > 1:
        count -= 1
    return max(1, count)


def _flesch_reading_ease(text: str) -> float:
    sentences = [
        s
        for s in text.split(".")
        if s.strip()
        for s in [s]  # noqa: B020
    ]
    # Split on sentence-ending punctuation
    import re

    sentences = [
        s.strip()
        for s in re.split(r"[.!?]+", text)
        if s.strip()
    ]
    words = [
        w
        for w in text.split()
        if any(c.isalpha() for c in w)
    ]
    if not sentences or not words:
        return 100.0

    total_syl = sum(_count_syllables(w) for w in words)
    avg_words = len(words) / len(sentences)
    avg_syl = total_syl / len(words)

    return 206.835 - 1.015 * avg_words - 84.6 * avg_syl


def _get_grade(score: float) -> str:
    if score >= 90:
        return "very-easy"
    if score >= 80:
        return "easy"
    if score >= 70:
        return "fairly-easy"
    if score >= 60:
        return "standard"
    if score >= 50:
        return "fairly-difficult"
    if score >= 30:
        return "difficult"
    return "very-difficult"


class _Readability:
    def __init__(
        self,
        *,
        action: str = "block",
        min_score: Optional[float] = None,
        max_score: Optional[float] = None,
    ) -> None:
        self.name = "readability"
        self.action = action
        self._min_score = min_score
        self._max_score = max_score

    def check(
        self, text: str, stage: str = "output"
    ) -> GuardResult:
        start = time.perf_counter()
        score = _flesch_reading_ease(text)
        grade = _get_grade(score)

        triggered = False
        if (
            self._min_score is not None
            and score < self._min_score
        ):
            triggered = True
        if (
            self._max_score is not None
            and score > self._max_score
        ):
            triggered = True

        elapsed = (time.perf_counter() - start) * 1000
        rounded = round(score, 1)

        return GuardResult(
            guard_name="readability",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=rounded,
            message=(
                f"Readability score {rounded}"
                f" ({grade}) out of range"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details={
                "flesch_score": rounded,
                "grade": grade,
            },
        )


def readability(
    *,
    action: str = "block",
    min_score: Optional[float] = None,
    max_score: Optional[float] = None,
) -> _Readability:
    return _Readability(
        action=action,
        min_score=min_score,
        max_score=max_score,
    )
