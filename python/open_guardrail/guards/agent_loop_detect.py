"""Detects repetitive loop patterns in agent conversations."""

import time
from typing import List, Optional

from open_guardrail.core import GuardResult


def _trigram_similarity(a: str, b: str) -> float:
    if a == b:
        return 1.0
    if len(a) < 3 or len(b) < 3:
        return 1.0 if a == b else 0.0
    ta = {a[i : i + 3] for i in range(len(a) - 2)}
    tb = {b[i : i + 3] for i in range(len(b) - 2)}
    intersection = len(ta & tb)
    return (2 * intersection) / (len(ta) + len(tb))


class _AgentLoopDetect:
    def __init__(
        self,
        *,
        action: str = "block",
        max_repetitions: int = 3,
        similarity_threshold: float = 0.8,
        window_size: int = 10,
    ) -> None:
        self.name = "agent-loop-detect"
        self.action = action
        self.max_reps = max_repetitions
        self.threshold = similarity_threshold
        self.window_size = window_size
        self._history: List[str] = []

    def check(self, text: str, stage: str = "input") -> GuardResult:
        start = time.perf_counter()
        normalized = " ".join(text.lower().split())
        similar = sum(
            1
            for prev in self._history
            if _trigram_similarity(normalized, prev) >= self.threshold
        )
        self._history.append(normalized)
        if len(self._history) > self.window_size:
            self._history.pop(0)
        triggered = similar >= self.max_reps
        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(
            guard_name="agent-loop-detect",
            passed=not triggered,
            action=self.action if triggered else "allow",
            message=f"Loop detected: {similar} similar messages" if triggered else None,
            latency_ms=round(elapsed, 2),
            details={"similar_count": similar, "max_repetitions": self.max_reps} if triggered else None,
        )


def agent_loop_detect(
    *,
    action: str = "block",
    max_repetitions: int = 3,
    similarity_threshold: float = 0.8,
    window_size: int = 10,
) -> _AgentLoopDetect:
    return _AgentLoopDetect(
        action=action,
        max_repetitions=max_repetitions,
        similarity_threshold=similarity_threshold,
        window_size=window_size,
    )
