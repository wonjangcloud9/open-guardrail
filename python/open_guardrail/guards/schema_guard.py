"""Validate JSON against a simple schema."""

from __future__ import annotations

import json
import time
from typing import List

from open_guardrail.core import GuardResult


class _SchemaGuard:
    def __init__(
        self,
        *,
        action: str = "block",
        required_keys: List[str],
        optional_keys: List[str] | None = None,
    ) -> None:
        self.name = "schema-guard"
        self.action = action
        self._required = required_keys
        self._optional = optional_keys or []

    def check(
        self, text: str, stage: str = "output"
    ) -> GuardResult:
        start = time.perf_counter()

        try:
            data = json.loads(text.strip())
        except (json.JSONDecodeError, TypeError):
            elapsed = (
                time.perf_counter() - start
            ) * 1000
            return GuardResult(
                guard_name="schema-guard",
                passed=False,
                action=self.action,
                message="Invalid JSON",
                latency_ms=round(elapsed, 2),
            )

        if not isinstance(data, dict):
            elapsed = (
                time.perf_counter() - start
            ) * 1000
            return GuardResult(
                guard_name="schema-guard",
                passed=False,
                action=self.action,
                message="JSON root is not an object",
                latency_ms=round(elapsed, 2),
            )

        missing = [
            k
            for k in self._required
            if k not in data
        ]
        allowed = set(self._required) | set(
            self._optional
        )
        extra = [
            k for k in data if k not in allowed
        ]

        triggered = len(missing) > 0
        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(
            guard_name="schema-guard",
            passed=not triggered,
            action=(
                self.action if triggered else "allow"
            ),
            message=(
                "Missing keys: " + ", ".join(missing)
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {
                    "missing": missing,
                    "extra": extra,
                }
                if triggered or extra
                else None
            ),
        )


def schema_guard(
    *,
    action: str = "block",
    required_keys: List[str],
    optional_keys: List[str] | None = None,
) -> _SchemaGuard:
    return _SchemaGuard(
        action=action,
        required_keys=required_keys,
        optional_keys=optional_keys or [],
    )
