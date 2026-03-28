"""Detect retry abuse patterns including rapid retries."""
from __future__ import annotations

import time
from typing import Optional

from open_guardrail.core import GuardResult


class _RetryAbuse:
    def __init__(
        self,
        *,
        action: str = "block",
        max_retries: int = 5,
        window_ms: int = 10000,
    ) -> None:
        self.name = "retry-abuse"
        self.action = action
        self._max_retries = max_retries
        self._window_ms = window_ms
        self._log: dict[str, list[float]] = {}

    def check(
        self, text: str, stage: str = "input"
    ) -> GuardResult:
        start = time.perf_counter()
        now = time.time() * 1000
        key = text.strip()[:200]
        issues: list[str] = []

        timestamps = self._log.get(key, [])
        timestamps.append(now)
        cutoff = now - self._window_ms
        recent = [t for t in timestamps if t >= cutoff]
        self._log[key] = recent

        if len(recent) > self._max_retries:
            issues.append("max_retries_exceeded")

        if len(recent) >= 3:
            gaps = [
                recent[i] - recent[i - 1]
                for i in range(1, len(recent))
            ]
            if all(g < 100 for g in gaps):
                issues.append("identical_rapid_retries")
            if len(gaps) >= 3:
                increasing = all(
                    gaps[i] >= gaps[i - 1]
                    for i in range(1, len(gaps))
                )
                if not increasing and len(recent) > 3:
                    issues.append("backoff_violation")

        triggered = len(issues) > 0
        score = min(len(issues) / 2, 1.0) if triggered else 0.0
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="retry-abuse",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=score,
            message=(
                "Retry abuse detected"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {
                    "issues": issues,
                    "retry_count": len(recent),
                }
                if triggered
                else None
            ),
        )


def retry_abuse(
    *,
    action: str = "block",
    max_retries: int = 5,
    window_ms: int = 10000,
) -> _RetryAbuse:
    return _RetryAbuse(
        action=action,
        max_retries=max_retries,
        window_ms=window_ms,
    )
