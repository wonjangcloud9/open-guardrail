"""Detect data poisoning / model manipulation attempts."""

import time

from open_guardrail.core import GuardResult

_PATTERNS = [
    "training data", "fine-tune on", "fine tune on",
    "inject into model", "backdoor", "trigger phrase",
    "adversarial example", "poison the model",
    "corrupt the dataset", "manipulate training",
]


class _DataPoisoning:
    def __init__(self, *, action: str = "block") -> None:
        self.name = "data-poisoning"
        self.action = action

    def check(
        self, text: str, stage: str = "input"
    ) -> GuardResult:
        start = time.perf_counter()
        lower = text.lower()
        matched = [
            p for p in _PATTERNS if p in lower
        ]
        triggered = len(matched) > 0
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="data-poisoning",
            passed=not triggered,
            action=self.action if triggered else "allow",
            message=(
                "Data poisoning attempt detected"
                if triggered else None
            ),
            latency_ms=round(elapsed, 2),
            details={
                "matched": matched,
            } if triggered else None,
        )


def data_poisoning(
    *, action: str = "block",
) -> _DataPoisoning:
    return _DataPoisoning(action=action)
