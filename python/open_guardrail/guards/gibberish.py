"""Detect gibberish or nonsensical input."""

import re
import time
from typing import Optional

from open_guardrail.core import GuardResult

_VOWELS = set("aeiouAEIOU")
_CONSONANTS = set(
    "bcdfghjklmnpqrstvwxyz"
    "BCDFGHJKLMNPQRSTVWXYZ"
)


def _vowel_ratio(text: str) -> float:
    alpha = [c for c in text if c.isalpha()]
    if not alpha:
        return 0.5
    vowel_count = sum(1 for c in alpha if c in _VOWELS)
    return vowel_count / len(alpha)


def _repeated_char_ratio(text: str) -> float:
    if len(text) < 2:
        return 0.0
    repeated = sum(
        1
        for i in range(1, len(text))
        if text[i] == text[i - 1]
    )
    return repeated / (len(text) - 1)


def _max_consecutive_consonants(text: str) -> int:
    max_c = 0
    current = 0
    for c in text:
        if c in _CONSONANTS:
            current += 1
            if current > max_c:
                max_c = current
        else:
            current = 0
    return max_c


def _special_char_ratio(text: str) -> float:
    if not text:
        return 0.0
    pat = re.compile(
        r"[a-zA-Z0-9\s.,!?;:'\"()\-"
        r"\u3000-\u9FFF\uAC00-\uD7AF"
        r"\u3040-\u30FF]"
    )
    special = sum(1 for c in text if not pat.match(c))
    return special / len(text)


def _word_variety(text: str) -> float:
    words = [
        w for w in text.lower().split() if len(w) > 0
    ]
    if len(words) <= 1:
        return 1.0
    unique = set(words)
    return len(unique) / len(words)


def _compute_score(text: str) -> float:
    stripped = text.strip()
    if not stripped:
        return 0.0

    score = 0.0

    vr = _vowel_ratio(stripped)
    if vr < 0.15 or vr > 0.7:
        score += 0.3

    rcr = _repeated_char_ratio(stripped)
    if rcr > 0.3:
        score += 0.3

    mcc = _max_consecutive_consonants(stripped)
    if mcc >= 5:
        score += 0.25

    scr = _special_char_ratio(stripped)
    if scr > 0.3:
        score += 0.15

    wv = _word_variety(stripped)
    words = stripped.split()
    if wv < 0.3 and len(words) > 3:
        score += 0.15

    if len(words) == 1 and len(stripped) > 10:
        alpha_only = re.sub(r"[^a-zA-Z]", "", stripped)
        if (
            len(alpha_only) > 8
            and _vowel_ratio(alpha_only) < 0.2
        ):
            score += 0.3

    return min(1.0, score)


class _GibberishDetect:
    def __init__(
        self,
        *,
        action: str = "block",
        threshold: float = 0.5,
    ) -> None:
        self.name = "gibberish-detect"
        self.action = action
        self._threshold = threshold

    def check(
        self, text: str, stage: str = "input"
    ) -> GuardResult:
        start = time.perf_counter()
        score = _compute_score(text)
        triggered = score >= self._threshold
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="gibberish-detect",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=score,
            message=(
                "Gibberish detected"
                f" (score: {round(score * 100)}%)"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {
                    "vowel_ratio": _vowel_ratio(text),
                    "repeated_char_ratio": (
                        _repeated_char_ratio(text)
                    ),
                    "max_consecutive_consonants": (
                        _max_consecutive_consonants(text)
                    ),
                    "special_char_ratio": (
                        _special_char_ratio(text)
                    ),
                    "reason": (
                        "Input appears to be random,"
                        " nonsensical, or spam-like"
                        " text"
                    ),
                }
                if triggered
                else None
            ),
        )


def gibberish_detect(
    *,
    action: str = "block",
    threshold: float = 0.5,
) -> _GibberishDetect:
    return _GibberishDetect(
        action=action, threshold=threshold
    )
