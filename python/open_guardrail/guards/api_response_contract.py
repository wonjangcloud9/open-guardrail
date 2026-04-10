"""Validate structured API responses match expected contract."""
from __future__ import annotations

import json
import time
from typing import List, Optional

from open_guardrail.core import GuardResult

_SENSITIVE = ["password", "secret", "token", "api_key", "apikey", "private_key"]
_MAX_LEN = 10000


class _ApiResponseContract:
    def __init__(self, *, action: str = "warn", required_fields: Optional[List[str]] = None) -> None:
        self.name = "api-response-contract"
        self.action = action
        self.required_fields = required_fields or []

    def check(self, text: str, stage: str = "output") -> GuardResult:
        start = time.perf_counter()
        try:
            parsed = json.loads(text.strip())
        except (json.JSONDecodeError, ValueError):
            elapsed = (time.perf_counter() - start) * 1000
            return GuardResult(
                guard_name="api-response-contract",
                passed=True,
                action="allow",
                latency_ms=round(elapsed, 2),
            )
        if not isinstance(parsed, dict):
            elapsed = (time.perf_counter() - start) * 1000
            return GuardResult(
                guard_name="api-response-contract",
                passed=True,
                action="allow",
                latency_ms=round(elapsed, 2),
            )
        issues: list[str] = []
        if not any(k in parsed for k in ("status", "data", "result")):
            issues.append("missing-status-or-data-field")
        for f in self.required_fields:
            if f not in parsed:
                issues.append(f"missing-required:{f}")
            elif parsed[f] is None:
                issues.append(f"null-required:{f}")
        for key, val in parsed.items():
            if any(s in key.lower() for s in _SENSITIVE):
                issues.append(f"sensitive-key:{key}")
            if isinstance(val, str) and len(val) > _MAX_LEN:
                issues.append(f"oversized-field:{key}")
        triggered = len(issues) > 0
        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(
            guard_name="api-response-contract",
            passed=not triggered,
            action=self.action if triggered else "allow",
            message=f"API contract issues: {', '.join(issues)}" if triggered else None,
            latency_ms=round(elapsed, 2),
            details={"issues": issues} if triggered else None,
        )


def api_response_contract(*, action: str = "warn", required_fields: Optional[List[str]] = None) -> _ApiResponseContract:
    return _ApiResponseContract(action=action, required_fields=required_fields)
