"""Validate API response patterns."""

from __future__ import annotations

import json
import time
from typing import List

from open_guardrail.core import GuardResult

_ERROR_PATTERNS = [
    "500 internal server",
    "timeout",
    "econnrefused",
    "stack trace",
    "traceback (most recent",
    "errno",
    "502 bad gateway",
    "503 service unavailable",
    "connection refused",
]


class _ApiResponseValidate:
    def __init__(
        self,
        *,
        action: str = "warn",
        block_errors: bool = True,
        require_fields: List[str] | None = None,
    ) -> None:
        self.name = "api-response-validate"
        self.action = action
        self.block_errors = block_errors
        self.require_fields = require_fields or []

    def check(
        self, text: str, stage: str = "output"
    ) -> GuardResult:
        start = time.perf_counter()
        reasons: list[str] = []
        lower = text.lower()

        if self.block_errors:
            found = [
                p for p in _ERROR_PATTERNS if p in lower
            ]
            if found:
                reasons.append("error-patterns")

        if self.require_fields:
            try:
                data = json.loads(text)
                if isinstance(data, dict):
                    missing = [
                        f for f in self.require_fields
                        if f not in data
                    ]
                    if missing:
                        reasons.append("missing-fields")
            except (json.JSONDecodeError, TypeError):
                reasons.append("invalid-json")

        triggered = len(reasons) > 0
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="api-response-validate",
            passed=not triggered,
            action=self.action if triggered else "allow",
            message=(
                f"API response issues: {', '.join(reasons)}"
                if triggered else None
            ),
            latency_ms=round(elapsed, 2),
            details={
                "reasons": reasons,
            } if triggered else None,
        )


def api_response_validate(
    *,
    action: str = "warn",
    block_errors: bool = True,
    require_fields: List[str] | None = None,
) -> _ApiResponseValidate:
    return _ApiResponseValidate(
        action=action,
        block_errors=block_errors,
        require_fields=require_fields,
    )
