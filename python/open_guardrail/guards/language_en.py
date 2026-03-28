"""English language detection guard."""

import re
import time

from open_guardrail.core import GuardResult

_COMMON_EN = {
    "the", "be", "to", "of", "and", "a", "in", "that",
    "have", "i", "it", "for", "not", "on", "with", "he",
    "as", "you", "do", "at", "this", "but", "his", "by",
    "from", "they", "we", "say", "her", "she", "or", "an",
    "will", "my", "one", "all", "would", "there", "their",
    "what", "so", "up", "out", "if", "about", "who", "get",
    "which", "go", "me", "when", "make", "can", "like",
    "time", "no", "just", "him", "know", "take", "is",
    "are", "was", "were", "been",
}


class _LanguageEn:
    def __init__(
        self, *, action: str = "block", min_ratio: float = 0.5
    ) -> None:
        self.name = "language-en"
        self.action = action
        self._min_ratio = min_ratio

    def check(
        self, text: str, stage: str = "input"
    ) -> GuardResult:
        start = time.perf_counter()

        letters = len(re.sub(r"[^a-zA-Z]", "", text))
        ascii_ratio = letters / len(text) if text else 0.0

        words = text.lower().split()
        en_count = sum(1 for w in words if w in _COMMON_EN)
        word_ratio = en_count / len(words) if words else 0.0

        score = ascii_ratio * 0.4 + word_ratio * 0.6
        passed = score >= self._min_ratio
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="language-en",
            passed=passed,
            action="allow" if passed else self.action,
            score=1 - score,
            message=None if passed else "Text is not English",
            latency_ms=round(elapsed, 2),
            details={
                "ascii_ratio": round(ascii_ratio, 3),
                "word_ratio": round(word_ratio, 3),
                "combined_score": round(score, 3),
            },
        )


def language_en(
    *, action: str = "block", min_ratio: float = 0.5
) -> _LanguageEn:
    return _LanguageEn(action=action, min_ratio=min_ratio)
