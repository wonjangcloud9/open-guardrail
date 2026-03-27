"""Validates structured JSON output against field rules."""

import json
import time
from typing import Any, Dict, List, Optional

from open_guardrail.core import GuardResult


def _validate_field(value: Any, rule: dict) -> Optional[str]:
    field = rule["field"]
    if value is None:
        return f"Missing required field: {field}" if rule.get("required") else None
    expected_type = rule.get("type")
    if expected_type:
        type_map = {"string": str, "number": (int, float), "boolean": bool, "array": list, "object": dict}
        if expected_type in type_map and not isinstance(value, type_map[expected_type]):
            return f"{field}: expected {expected_type}, got {type(value).__name__}"
    if isinstance(value, str):
        if "min_length" in rule and len(value) < rule["min_length"]:
            return f"{field}: too short ({len(value)} < {rule['min_length']})"
        if "max_length" in rule and len(value) > rule["max_length"]:
            return f"{field}: too long ({len(value)} > {rule['max_length']})"
    if "enum" in rule and value not in rule["enum"]:
        return f"{field}: not in allowed values"
    return None


class _StructuredOutput:
    def __init__(self, *, action: str = "block", fields: List[dict], allow_extra: bool = True) -> None:
        self.name = "structured-output"
        self.action = action
        self.fields = fields
        self.allow_extra = allow_extra

    def check(self, text: str, stage: str = "output") -> GuardResult:
        start = time.perf_counter()
        try:
            parsed = json.loads(text.strip())
        except json.JSONDecodeError as e:
            elapsed = (time.perf_counter() - start) * 1000
            return GuardResult(guard_name="structured-output", passed=False, action=self.action, message=f"Invalid JSON: {e}", latency_ms=round(elapsed, 2), details={"reason": "Invalid JSON"})
        if not isinstance(parsed, dict):
            elapsed = (time.perf_counter() - start) * 1000
            return GuardResult(guard_name="structured-output", passed=False, action=self.action, message="Expected JSON object", latency_ms=round(elapsed, 2))
        violations: List[str] = []
        for rule in self.fields:
            error = _validate_field(parsed.get(rule["field"]), rule)
            if error:
                violations.append(error)
        if not self.allow_extra:
            allowed = {r["field"] for r in self.fields}
            for key in parsed:
                if key not in allowed:
                    violations.append(f"Unexpected field: {key}")
        triggered = len(violations) > 0
        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(guard_name="structured-output", passed=not triggered, action=self.action if triggered else "allow", message="; ".join(violations) if triggered else None, latency_ms=round(elapsed, 2), details={"violations": violations} if triggered else None)


def structured_output(*, action: str = "block", fields: List[dict], allow_extra: bool = True) -> _StructuredOutput:
    return _StructuredOutput(action=action, fields=fields, allow_extra=allow_extra)
