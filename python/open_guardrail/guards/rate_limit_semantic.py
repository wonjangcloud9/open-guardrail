"""Semantic rate limiting using trigram similarity."""
from __future__ import annotations

import re
import time

from open_guardrail.core import GuardResult


def _trigrams(text: str) -> set[str]:
    normalized = re.sub(r"\s+", " ", text.lower().strip())
    if len(normalized) < 3:
        return {normalized}
    return {
        normalized[i : i + 3]
        for i in range(len(normalized) - 2)
    }


def _similarity(a: str, b: str) -> float:
    ta = _trigrams(a)
    tb = _trigrams(b)
    if not ta or not tb:
        return 0.0
    intersection = len(ta & tb)
    union = len(ta | tb)
    return intersection / union if union > 0 else 0.0


class _RateLimitSemantic:
    def __init__(
        self,
        *,
        action: str = "block",
        max_similar: int = 5,
        window_ms: int = 60000,
        threshold: float = 0.7,
    ) -> None:
        self.name = "rate-limit-semantic"
        self.action = action
        self.max_similar = max_similar
        self.window_ms = window_ms
        self.threshold = threshold
        self._history: list[tuple[float, str]] = []

    def _prune(self, now: float) -> None:
        cutoff = now - self.window_ms
        self._history = [
            (ts, t)
            for ts, t in self._history
            if ts >= cutoff
        ]

    def check(
        self, text: str, stage: str = "input"
    ) -> GuardResult:
        start = time.perf_counter()
        now_ms = time.time() * 1000
        self._prune(now_ms)

        similar_count = 0
        for _, prev_text in self._history:
            if _similarity(text, prev_text) >= self.threshold:
                similar_count += 1

        self._history.append((now_ms, text))

        triggered = similar_count >= self.max_similar
        score = (
            min(similar_count / self.max_similar, 1.0)
            if similar_count > 0
            else 0.0
        )
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="rate-limit-semantic",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=score,
            message=(
                "Semantic rate limit exceeded"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {
                    "similar_count": similar_count,
                    "max_similar": self.max_similar,
                    "window_ms": self.window_ms,
                    "reason": (
                        "Too many semantically similar"
                        " requests detected within"
                        " the time window"
                    ),
                }
                if triggered
                else {
                    "similar_count": similar_count,
                    "max_similar": self.max_similar,
                }
            ),
        )


def rate_limit_semantic(
    *,
    action: str = "block",
    max_similar: int = 5,
    window_ms: int = 60000,
    threshold: float = 0.7,
) -> _RateLimitSemantic:
    return _RateLimitSemantic(
        action=action,
        max_similar=max_similar,
        window_ms=window_ms,
        threshold=threshold,
    )
