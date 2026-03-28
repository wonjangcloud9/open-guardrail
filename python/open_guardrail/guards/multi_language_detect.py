"""Detect which language scripts are present."""

import re
import time

from open_guardrail.core import GuardResult

_SCRIPT_RANGES: list[tuple[str, re.Pattern[str]]] = [
    ("Latin", re.compile(r"[A-Za-z\u00C0-\u024F]")),
    ("Cyrillic", re.compile(r"[\u0400-\u04FF]")),
    (
        "CJK",
        re.compile(r"[\u4E00-\u9FFF\u3400-\u4DBF]"),
    ),
    ("Arabic", re.compile(r"[\u0600-\u06FF]")),
    ("Devanagari", re.compile(r"[\u0900-\u097F]")),
    ("Thai", re.compile(r"[\u0E00-\u0E7F]")),
    ("Hebrew", re.compile(r"[\u0590-\u05FF]")),
    ("Greek", re.compile(r"[\u0370-\u03FF]")),
    (
        "Korean",
        re.compile(r"[\uAC00-\uD7AF\u1100-\u11FF]"),
    ),
    (
        "Japanese",
        re.compile(r"[\u3040-\u309F\u30A0-\u30FF]"),
    ),
]


class _MultiLanguageDetect:
    def __init__(
        self,
        *,
        action: str = "warn",
        max_languages: int = 2,
    ) -> None:
        self.name = "multi-language-detect"
        self.action = action
        self._max_languages = max_languages

    def check(
        self, text: str, stage: str = "input"
    ) -> GuardResult:
        start = time.perf_counter()
        detected: list[str] = []

        for name, pattern in _SCRIPT_RANGES:
            if pattern.search(text):
                detected.append(name)

        triggered = len(detected) > self._max_languages
        score = (
            min(
                (len(detected) - self._max_languages)
                / 3,
                1.0,
            )
            if triggered
            else 0.0
        )
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="multi-language-detect",
            passed=not triggered,
            action=(
                self.action if triggered else "allow"
            ),
            score=score,
            message=(
                "Multiple language scripts detected"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details={
                "detected_scripts": detected,
                "count": len(detected),
            },
        )


def multi_language_detect(
    *,
    action: str = "warn",
    max_languages: int = 2,
) -> _MultiLanguageDetect:
    return _MultiLanguageDetect(
        action=action, max_languages=max_languages
    )
