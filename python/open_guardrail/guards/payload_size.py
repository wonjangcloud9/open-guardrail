"""Check payload byte size."""
from __future__ import annotations

import time

from open_guardrail.core import GuardResult


class _PayloadSize:
    def __init__(
        self,
        *,
        action: str = "block",
        max_bytes: int = 1000000,
    ) -> None:
        self.name = "payload-size"
        self.action = action
        self._max_bytes = max_bytes

    def check(
        self, text: str, stage: str = "input"
    ) -> GuardResult:
        start = time.perf_counter()
        byte_size = len(text.encode("utf-8"))
        triggered = byte_size > self._max_bytes
        elapsed = (
            time.perf_counter() - start
        ) * 1000

        if not triggered:
            return GuardResult(
                guard_name="payload-size",
                passed=True,
                action="allow",
                latency_ms=round(elapsed, 2),
            )

        return GuardResult(
            guard_name="payload-size",
            passed=False,
            action=self.action,
            message=(
                f"Payload too large:"
                f" {byte_size} >"
                f" {self._max_bytes} bytes"
            ),
            latency_ms=round(elapsed, 2),
            details={
                "byte_size": byte_size,
                "max_bytes": self._max_bytes,
                "reason": (
                    "Payload exceeds maximum"
                    " byte size limit"
                ),
            },
        )


def payload_size(
    *,
    action: str = "block",
    max_bytes: int = 1000000,
) -> _PayloadSize:
    return _PayloadSize(
        action=action,
        max_bytes=max_bytes,
    )
