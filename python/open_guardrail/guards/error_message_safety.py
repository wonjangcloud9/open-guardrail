"""Ensure error messages do not leak sensitive information."""
from __future__ import annotations

import re
import time

from open_guardrail.core import GuardResult

_PATTERNS: list[tuple[str, re.Pattern[str]]] = [
    (
        "stack_trace",
        re.compile(
            r"at\s+\S+\s+\(\S+:\d+:\d+\)",
            re.IGNORECASE,
        ),
    ),
    (
        "stack_trace_py",
        re.compile(
            r'File\s+"[^"]+",\s+line\s+\d+',
            re.IGNORECASE,
        ),
    ),
    (
        "file_path_unix",
        re.compile(
            r"/(home|usr|var|etc|opt|tmp)/\S+",
            re.IGNORECASE,
        ),
    ),
    (
        "file_path_win",
        re.compile(
            r"[A-Z]:\\(Users|Windows|Program\s?Files)"
            r"\\\S+",
            re.IGNORECASE,
        ),
    ),
    (
        "db_connection",
        re.compile(
            r"(mysql|postgres|mongodb|redis)://\S+",
            re.IGNORECASE,
        ),
    ),
    (
        "internal_ip",
        re.compile(
            r"(10\.\d{1,3}\.\d{1,3}\.\d{1,3}"
            r"|192\.168\.\d{1,3}\.\d{1,3}"
            r"|172\.(1[6-9]|2\d|3[01])"
            r"\.\d{1,3}\.\d{1,3})",
        ),
    ),
    (
        "server_version",
        re.compile(
            r"(apache|nginx|iis|tomcat|express)"
            r"/\d+\.\d+",
            re.IGNORECASE,
        ),
    ),
    (
        "debug_info",
        re.compile(
            r"(DEBUG|TRACE|stack\s*trace"
            r"|traceback)\s*[:=]",
            re.IGNORECASE,
        ),
    ),
    (
        "env_variable",
        re.compile(
            r"(DB_PASSWORD|SECRET_KEY|API_KEY"
            r"|AWS_SECRET)\s*[=:]",
            re.IGNORECASE,
        ),
    ),
    (
        "sql_error",
        re.compile(
            r"(ORA-\d{5}|ERROR\s+\d+\s+\(\d+\)"
            r"|syntax\s+error\s+at\s+or\s+near)",
            re.IGNORECASE,
        ),
    ),
]


class _ErrorMessageSafety:
    def __init__(self, *, action: str = "block") -> None:
        self.name = "error-message-safety"
        self.action = action

    def check(
        self, text: str, stage: str = "output"
    ) -> GuardResult:
        start = time.perf_counter()
        matched: list[str] = []

        for name, pat in _PATTERNS:
            if pat.search(text):
                matched.append(name)

        triggered = len(matched) > 0
        score = (
            min(len(matched) / 3, 1.0) if triggered else 0.0
        )
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="error-message-safety",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=score,
            message=(
                "Sensitive information in error message"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {"matched": matched} if triggered else None
            ),
        )


def error_message_safety(
    *, action: str = "block"
) -> _ErrorMessageSafety:
    return _ErrorMessageSafety(action=action)
