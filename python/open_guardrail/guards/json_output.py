"""Validates JSON output format."""
from __future__ import annotations

import json
import time
from typing import Optional

from open_guardrail.core import GuardResult


class _JsonOutput:
    def __init__(self, *, action: str = "block", require_object: bool = False) -> None:
        self.name = "json-output"
        self.action = action
        self.require_object = require_object

    def check(self, text: str, stage: str = "output") -> GuardResult:
        start = time.perf_counter()
        stripped = text.strip()
        triggered = False
        reason: Optional[str] = None
        try:
            parsed = json.loads(stripped)
            if self.require_object and not isinstance(parsed, dict):
                triggered = True
                reason = f"Expected object, got {type(parsed).__name__}"
        except json.JSONDecodeError as e:
            triggered = True
            reason = f"Invalid JSON: {str(e)[:80]}"
        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(
            guard_name="json-output",
            passed=not triggered,
            action=self.action if triggered else "allow",
            message=reason,
            latency_ms=round(elapsed, 2),
            details={"reason": reason} if triggered else None,
        )


def json_output(*, action: str = "block", require_object: bool = False) -> _JsonOutput:
    return _JsonOutput(action=action, require_object=require_object)
