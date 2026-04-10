"""Enforce content filtering for K-12 audiences."""
from __future__ import annotations

import re
import time

from open_guardrail.core import GuardResult

_GRADE_CTX = re.compile(
    r"\b(?:(?:for\s+)?(?:1st|2nd|3rd"
    r"|[4-8]th)\s+graders?"
    r"|elementary|K-?12"
    r"|middle\s+school"
    r"|kindergarten)\b",
    re.IGNORECASE,
)
_INAPPROPRIATE = re.compile(
    r"\b(?:violen(?:ce|t)|murder"
    r"|kill(?:ing)?|drugs?|cocaine"
    r"|heroin|meth|explicit"
    r"|sex(?:ual)?|porn"
    r"|gambl(?:e|ing)|alcohol"
    r"|beer|wine|liquor"
    r"|cigarette|tobacco"
    r"|weapon|firearm|suicide)\b",
    re.IGNORECASE,
)


def _estimate_grade_level(text: str) -> int:
    sentences = [
        s
        for s in re.split(r"[.!?]+", text)
        if s.strip()
    ]
    if not sentences:
        return 0
    words = [
        w for w in text.split() if w
    ]
    if not words:
        return 0
    avg_wps = len(words) / len(sentences)
    total_syl = sum(
        max(
            1,
            len(
                re.findall(
                    r"[aeiouy]+", w, re.I
                )
            ),
        )
        for w in words
    )
    avg_syl = total_syl / len(words)
    return round(
        0.39 * avg_wps
        + 11.8 * avg_syl
        - 15.59
    )


class _AgeAppropriateContent:
    def __init__(
        self,
        *,
        action: str = "block",
        max_grade_level: int = 8,
    ) -> None:
        self.name = "age-appropriate-content"
        self.action = action
        self.max_grade = max_grade_level

    def check(
        self, text: str, stage: str = "output"
    ) -> GuardResult:
        start = time.perf_counter()
        issues: list[str] = []
        grade = _estimate_grade_level(text)
        if grade > self.max_grade:
            issues.append(
                f"Reading level (grade {grade})"
                f" exceeds max"
                f" (grade {self.max_grade})"
            )
        has_ctx = bool(
            _GRADE_CTX.search(text)
        )
        has_bad = bool(
            _INAPPROPRIATE.search(text)
        )
        if has_bad and (
            has_ctx or self.max_grade <= 8
        ):
            issues.append(
                "Age-inappropriate content"
                " detected for target audience"
            )
        elapsed = (
            time.perf_counter() - start
        ) * 1000
        if not issues:
            return GuardResult(
                guard_name=(
                    "age-appropriate-content"
                ),
                passed=True,
                action="allow",
                latency_ms=round(elapsed, 2),
            )
        return GuardResult(
            guard_name="age-appropriate-content",
            passed=False,
            action=self.action,
            message="; ".join(issues),
            latency_ms=round(elapsed, 2),
            details={
                "grade_level": grade,
                "max_grade_level": self.max_grade,
                "issues": issues,
                "has_grade_context": has_ctx,
                "has_inappropriate": has_bad,
            },
        )


def age_appropriate_content(
    *,
    action: str = "block",
    max_grade_level: int = 8,
) -> _AgeAppropriateContent:
    return _AgeAppropriateContent(
        action=action,
        max_grade_level=max_grade_level,
    )
