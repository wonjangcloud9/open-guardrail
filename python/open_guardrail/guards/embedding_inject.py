"""Detect embedding injection attacks."""

import math
import re
import time

from open_guardrail.core import GuardResult

_REPEAT_RE = re.compile(r"(\b\w+\b)(?:\s+\1){9,}")


def _entropy(text: str) -> float:
    if not text:
        return 0.0
    freq: dict[str, int] = {}
    for ch in text:
        freq[ch] = freq.get(ch, 0) + 1
    length = len(text)
    return -sum(
        (c / length) * math.log2(c / length)
        for c in freq.values()
    )


class _EmbeddingInject:
    def __init__(self, *, action: str = "warn") -> None:
        self.name = "embedding-inject"
        self.action = action

    def check(
        self, text: str, stage: str = "input"
    ) -> GuardResult:
        start = time.perf_counter()
        reasons: list[str] = []

        if _REPEAT_RE.search(text):
            reasons.append("repeated-tokens")

        if len(text) > 100:
            chunks = [
                text[i: i + 50]
                for i in range(0, len(text), 50)
            ]
            for chunk in chunks:
                e = _entropy(chunk)
                if e > 6.0:
                    reasons.append("high-entropy-segment")
                    break

        words = text.split()
        if len(words) > 50:
            unique = set(words)
            ratio = len(unique) / len(words)
            if ratio < 0.05:
                reasons.append("low-diversity")

        triggered = len(reasons) > 0
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="embedding-inject",
            passed=not triggered,
            action=self.action if triggered else "allow",
            message=(
                "Embedding injection patterns detected"
                if triggered else None
            ),
            latency_ms=round(elapsed, 2),
            details={
                "reasons": reasons,
            } if triggered else None,
        )


def embedding_inject(
    *, action: str = "warn",
) -> _EmbeddingInject:
    return _EmbeddingInject(action=action)
