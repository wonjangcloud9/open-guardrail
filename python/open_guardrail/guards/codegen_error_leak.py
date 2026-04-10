"""Detect information leakage through error handling (CWE-209)."""
from __future__ import annotations

import re
import time
from typing import List, Optional

from open_guardrail.core import GuardResult

_STACK_TRACE: list[re.Pattern[str]] = [
    re.compile(r"\be\.stack\b"),
    re.compile(r"traceback\.print_exc\s*\(\)"),
    re.compile(r"traceback\.format_exc\s*\(\)"),
    re.compile(r"\.printStackTrace\s*\(\)"),
]

_DB_ERROR_LEAK: list[re.Pattern[str]] = [
    re.compile(
        r"catch\s*\([^)]*\)\s*\{[^}]*res\."
        r"(?:send|json)\s*\(\s*\w+\.message",
        re.DOTALL,
    ),
    re.compile(
        r"except\s+Exception\s+as\s+\w+\s*:"
        r"\s*return\s+str\s*\(\w+\)"
    ),
    re.compile(
        r"res\.status\s*\(\s*500\s*\)\.json\s*\("
        r"\s*\{\s*error\s*:\s*\w+\s*\}"
    ),
    re.compile(
        r"return\s+Response\s*\(\s*str\s*\("
        r"\s*e\s*\)\s*,\s*500\s*\)"
    ),
]

_DEBUG_MODE: list[re.Pattern[str]] = [
    re.compile(r"DEBUG\s*=\s*True"),
    re.compile(r"app\.debug\s*=\s*True"),
    re.compile(r"debug\s*:\s*true"),
    re.compile(r"FLASK_DEBUG\s*=\s*1"),
]

_VERBOSE_ERROR: list[re.Pattern[str]] = [
    re.compile(
        r"res\.status\s*\(\s*500\s*\)\.json\s*\("
        r"\s*\{\s*error\s*:\s*err\b"
    ),
    re.compile(
        r"return\s+jsonify\s*\(\s*\{\s*['\"]error"
        r"['\"]\s*:\s*str\s*\(\s*e\s*\)"
    ),
    re.compile(r"\.send\s*\(\s*err\.stack"),
    re.compile(
        r"console\.error\s*\(\s*err\s*\)\s*;"
        r"\s*res\.send\s*\("
    ),
]

_SQL_ERROR_LEAK: list[re.Pattern[str]] = [
    re.compile(
        r"SQLError|DatabaseError|OperationalError"
    ),
    re.compile(r"mysql\.connector\.errors"),
    re.compile(r"pg\.DatabaseError"),
]

_ALL = (
    _STACK_TRACE
    + _DB_ERROR_LEAK
    + _DEBUG_MODE
    + _VERBOSE_ERROR
    + _SQL_ERROR_LEAK
)


class _CodegenErrorLeak:
    def __init__(self, *, action: str = "block") -> None:
        self.name = "codegen-error-leak"
        self.action = action

    def check(
        self, text: str, stage: str = "output"
    ) -> GuardResult:
        start = time.perf_counter()
        matched: list[str] = []

        for pat in _ALL:
            m = pat.search(text)
            if m:
                matched.append(m.group().strip())

        unique = list(dict.fromkeys(matched))
        triggered = len(unique) > 0
        elapsed = (time.perf_counter() - start) * 1000

        preview = ", ".join(unique[:3])
        if len(unique) > 3:
            preview += f" (+{len(unique) - 3} more)"

        return GuardResult(
            guard_name="codegen-error-leak",
            passed=not triggered,
            action=self.action if triggered else "allow",
            message=(
                f"Error leak detected: {preview}"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {
                    "matched": unique,
                    "reason": (
                        "Code leaks sensitive information"
                        " through error handling"
                    ),
                }
                if triggered
                else None
            ),
        )


def codegen_error_leak(
    *, action: str = "block"
) -> _CodegenErrorLeak:
    return _CodegenErrorLeak(action=action)
