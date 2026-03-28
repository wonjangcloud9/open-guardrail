"""Detect vehicle identification numbers and plates."""
from __future__ import annotations

import re
import time

from open_guardrail.core import GuardResult

_VIN_PATTERN = re.compile(
    r"\b[A-HJ-NPR-Z0-9]{17}\b"
)
_US_PLATE = re.compile(
    r"\b[A-Z]{1,3}\s?\d{1,4}\s?[A-Z]{0,3}\b"
)
_EU_PLATE = re.compile(
    r"\b[A-Z]{1,3}\s?-?\s?\d{1,4}"
    r"\s?-?\s?[A-Z]{1,3}\b"
)


class _VehicleIdDetect:
    def __init__(
        self, *, action: str = "block"
    ) -> None:
        self.name = "vehicle-id-detect"
        self.action = action

    def check(
        self, text: str, stage: str = "input"
    ) -> GuardResult:
        start = time.perf_counter()
        vins = _VIN_PATTERN.findall(text)
        vin_count = len(vins)
        triggered = vin_count > 0
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="vehicle-id-detect",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=(
                min(vin_count / 2, 1.0)
                if triggered
                else 0.0
            ),
            message=(
                "Vehicle ID detected"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {"vin_count": vin_count}
                if triggered
                else None
            ),
        )


def vehicle_id_detect(
    *, action: str = "block"
) -> _VehicleIdDetect:
    return _VehicleIdDetect(action=action)
