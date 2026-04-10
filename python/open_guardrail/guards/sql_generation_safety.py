"""Detect SQL injection vulnerabilities in LLM-generated SQL."""
from __future__ import annotations

import re
import time

from open_guardrail.core import GuardResult

_DANGEROUS = [
    ("drop-table", re.compile(r"\bDROP\s+TABLE\b", re.I)),
    ("drop-database", re.compile(r"\bDROP\s+DATABASE\b", re.I)),
    ("truncate", re.compile(r"\bTRUNCATE\b", re.I)),
    ("alter-table", re.compile(r"\bALTER\s+TABLE\b", re.I)),
    ("union-select", re.compile(r"\bUNION\s+(?:ALL\s+)?SELECT\b", re.I)),
    ("into-outfile", re.compile(r"\bINTO\s+OUTFILE\b", re.I)),
    ("into-dumpfile", re.compile(r"\bINTO\s+DUMPFILE\b", re.I)),
    ("sleep-fn", re.compile(r"\bSLEEP\s*\(", re.I)),
    ("benchmark-fn", re.compile(r"\bBENCHMARK\s*\(", re.I)),
    ("load-file", re.compile(r"\bLOAD_FILE\s*\(", re.I)),
    ("sys-functions", re.compile(r"\bsys\.\w+", re.I)),
    ("comment-evasion-dash", re.compile(r"--\s")),
    ("comment-evasion-block", re.compile(r"/\*")),
    ("comment-evasion-hash", re.compile(r"#\s")),
]


def _has_multi_stmts(text: str) -> bool:
    stripped = re.sub(r"'[^']*'", "", text)
    stripped = re.sub(r'"[^"]*"', "", stripped)
    parts = [p for p in stripped.split(";") if p.strip()]
    return len(parts) > 1


class _SqlGenerationSafety:
    def __init__(self, *, action: str = "block") -> None:
        self.name = "sql-generation-safety"
        self.action = action

    def check(self, text: str, stage: str = "output") -> GuardResult:
        start = time.perf_counter()
        threats: list[str] = []
        for name, pat in _DANGEROUS:
            if pat.search(text):
                threats.append(name)
        if _has_multi_stmts(text):
            threats.append("multiple-statements")
        triggered = len(threats) > 0
        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(
            guard_name="sql-generation-safety",
            passed=not triggered,
            action=self.action if triggered else "allow",
            message=f"Dangerous SQL patterns: {', '.join(threats)}" if triggered else None,
            latency_ms=round(elapsed, 2),
            details={"threats": threats} if triggered else None,
        )


def sql_generation_safety(*, action: str = "block") -> _SqlGenerationSafety:
    return _SqlGenerationSafety(action=action)
