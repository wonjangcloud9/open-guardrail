"""Detect SQL injection vulnerabilities in generated code (CWE-89)."""
from __future__ import annotations

import re
import time
from typing import List, Optional

from open_guardrail.core import GuardResult

_SQL_INJECTION_PATTERNS = [
    re.compile(
        r'(?:execute|query|raw|prepare)\s*\(\s*["\x27`]'
        r'(?:SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|CREATE)\b',
        re.IGNORECASE,
    ),
    re.compile(r'(?:execute|query|raw)\s*\(\s*f["\x27]', re.IGNORECASE),
    re.compile(
        r'["\x27](?:SELECT|INSERT|UPDATE|DELETE|DROP)\s+.*["\x27]\s*\+',
        re.IGNORECASE,
    ),
    re.compile(
        r'\+\s*["\x27]?\s*(?:SELECT|INSERT|UPDATE|DELETE|DROP)\s',
        re.IGNORECASE,
    ),
    re.compile(
        r'["\x27](?:SELECT|INSERT|UPDATE|DELETE)\b[^"\x27]*\$\{',
        re.IGNORECASE,
    ),
    re.compile(
        r'`(?:SELECT|INSERT|UPDATE|DELETE|DROP)\b[^`]*\$\{',
        re.IGNORECASE,
    ),
    re.compile(r'cursor\.execute\s*\(\s*f["\x27]', re.IGNORECASE),
    re.compile(
        r'cursor\.execute\s*\(\s*["\x27][^"\x27]*["\x27]\s*%',
        re.IGNORECASE,
    ),
    re.compile(
        r'\.query\s*\(\s*["\x27`](?:SELECT|DELETE|UPDATE|INSERT)\b'
        r'[^)]*\+\s*(?:req\.|request\.|params|input|user)',
        re.IGNORECASE,
    ),
    re.compile(r'\+\s*req\.(?:body|query|params)\b'),
    re.compile(r'\+\s*request\.(?:form|args|data|json)\b'),
    re.compile(
        r'string\.Format\s*\(\s*["\x27](?:SELECT|INSERT|UPDATE|DELETE)\b',
        re.IGNORECASE,
    ),
    re.compile(
        r'["\x27](?:SELECT|INSERT|UPDATE|DELETE)\b[^"\x27]*["\x27]'
        r'\.format\s*\(',
        re.IGNORECASE,
    ),
]


class _CodegenSqlInjection:
    def __init__(self, *, action: str = "block") -> None:
        self.name = "codegen-sql-injection"
        self.action = action

    def check(self, text: str, stage: str = "output") -> GuardResult:
        start = time.perf_counter()
        findings: List[str] = []

        for pattern in _SQL_INJECTION_PATTERNS:
            if pattern.search(text):
                findings.append(pattern.pattern[:60])

        triggered = len(findings) > 0
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name=self.name,
            passed=not triggered,
            action=self.action if triggered else "allow",
            message=(
                f"SQL injection risk: {len(findings)} vulnerable pattern(s)"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {"match_count": len(findings), "reason": "CWE-89"}
                if triggered
                else None
            ),
        )


def codegen_sql_injection(*, action: str = "block") -> _CodegenSqlInjection:
    return _CodegenSqlInjection(action=action)
