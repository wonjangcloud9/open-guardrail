"""Flesch-Kincaid grade level guard."""
from __future__ import annotations

import re
import time

from open_guardrail.core import GuardResult


def _syllables(word: str) -> int:
    w = "".join(c for c in word.lower() if c.isalpha())
    if len(w) <= 3:
        return 1
    count = 0
    vowels = "aeiouy"
    prev = False
    for ch in w:
        v = ch in vowels
        if v and not prev:
            count += 1
        prev = v
    if w.endswith("e") and count > 1:
        count -= 1
    return max(1, count)


class _LanguageComplexity:
    def __init__(
        self,
        *,
        action: str = "warn",
        max_grade_level: int = 12,
        min_grade_level: int = 0,
    ) -> None:
        self.name = "language-complexity"
        self.action = action
        self.max_grade = max_grade_level
        self.min_grade = min_grade_level

    def check(
        self, text: str, stage: str = "output"
    ) -> GuardResult:
        start = time.perf_counter()

        sentences = [
            s.strip()
            for s in re.split(r"[.!?]+", text)
            if s.strip()
        ]
        words = [
            w for w in text.split()
            if any(c.isalpha() for c in w)
        ]

        if not sentences or not words:
            elapsed = (time.perf_counter() - start) * 1000
            return GuardResult(
                guard_name="language-complexity",
                passed=True,
                action="allow",
                latency_ms=round(elapsed, 2),
            )

        total_syl = sum(_syllables(w) for w in words)
        grade = (
            0.39 * (len(words) / len(sentences))
            + 11.8 * (total_syl / len(words))
            - 15.59
        )
        grade = round(grade, 1)

        triggered = (
            grade > self.max_grade
            or grade < self.min_grade
        )
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="language-complexity",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=grade,
            message=(
                f"Grade level {grade} outside"
                f" [{self.min_grade}, {self.max_grade}]"
                if triggered else None
            ),
            latency_ms=round(elapsed, 2),
            details={
                "grade_level": grade,
                "sentences": len(sentences),
                "words": len(words),
                "syllables": total_syl,
            } if triggered else None,
        )


def language_complexity(
    *,
    action: str = "warn",
    max_grade_level: int = 12,
    min_grade_level: int = 0,
) -> _LanguageComplexity:
    return _LanguageComplexity(
        action=action,
        max_grade_level=max_grade_level,
        min_grade_level=min_grade_level,
    )
