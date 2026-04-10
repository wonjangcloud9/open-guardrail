"""Validates tool outputs against expected schemas and types."""
from __future__ import annotations

import json
import time
from typing import Dict, List, Optional

from open_guardrail.core import GuardResult


class _ToolOutputSchema:
    def __init__(
        self,
        *,
        action: str = "block",
        expected_fields: Optional[List[str]] = None,
        expected_types: Optional[Dict[str, str]] = None,
    ) -> None:
        self.name = "tool-output-schema"
        self.action = action
        self.expected_fields = expected_fields or []
        self.expected_types = expected_types or {}

    def check(self, text: str, stage: str = "output") -> GuardResult:
        start = time.perf_counter()
        missing_fields: List[str] = []
        type_mismatches: List[str] = []
        parsed = None

        try:
            parsed = json.loads(text)
        except (json.JSONDecodeError, ValueError):
            lower = text.lower()
            for field in self.expected_fields:
                if field.lower() not in lower:
                    missing_fields.append(field)

        if isinstance(parsed, dict):
            for field in self.expected_fields:
                if field not in parsed:
                    missing_fields.append(field)
            for field, expected_type in self.expected_types.items():
                if field in parsed:
                    actual = type(parsed[field]).__name__
                    mapped = {"str": "string", "int": "number", "float": "number", "bool": "boolean", "list": "array", "NoneType": "null"}
                    actual_mapped = mapped.get(actual, actual)
                    if actual_mapped != expected_type:
                        type_mismatches.append(f"{field}: expected {expected_type}, got {actual_mapped}")

        triggered = len(missing_fields) > 0 or len(type_mismatches) > 0
        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(
            guard_name="tool-output-schema",
            passed=not triggered,
            action=self.action if triggered else "allow",
            message=f"Schema violations: {len(missing_fields)} missing, {len(type_mismatches)} type errors" if triggered else None,
            latency_ms=round(elapsed, 2),
            details={"missing_fields": missing_fields, "type_mismatches": type_mismatches} if triggered else None,
        )


def tool_output_schema(
    *,
    action: str = "block",
    expected_fields: Optional[List[str]] = None,
    expected_types: Optional[Dict[str, str]] = None,
) -> _ToolOutputSchema:
    return _ToolOutputSchema(
        action=action,
        expected_fields=expected_fields,
        expected_types=expected_types,
    )
