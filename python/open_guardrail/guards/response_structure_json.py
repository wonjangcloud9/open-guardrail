"""Validate expected JSON structure in responses."""
from __future__ import annotations

import json
import time
from typing import List, Optional

from open_guardrail.core import GuardResult


class _ResponseStructureJson:
    def __init__(
        self,
        *,
        action: str = "block",
        required_keys: Optional[List[str]] = None,
    ) -> None:
        self.name = "response-structure-json"
        self.action = action
        self._required = required_keys or []

    def check(
        self, text: str, stage: str = "output"
    ) -> GuardResult:
        start = time.perf_counter()
        issues: list[str] = []

        try:
            parsed = json.loads(text.strip())
        except (json.JSONDecodeError, ValueError):
            issues.append("invalid-json")
            elapsed = (
                time.perf_counter() - start
            ) * 1000
            return GuardResult(
                guard_name=(
                    "response-structure-json"
                ),
                passed=False,
                action=self.action,
                score=1.0,
                message="Invalid JSON",
                latency_ms=round(elapsed, 2),
                details={"issues": issues},
            )

        if not isinstance(parsed, dict):
            issues.append("not-object")
        else:
            for key in self._required:
                if key not in parsed:
                    issues.append(
                        f"missing-key:{key}"
                    )
                elif parsed[key] is None:
                    issues.append(
                        f"null-value:{key}"
                    )

        triggered = len(issues) > 0
        denom = len(self._required) or 1
        score = (
            min(len(issues) / denom, 1.0)
            if triggered
            else 0.0
        )
        elapsed = (
            time.perf_counter() - start
        ) * 1000

        return GuardResult(
            guard_name="response-structure-json",
            passed=not triggered,
            action=(
                self.action if triggered else "allow"
            ),
            score=score,
            message=(
                "JSON structure invalid"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {"issues": issues}
                if triggered
                else None
            ),
        )


def response_structure_json(
    *,
    action: str = "block",
    required_keys: Optional[List[str]] = None,
) -> _ResponseStructureJson:
    return _ResponseStructureJson(
        action=action,
        required_keys=required_keys,
    )
