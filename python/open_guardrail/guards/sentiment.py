"""Simple keyword-based sentiment analysis guard."""
from __future__ import annotations

import time
from typing import List, Optional

from open_guardrail.core import GuardResult

_POSITIVE = {
    "good", "great", "excellent", "amazing", "wonderful", "fantastic",
    "happy", "love", "best", "perfect", "awesome", "brilliant",
    "beautiful", "outstanding", "superb", "magnificent", "delightful",
}

_NEGATIVE = {
    "bad", "terrible", "awful", "horrible", "hate", "worst",
    "ugly", "stupid", "dumb", "disgusting", "pathetic", "trash",
    "garbage", "useless", "hopeless", "miserable", "dreadful",
}


class _Sentiment:
    def __init__(
        self, *, action: str = "warn", block_negative: bool = True, min_score: float = -0.5,
    ) -> None:
        self.name = "sentiment"
        self.action = action
        self.block_negative = block_negative
        self.min_score = min_score

    def check(self, text: str, stage: str = "output") -> GuardResult:
        start = time.perf_counter()
        words = text.lower().split()
        pos = sum(1 for w in words if w.strip(".,!?;:") in _POSITIVE)
        neg = sum(1 for w in words if w.strip(".,!?;:") in _NEGATIVE)
        total = pos + neg
        score = (pos - neg) / max(total, 1)
        triggered = self.block_negative and score < self.min_score
        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(
            guard_name="sentiment",
            passed=not triggered,
            action=self.action if triggered else "allow",
            message=f"Negative sentiment (score: {score:.2f})" if triggered else None,
            score=round((score + 1) / 2, 2),
            latency_ms=round(elapsed, 2),
            details={"positive": pos, "negative": neg, "raw_score": round(score, 2)} if total > 0 else None,
        )


def sentiment(
    *, action: str = "warn", block_negative: bool = True, min_score: float = -0.5,
) -> _Sentiment:
    return _Sentiment(action=action, block_negative=block_negative, min_score=min_score)
