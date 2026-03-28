"""Validate JSON responses for structure and constraints."""
from __future__ import annotations

import json
import time
from typing import List, Optional

from open_guardrail.core import GuardResult


def _measure_depth(obj: object, current: int = 0) -> int:
    if current > 100:
        return current
    if isinstance(obj, dict):
        if not obj:
            return current + 1
        return max(
            _measure_depth(v, current + 1)
            for v in obj.values()
        )
    if isinstance(obj, list):
        if not obj:
            return current + 1
        return max(
            _measure_depth(v, current + 1) for v in obj
        )
    return current


def _check_array_lengths(
    obj: object, max_len: int
) -> bool:
    if isinstance(obj, list):
        if len(obj) > max_len:
            return True
        return any(
            _check_array_lengths(item, max_len)
            for item in obj
        )
    if isinstance(obj, dict):
        return any(
            _check_array_lengths(v, max_len)
            for v in obj.values()
        )
    return False


class _ResponseFormatJson:
    def __init__(
        self,
        *,
        action: str = "block",
        max_depth: int = 10,
        max_array_length: int = 1000,
        required_fields: Optional[List[str]] = None,
    ) -> None:
        self.name = "response-format-json"
        self.action = action
        self._max_depth = max_depth
        self._max_array_len = max_array_length
        self._required = required_fields or []

    def check(
        self, text: str, stage: str = "output"
    ) -> GuardResult:
        start = time.perf_counter()
        issues: list[str] = []

        try:
            parsed = json.loads(text)
        except (json.JSONDecodeError, ValueError):
            elapsed = (time.perf_counter() - start) * 1000
            return GuardResult(
                guard_name="response-format-json",
                passed=False,
                action=self.action,
                score=1.0,
                message="Invalid JSON",
                latency_ms=round(elapsed, 2),
                details={"issues": ["invalid_json"]},
            )

        depth = _measure_depth(parsed)
        if depth > self._max_depth:
            issues.append(f"depth_exceeded:{depth}")

        if _check_array_lengths(parsed, self._max_array_len):
            issues.append("array_length_exceeded")

        if self._required and isinstance(parsed, dict):
            for field in self._required:
                if field not in parsed:
                    issues.append(f"missing_field:{field}")

        triggered = len(issues) > 0
        score = min(len(issues) / 3, 1.0) if triggered else 0.0
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="response-format-json",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=score,
            message=(
                "JSON format issue detected"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {"issues": issues} if triggered else None
            ),
        )


def response_format_json(
    *,
    action: str = "block",
    max_depth: int = 10,
    max_array_length: int = 1000,
    required_fields: Optional[List[str]] = None,
) -> _ResponseFormatJson:
    return _ResponseFormatJson(
        action=action,
        max_depth=max_depth,
        max_array_length=max_array_length,
        required_fields=required_fields,
    )
