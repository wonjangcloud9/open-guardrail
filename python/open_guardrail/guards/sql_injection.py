"""SQL injection detection guard."""

import re
import time
from typing import Optional

from open_guardrail.core import GuardResult

_HIGH_RISK: list[re.Pattern[str]] = [
    re.compile(
        r"'\s*(OR|AND)\s+'[^']*'\s*=\s*'[^']*'?",
        re.IGNORECASE,
    ),
    re.compile(
        r"'\s*(OR|AND)\s+\d+\s*=\s*\d+", re.IGNORECASE
    ),
    re.compile(
        r"UNION\s+(ALL\s+)?SELECT", re.IGNORECASE
    ),
    re.compile(r";\s*DROP\s+TABLE", re.IGNORECASE),
    re.compile(r";\s*DELETE\s+FROM", re.IGNORECASE),
    re.compile(r";\s*INSERT\s+INTO", re.IGNORECASE),
    re.compile(
        r";\s*UPDATE\s+\w+\s+SET", re.IGNORECASE
    ),
    re.compile(r"EXEC(\s+|\()xp_", re.IGNORECASE),
    re.compile(r"INTO\s+OUTFILE", re.IGNORECASE),
    re.compile(r"LOAD_FILE\s*\(", re.IGNORECASE),
]

_MEDIUM_RISK: list[re.Pattern[str]] = [
    re.compile(r"'\s*--"),
    re.compile(r";\s*--"),
    re.compile(r"/\*[\s\S]*?\*/"),
    re.compile(r"BENCHMARK\s*\(", re.IGNORECASE),
    re.compile(r"SLEEP\s*\(", re.IGNORECASE),
    re.compile(r"WAITFOR\s+DELAY", re.IGNORECASE),
    re.compile(r"CHAR\s*\(\d+\)", re.IGNORECASE),
    re.compile(r"CONCAT\s*\(", re.IGNORECASE),
    re.compile(r"GROUP_CONCAT\s*\(", re.IGNORECASE),
    re.compile(r"INFORMATION_SCHEMA", re.IGNORECASE),
]

_LOW_RISK: list[re.Pattern[str]] = [
    re.compile(r"SELECT\s+.*\s+FROM", re.IGNORECASE),
    re.compile(r"WHERE\s+\w+\s*=", re.IGNORECASE),
    re.compile(r"ORDER\s+BY\s+\d+", re.IGNORECASE),
    re.compile(r"HAVING\s+\d+", re.IGNORECASE),
    re.compile(r"GROUP\s+BY", re.IGNORECASE),
]


class _SqlInjection:
    def __init__(
        self,
        *,
        action: str = "block",
        sensitivity: str = "medium",
    ) -> None:
        self.name = "sql-injection"
        self.action = action
        self._sensitivity = sensitivity
        self._patterns: list[re.Pattern[str]] = list(
            _HIGH_RISK
        )
        if sensitivity in ("medium", "high"):
            self._patterns.extend(_MEDIUM_RISK)
        if sensitivity == "high":
            self._patterns.extend(_LOW_RISK)

    def check(
        self, text: str, stage: str = "input"
    ) -> GuardResult:
        start = time.perf_counter()
        matched: list[str] = []

        for pat in self._patterns:
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
            guard_name="sql-injection",
            passed=not triggered,
            action=self.action if triggered else "allow",
            message=(
                f"SQL injection detected: {preview}"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {
                    "matched": unique,
                    "sensitivity": self._sensitivity,
                    "reason": (
                        "Text contains SQL injection"
                        " patterns that could manipulate"
                        " database queries"
                    ),
                }
                if triggered
                else None
            ),
        )


def sql_injection(
    *,
    action: str = "block",
    sensitivity: str = "medium",
) -> _SqlInjection:
    return _SqlInjection(
        action=action, sensitivity=sensitivity
    )
