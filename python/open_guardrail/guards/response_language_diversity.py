"""Measure language diversity of response."""
from __future__ import annotations

import math
import re
import time

from open_guardrail.core import GuardResult

_WORD_RE = re.compile(r"\b[a-z]+\b")


def _compute_diversity(text: str) -> float:
    words = _WORD_RE.findall(text.lower())
    if len(words) < 5:
        return 1.0

    unique = set(words)
    unique_ratio = len(unique) / len(words)

    lengths = [len(w) for w in words]
    avg_len = sum(lengths) / len(lengths)
    variance = sum(
        (l - avg_len) ** 2 for l in lengths
    ) / len(lengths)
    len_var = min(math.sqrt(variance) / 5, 1.0)

    sentences = [
        s.strip()
        for s in re.split(r"[.!?]+", text)
        if s.strip()
    ]
    sent_lens = [
        len(s.split()) for s in sentences
    ]
    sent_variety = 0.5
    if len(sent_lens) >= 2:
        avg_s = sum(sent_lens) / len(sent_lens)
        s_var = sum(
            (l - avg_s) ** 2 for l in sent_lens
        ) / len(sent_lens)
        sent_variety = min(math.sqrt(s_var) / 10, 1.0)

    return (
        unique_ratio * 0.5
        + len_var * 0.25
        + sent_variety * 0.25
    )


class _ResponseLanguageDiversity:
    def __init__(
        self,
        *,
        action: str = "warn",
        min_diversity: float = 0.2,
    ) -> None:
        self.name = "response-language-diversity"
        self.action = action
        self._min_div = min_diversity

    def check(
        self, text: str, stage: str = "output"
    ) -> GuardResult:
        start = time.perf_counter()
        diversity = _compute_diversity(text)
        triggered = diversity < self._min_div
        score = (1.0 - diversity) if triggered else 0.0
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="response-language-diversity",
            passed=not triggered,
            action=(
                self.action if triggered else "allow"
            ),
            score=score,
            message=(
                "Low language diversity detected"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details={
                "diversity": round(diversity, 3),
                "min_diversity": self._min_div,
            },
        )


def response_language_diversity(
    *,
    action: str = "warn",
    min_diversity: float = 0.2,
) -> _ResponseLanguageDiversity:
    return _ResponseLanguageDiversity(
        action=action, min_diversity=min_diversity
    )
