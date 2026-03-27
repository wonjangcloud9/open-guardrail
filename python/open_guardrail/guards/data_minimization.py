"""Detects unnecessary internal data leaks such as IDs, debug info, and server internals."""

import re
import time
from typing import List

from open_guardrail.core import GuardResult

_PATTERNS = [
    ("internal_id", re.compile(r"internal_id\s*:", re.IGNORECASE)),
    ("object_id", re.compile(r"object_id\s*:", re.IGNORECASE)),
    ("hex_id", re.compile(r"\b[0-9a-f]{24}\b")),
    ("stack_trace", re.compile(r"stack\s+trace", re.IGNORECASE)),
    ("file_line", re.compile(r"\b\w+\.\w+:\d+\b")),
    ("server_name", re.compile(r"server_name\s*:", re.IGNORECASE)),
    ("request_id", re.compile(r"x-request-id\s*:", re.IGNORECASE)),
]


class _DataMinimization:
    def __init__(self, *, action: str = "warn") -> None:
        self.name = "data-minimization"
        self.action = action

    def check(self, text: str, stage: str = "input") -> GuardResult:
        start = time.perf_counter()
        matched: List[str] = []
        for label, p in _PATTERNS:
            if p.search(text):
                matched.append(label)
        triggered = len(matched) > 0
        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(
            guard_name="data-minimization",
            passed=not triggered,
            action=self.action if triggered else "allow",
            message=f"Unnecessary data detected: {', '.join(matched)}" if triggered else None,
            latency_ms=round(elapsed, 2),
            details={"categories": matched} if triggered else None,
        )


def data_minimization(*, action: str = "warn") -> _DataMinimization:
    return _DataMinimization(action=action)
