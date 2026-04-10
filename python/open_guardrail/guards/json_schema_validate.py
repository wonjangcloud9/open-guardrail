"""Validate LLM JSON output against a schema with repair hints."""
from __future__ import annotations

import json
import re
import time
from typing import Dict, List, Optional

from open_guardrail.core import GuardResult


def _try_parse(text: str) -> tuple[object, list[str]] | None:
    issues: list[str] = []
    cleaned = text.strip()
    md = re.match(r"^```(?:json)?\s*\n?([\s\S]*?)\n?\s*```$", cleaned)
    if md:
        cleaned = md.group(1).strip()
        issues.append("wrapped-in-markdown-code-block")
    if not cleaned.startswith(("{", "[")):
        idx = next((i for i, c in enumerate(cleaned) if c in "{["), -1)
        if idx > 0:
            cleaned = cleaned[idx:]
            issues.append("extra-text-before-json")
    last = max(cleaned.rfind("}"), cleaned.rfind("]"))
    if last >= 0 and last < len(cleaned) - 1:
        cleaned = cleaned[: last + 1]
        issues.append("extra-text-after-json")
    try:
        return json.loads(cleaned), issues
    except json.JSONDecodeError:
        pass
    no_trail = re.sub(r",\s*([}\]])", r"\1", cleaned)
    if no_trail != cleaned:
        issues.append("trailing-commas")
    try:
        return json.loads(no_trail), issues
    except json.JSONDecodeError:
        pass
    dbl = no_trail.replace("'", '"')
    if dbl != no_trail:
        issues.append("single-quotes-instead-of-double")
    try:
        return json.loads(dbl), issues
    except json.JSONDecodeError:
        return None


class _JsonSchemaValidate:
    def __init__(
        self,
        *,
        action: str = "warn",
        expected_fields: Optional[List[str]] = None,
        expected_types: Optional[Dict[str, str]] = None,
    ) -> None:
        self.name = "json-schema-validate"
        self.action = action
        self.expected_fields = expected_fields or []
        self.expected_types = expected_types or {}

    def check(self, text: str, stage: str = "output") -> GuardResult:
        start = time.perf_counter()
        result = _try_parse(text)
        if result is None:
            elapsed = (time.perf_counter() - start) * 1000
            return GuardResult(
                guard_name="json-schema-validate",
                passed=False,
                action=self.action,
                message="Failed to parse as JSON",
                latency_ms=round(elapsed, 2),
                details={"repair_hints": ["Check JSON syntax"]},
            )
        obj, issues = result
        if isinstance(obj, dict):
            for f in self.expected_fields:
                if f not in obj:
                    issues.append(f"missing-field:{f}")
            for key, exp in self.expected_types.items():
                if key in obj:
                    val = obj[key]
                    actual = "array" if isinstance(val, list) else type(val).__name__
                    py_map = {"str": "string", "int": "number", "float": "number", "bool": "boolean", "NoneType": "null"}
                    actual_norm = py_map.get(actual, actual)
                    if actual_norm != exp:
                        issues.append(f"type-mismatch:{key}:expected={exp},actual={actual_norm}")
        triggered = len(issues) > 0
        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(
            guard_name="json-schema-validate",
            passed=not triggered,
            action=self.action if triggered else "allow",
            message=f"JSON issues: {', '.join(issues)}" if triggered else None,
            latency_ms=round(elapsed, 2),
            details={"issues": issues} if triggered else None,
        )


def json_schema_validate(
    *,
    action: str = "warn",
    expected_fields: Optional[List[str]] = None,
    expected_types: Optional[Dict[str, str]] = None,
) -> _JsonSchemaValidate:
    return _JsonSchemaValidate(action=action, expected_fields=expected_fields, expected_types=expected_types)
