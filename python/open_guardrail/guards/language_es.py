"""Spanish language detection guard."""
from __future__ import annotations

import re
import time

from open_guardrail.core import GuardResult

_COMMON_ES = {
    "el", "la", "de", "que", "en", "un", "es", "por",
    "los", "las", "del", "se", "con", "una", "su", "para",
    "al", "no", "son", "lo", "como", "pero", "sus", "le",
    "ya", "fue", "este", "ha", "si", "o", "ser", "sobre",
    "todo", "tiene", "muy", "entre", "desde", "nos",
    "esta", "hay", "yo", "cuando", "mas", "sin", "donde",
}

_SPANISH_CHARS = re.compile(r"[áéíóúñ¡¿ü]", re.IGNORECASE)


class _LanguageEs:
    def __init__(
        self, *, action: str = "block", min_ratio: float = 0.3
    ) -> None:
        self.name = "language-es"
        self.action = action
        self._min_ratio = min_ratio

    def check(
        self, text: str, stage: str = "input"
    ) -> GuardResult:
        start = time.perf_counter()

        sp_chars = len(_SPANISH_CHARS.findall(text))
        char_score = (
            min(sp_chars / (len(text) * 0.05), 1.0)
            if text
            else 0.0
        )

        words = text.lower().split()
        es_count = sum(1 for w in words if w in _COMMON_ES)
        word_ratio = es_count / len(words) if words else 0.0

        score = char_score * 0.3 + word_ratio * 0.7
        passed = score >= self._min_ratio
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="language-es",
            passed=passed,
            action="allow" if passed else self.action,
            score=1 - score,
            message=None if passed else "Text is not Spanish",
            latency_ms=round(elapsed, 2),
            details={
                "char_score": round(char_score, 3),
                "word_ratio": round(word_ratio, 3),
                "combined_score": round(score, 3),
            },
        )


def language_es(
    *, action: str = "block", min_ratio: float = 0.3
) -> _LanguageEs:
    return _LanguageEs(action=action, min_ratio=min_ratio)
