"""Detect output distribution shift vs baseline behavior."""
from __future__ import annotations

import time
from typing import List, Optional

from open_guardrail.core import GuardResult

_POSITIVE = frozenset([
    "good", "great", "excellent", "happy", "positive", "wonderful",
    "fantastic", "amazing", "love", "best", "perfect", "helpful",
    "thank", "nice", "beautiful", "brilliant", "success", "enjoy",
])

_NEGATIVE = frozenset([
    "bad", "terrible", "horrible", "sad", "negative", "awful",
    "worst", "hate", "fail", "wrong", "ugly", "stupid", "error",
    "problem", "broken", "useless", "annoying", "disappointing",
])


def _compute_stats(text: str):
    words = text.lower().split()
    wc = len(words)
    diversity = len(set(words)) / wc if wc else 0.0
    pos = sum(1 for w in words if w in _POSITIVE)
    neg = sum(1 for w in words if w in _NEGATIVE)
    total = pos + neg
    sentiment = pos / total if total else 0.5
    return wc, diversity, sentiment


class _ModelDriftDetect:
    def __init__(self, *, action: str = "block", window_size: int = 20) -> None:
        self.name = "model-drift-detect"
        self.action = action
        self.window_size = window_size
        self._history: List[tuple] = []

    def check(self, text: str, stage: str = "output") -> GuardResult:
        start = time.perf_counter()
        wc, div, sent = _compute_stats(text)
        warming = len(self._history) < self.window_size

        triggered = False
        drift_type: Optional[str] = None
        magnitude = 0.0

        if not warming:
            avg_len = sum(h[0] for h in self._history) / len(self._history)
            avg_div = sum(h[1] for h in self._history) / len(self._history)
            avg_sent = sum(h[2] for h in self._history) / len(self._history)

            if avg_len > 0 and wc > avg_len * 3:
                triggered = True
                drift_type = "length_spike"
                magnitude = wc / avg_len
            elif avg_div > 0 and div < avg_div * 0.5:
                triggered = True
                drift_type = "vocabulary_drop"
                magnitude = 1 - div / avg_div
            elif (avg_sent > 0.6 and sent < 0.4) or (avg_sent < 0.4 and sent > 0.6):
                triggered = True
                drift_type = "sentiment_flip"
                magnitude = abs(sent - avg_sent)

        self._history.append((wc, div, sent))
        if len(self._history) > self.window_size:
            self._history.pop(0)

        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(
            guard_name="model-drift-detect",
            passed=not triggered,
            action=self.action if triggered else "allow",
            message=f"Model drift detected: {drift_type} (magnitude={magnitude:.2f})" if triggered else None,
            latency_ms=round(elapsed, 2),
            details={"drift_type": drift_type, "magnitude": round(magnitude, 2), "window_size": self.window_size} if triggered else None,
        )


def model_drift_detect(*, action: str = "block", window_size: int = 20) -> _ModelDriftDetect:
    return _ModelDriftDetect(action=action, window_size=window_size)
