"""Generate audit trail metadata."""

import time
from datetime import datetime, timezone

from open_guardrail.core import GuardResult


class _AuditTrail:
    def __init__(
        self,
        *,
        include_timestamp: bool = True,
        include_version: bool = True,
    ) -> None:
        self.name = "audit-trail"
        self._ts = include_timestamp
        self._ver = include_version

    def check(
        self, text: str, stage: str = "output"
    ) -> GuardResult:
        start = time.perf_counter()
        words = text.split()
        details: dict = {
            "char_count": len(text),
            "word_count": len(words),
        }

        if self._ts:
            details["timestamp"] = (
                datetime.now(timezone.utc).isoformat()
            )
        if self._ver:
            details["guard_version"] = "0.1.0"

        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="audit-trail",
            passed=True,
            action="allow",
            score=0.0,
            message=None,
            latency_ms=round(elapsed, 2),
            details=details,
        )


def audit_trail(
    *,
    include_timestamp: bool = True,
    include_version: bool = True,
) -> _AuditTrail:
    return _AuditTrail(
        include_timestamp=include_timestamp,
        include_version=include_version,
    )
