"""Validates function-call JSON against a schema of required params and types."""
from __future__ import annotations

import json
import re
import time
from typing import Any, Dict, List, Optional

from open_guardrail.core import GuardResult


class _FunctionCallSchema:
    def __init__(
        self,
        *,
        action: str = "block",
        schemas: Optional[Dict[str, Dict[str, str]]] = None,
    ) -> None:
        self.name = "function-call-schema"
        self.action = action
        self.schemas = schemas or {}

    def check(self, text: str, stage: str = "input") -> GuardResult:
        start = time.perf_counter()
        errors: List[str] = []
        call_pattern = re.compile(
            r'\{\s*"name"\s*:\s*"[^"]+"\s*,\s*"arguments"\s*:\s*\{[^}]*\}\s*\}'
        )
        matches = call_pattern.findall(text)
        for raw in matches:
            try:
                obj = json.loads(raw)
            except json.JSONDecodeError:
                errors.append(f"Invalid JSON: {raw[:40]}...")
                continue
            fn_name = obj.get("name", "")
            args = obj.get("arguments", {})
            if fn_name in self.schemas:
                schema = self.schemas[fn_name]
                for param, expected_type in schema.items():
                    if param not in args:
                        errors.append(f"{fn_name}: missing required param '{param}'")
                    elif expected_type == "str" and not isinstance(args[param], str):
                        errors.append(f"{fn_name}: '{param}' must be str")
                    elif expected_type == "int" and not isinstance(args[param], int):
                        errors.append(f"{fn_name}: '{param}' must be int")
                    elif expected_type == "float" and not isinstance(args[param], (int, float)):
                        errors.append(f"{fn_name}: '{param}' must be float")
                    elif expected_type == "bool" and not isinstance(args[param], bool):
                        errors.append(f"{fn_name}: '{param}' must be bool")
        triggered = len(errors) > 0
        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(
            guard_name="function-call-schema",
            passed=not triggered,
            action=self.action if triggered else "allow",
            message=f"Schema errors: {'; '.join(errors)}" if triggered else None,
            latency_ms=round(elapsed, 2),
            details={"errors": errors} if triggered else None,
        )


def function_call_schema(
    *,
    action: str = "block",
    schemas: Optional[Dict[str, Dict[str, str]]] = None,
) -> _FunctionCallSchema:
    return _FunctionCallSchema(action=action, schemas=schemas)
