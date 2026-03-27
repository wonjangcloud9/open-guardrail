"""Detect JSON schema drift from expected keys."""

import json
import time
from typing import List

from open_guardrail.core import GuardResult


class _SchemaDrift:
    def __init__(
        self,
        *,
        action: str = "warn",
        expected_keys: List[str] | None = None,
        allow_extra: bool = False,
    ) -> None:
        self.name = "schema-drift"
        self.action = action
        self.expected_keys = set(expected_keys or [])
        self.allow_extra = allow_extra

    def check(
        self, text: str, stage: str = "output"
    ) -> GuardResult:
        start = time.perf_counter()

        try:
            data = json.loads(text)
        except (json.JSONDecodeError, TypeError):
            elapsed = (time.perf_counter() - start) * 1000
            return GuardResult(
                guard_name="schema-drift",
                passed=False,
                action=self.action,
                message="Invalid JSON",
                latency_ms=round(elapsed, 2),
            )

        if not isinstance(data, dict):
            elapsed = (time.perf_counter() - start) * 1000
            return GuardResult(
                guard_name="schema-drift",
                passed=False,
                action=self.action,
                message="JSON root is not an object",
                latency_ms=round(elapsed, 2),
            )

        actual = set(data.keys())
        missing = self.expected_keys - actual
        extra = actual - self.expected_keys

        triggered = bool(missing)
        if not self.allow_extra and extra:
            triggered = True

        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="schema-drift",
            passed=not triggered,
            action=self.action if triggered else "allow",
            message=(
                "Schema drift detected"
                if triggered else None
            ),
            latency_ms=round(elapsed, 2),
            details={
                "missing": sorted(missing),
                "extra": sorted(extra),
            } if triggered else None,
        )


def schema_drift(
    *,
    action: str = "warn",
    expected_keys: List[str] | None = None,
    allow_extra: bool = False,
) -> _SchemaDrift:
    return _SchemaDrift(
        action=action,
        expected_keys=expected_keys,
        allow_extra=allow_extra,
    )
