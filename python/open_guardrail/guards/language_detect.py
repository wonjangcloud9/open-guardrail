"""Enhanced multi-language detection guard."""

import time
from typing import Dict, List, Optional

from open_guardrail.core import GuardResult

_SCRIPT_RANGES: dict[str, list[tuple[int, int]]] = {
    "ko": [(0xAC00, 0xD7AF), (0x3130, 0x318F)],
    "ja": [(0x3040, 0x309F), (0x30A0, 0x30FF)],
    "zh": [(0x4E00, 0x9FFF)],
    "ar": [(0x0600, 0x06FF)],
    "th": [(0x0E00, 0x0E7F)],
    "hi": [(0x0900, 0x097F)],
    "ru": [(0x0400, 0x04FF)],
}

_COMMON_WORDS: dict[str, list[str]] = {
    "en": ["the", "is", "are", "was", "have", "and", "for", "that", "with", "this"],
    "es": ["el", "la", "de", "en", "que", "los", "por", "con", "una", "del"],
    "fr": ["le", "la", "de", "et", "les", "des", "en", "un", "une", "est"],
    "de": ["der", "die", "und", "den", "von", "ist", "das", "ein", "mit", "auf"],
    "pt": ["de", "que", "em", "para", "com", "uma", "por", "como", "mais", "dos"],
}


def _detect_languages(text: str) -> Dict[str, float]:
    scores: Dict[str, float] = {}
    length = max(len(text), 1)
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
    return {k: round(v / length * 100, 1) for k, v in scores.items()}


class _LanguageDetect:
    def __init__(
        self, *, action: str = "block", required: Optional[List[str]] = None, forbidden: Optional[List[str]] = None,
    ) -> None:
        self.name = "language-detect"
        self.action = action
        self.required = [r.lower() for r in (required or [])]
        self.forbidden = [f.lower() for f in (forbidden or [])]

    def check(self, text: str, stage: str = "input") -> GuardResult:
        start = time.perf_counter()
        detected = _detect_languages(text)
        violations: List[str] = []
        if self.required:
            for r in self.required:
                if r not in detected:
                    violations.append(f"Required language '{r}' not found")
        if self.forbidden:
            for f in self.forbidden:
                if f in detected:
                    violations.append(f"Forbidden language '{f}' detected")
        triggered = len(violations) > 0
        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(
            guard_name="language-detect",
            passed=not triggered,
            action=self.action if triggered else "allow",
            message="; ".join(violations) if triggered else None,
            latency_ms=round(elapsed, 2),
            details={"detected": detected, "violations": violations} if triggered else None,
        )


def language_detect(
    *, action: str = "block", required: Optional[List[str]] = None, forbidden: Optional[List[str]] = None,
) -> _LanguageDetect:
    return _LanguageDetect(action=action, required=required, forbidden=forbidden)
