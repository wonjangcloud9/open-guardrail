"""Validate numeric accuracy against known facts."""

from __future__ import annotations

import re
import time
from typing import Dict

from open_guardrail.core import GuardResult

_NUM_RE = re.compile(r"[\d,]+\.?\d*")


class _NumericAccuracy:
    def __init__(
        self,
        *,
        action: str = "warn",
        facts: Dict[str, float] | None = None,
        tolerance: float = 0.1,
    ) -> None:
        self.name = "numeric-accuracy"
        self.action = action
        self.facts = facts or {}
        self.tolerance = tolerance

    def check(
        self, text: str, stage: str = "output"
    ) -> GuardResult:
        start = time.perf_counter()
        mismatches: list[dict] = []
        lower = text.lower()

        for label, expected in self.facts.items():
            idx = lower.find(label.lower())
            if idx < 0:
                continue
            after = text[idx + len(label): idx + len(label) + 50]
            nums = _NUM_RE.findall(after)
            for raw in nums:
                try:
                    val = float(raw.replace(",", ""))
                except ValueError:
                    continue
                diff = abs(val - expected)
                if expected != 0:
                    rel = diff / abs(expected)
                else:
                    rel = diff
                if rel > self.tolerance:
                    mismatches.append({
                        "label": label,
                        "expected": expected,
                        "found": val,
                        "rel_error": round(rel, 4),
                    })
                break

        triggered = len(mismatches) > 0
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="numeric-accuracy",
            passed=not triggered,
            action=self.action if triggered else "allow",
            message=(
                f"{len(mismatches)} numeric mismatch(es)"
                if triggered else None
            ),
            latency_ms=round(elapsed, 2),
            details={
                "mismatches": mismatches,
            } if triggered else None,
        )


def numeric_accuracy(
    *,
    action: str = "warn",
    facts: Dict[str, float] | None = None,
    tolerance: float = 0.1,
) -> _NumericAccuracy:
    return _NumericAccuracy(
        action=action, facts=facts, tolerance=tolerance,
    )
