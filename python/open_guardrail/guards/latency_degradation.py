"""Monitor and flag guard pipeline latency degradation."""
from __future__ import annotations

import time
from typing import List, Optional

from open_guardrail.core import GuardResult


class _LatencyDegradation:
    def __init__(self, *, action: str = "block", max_latency_ms: float = 100, window_size: int = 50) -> None:
        self.name = "latency-degradation"
        self.action = action
        self.max_latency_ms = max_latency_ms
        self.window_size = window_size
        self._latencies: List[float] = []

    def check(self, text: str, stage: str = "output") -> GuardResult:
        start = time.perf_counter()

        _len = len(text)  # simulate minimal processing

        elapsed = (time.perf_counter() - start) * 1000
        warming = len(self._latencies) < self.window_size

        triggered = False
        reason: Optional[str] = None

        avg = sum(self._latencies) / len(self._latencies) if self._latencies else 0.0

        if not warming:
            if elapsed > self.max_latency_ms:
                triggered = True
                reason = "max_latency_exceeded"

            if len(self._latencies) >= 5:
                last5 = self._latencies[-5:]
                if all(l > avg * 2 for l in last5):
                    triggered = True
                    reason = "max_exceeded_and_trend" if reason else "trend_degradation"

        self._latencies.append(elapsed)
        if len(self._latencies) > self.window_size:
            self._latencies.pop(0)

        sorted_lat = sorted(self._latencies)
        p95_idx = min(int(len(sorted_lat) * 0.95), len(sorted_lat) - 1)
        p95 = sorted_lat[p95_idx] if sorted_lat else 0.0

        total_elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(
            guard_name="latency-degradation",
            passed=not triggered,
            action=self.action if triggered else "allow",
            message=f"Latency degradation: {reason} ({elapsed:.2f}ms vs avg {avg:.2f}ms)" if triggered else None,
            latency_ms=round(total_elapsed, 2),
            details={
                "reason": reason,
                "current_latency_ms": round(elapsed, 2),
                "average_latency_ms": round(avg, 2),
                "p95_latency_ms": round(p95, 2),
                "max_latency_ms": self.max_latency_ms,
            } if triggered else None,
        )


def latency_degradation(*, action: str = "block", max_latency_ms: float = 100, window_size: int = 50) -> _LatencyDegradation:
    return _LatencyDegradation(action=action, max_latency_ms=max_latency_ms, window_size=window_size)
