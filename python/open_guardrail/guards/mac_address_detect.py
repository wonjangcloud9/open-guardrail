"""Detect MAC addresses."""
from __future__ import annotations

import re
import time

from open_guardrail.core import GuardResult

_MAC_PATTERN = re.compile(
    r"\b(?:[0-9A-Fa-f]{2}[:-]){5}"
    r"[0-9A-Fa-f]{2}\b"
)


class _MacAddressDetect:
    def __init__(
        self, *, action: str = "block"
    ) -> None:
        self.name = "mac-address-detect"
        self.action = action

    def check(
        self, text: str, stage: str = "input"
    ) -> GuardResult:
        start = time.perf_counter()
        matches = _MAC_PATTERN.findall(text)
        triggered = len(matches) > 0
        score = (
            min(len(matches) / 2, 1.0)
            if triggered
            else 0.0
        )
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="mac-address-detect",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=score,
            message=(
                "MAC address detected"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {"mac_count": len(matches)}
                if triggered
                else None
            ),
        )


def mac_address_detect(
    *, action: str = "block"
) -> _MacAddressDetect:
    return _MacAddressDetect(action=action)
