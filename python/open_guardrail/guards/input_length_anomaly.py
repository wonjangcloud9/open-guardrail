"""Input length anomaly detection guard."""

import time

from open_guardrail.core import GuardResult


class _InputLengthAnomaly:
    def __init__(
        self,
        *,
        action: str = "block",
        min_length: int = 3,
        max_length: int = 50000,
    ) -> None:
        self.name = "input-length-anomaly"
        self.action = action
        self._min = min_length
        self._max = max_length

    def check(
        self, text: str, stage: str = "input"
    ) -> GuardResult:
        start = time.perf_counter()
        issues: list[str] = []
        length = len(text)

        if length < self._min:
            issues.append("too-short")
        if length > self._max:
            issues.append("too-long")

        triggered = len(issues) > 0
        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(
            guard_name="input-length-anomaly",
            passed=not triggered,
            action=self.action if triggered else "allow",
            message=(
                f"Input length anomaly: {', '.join(issues)}"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {
                    "issues": issues,
                    "length": length,
                    "min_length": self._min,
                    "max_length": self._max,
                }
                if triggered
                else None
            ),
        )


def input_length_anomaly(
    *,
    action: str = "block",
    min_length: int = 3,
    max_length: int = 50000,
) -> _InputLengthAnomaly:
    return _InputLengthAnomaly(
        action=action,
        min_length=min_length,
        max_length=max_length,
    )
