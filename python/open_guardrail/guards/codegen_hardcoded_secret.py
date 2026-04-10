"""Detect hardcoded credentials in generated code (CWE-798)."""
from __future__ import annotations

import re
import time
from typing import List, Optional

from open_guardrail.core import GuardResult

_PLACEHOLDER_RE = re.compile(
    r'["\x27](?:<your[_\-]?(?:key|token|secret|password)>|xxx+|changeme'
    r"|TODO|PLACEHOLDER|your[_\-]?(?:api[_\-]?key|token|secret|password)"
    r"|CHANGE_ME|INSERT_HERE|REPLACE_ME|example|test|dummy|fake|sample)"
    r'["\x27]',
    re.IGNORECASE,
)

_SECRET_PATTERNS = [
    (
        re.compile(
            r'(?:password|passwd|pwd)\s*=\s*["\x27][^"\x27]{4,}["\x27]',
            re.IGNORECASE,
        ),
        "hardcoded password",
    ),
    (
        re.compile(
            r'(?:api_?key|apikey)\s*=\s*["\x27][^"\x27]{8,}["\x27]',
            re.IGNORECASE,
        ),
        "hardcoded API key",
    ),
    (
        re.compile(
            r'(?:secret|secret_?key)\s*=\s*["\x27][^"\x27]{8,}["\x27]',
            re.IGNORECASE,
        ),
        "hardcoded secret",
    ),
    (
        re.compile(
            r'(?:token)\s*=\s*["\x27](?:sk-|ghp_|glpat-|gho_|xox[bpoas]-)'
            r'[^"\x27]+["\x27]',
            re.IGNORECASE,
        ),
        "hardcoded token",
    ),
    (
        re.compile(
            r'Authorization["\x27:\s]+Bearer\s+[A-Za-z0-9\-_.]{20,}'
        ),
        "hardcoded Bearer token",
    ),
    (re.compile(r'AKIA[0-9A-Z]{16}'), "AWS Access Key ID"),
    (
        re.compile(
            r'aws_secret_access_key\s*=\s*["\x27][^"\x27]+["\x27]',
            re.IGNORECASE,
        ),
        "AWS secret key",
    ),
    (
        re.compile(r'mongodb(?:\+srv)?://[^:]+:[^@]+@'),
        "MongoDB URI with credentials",
    ),
    (
        re.compile(r'postgres(?:ql)?://[^:]+:[^@]+@'),
        "PostgreSQL URI with credentials",
    ),
    (re.compile(r'mysql://[^:]+:[^@]+@'), "MySQL URI with credentials"),
    (
        re.compile(r'-----BEGIN (?:RSA )?PRIVATE KEY-----'),
        "private key block",
    ),
    (
        re.compile(r'-----BEGIN EC PRIVATE KEY-----'),
        "EC private key block",
    ),
    (
        re.compile(
            r'(?:client_secret|app_secret)\s*=\s*["\x27][^"\x27]{8,}["\x27]',
            re.IGNORECASE,
        ),
        "hardcoded client secret",
    ),
]


class _CodegenHardcodedSecret:
    def __init__(self, *, action: str = "block") -> None:
        self.name = "codegen-hardcoded-secret"
        self.action = action

    def check(self, text: str, stage: str = "output") -> GuardResult:
        start = time.perf_counter()
        findings: List[str] = []

        for pattern, label in _SECRET_PATTERNS:
            match = pattern.search(text)
            if match and not _PLACEHOLDER_RE.search(match.group(0)):
                findings.append(label)

        triggered = len(findings) > 0
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name=self.name,
            passed=not triggered,
            action=self.action if triggered else "allow",
            message=(
                f"Hardcoded secret risk: {', '.join(findings)}"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {"findings": findings, "reason": "CWE-798"}
                if triggered
                else None
            ),
        )


def codegen_hardcoded_secret(
    *, action: str = "block"
) -> _CodegenHardcodedSecret:
    return _CodegenHardcodedSecret(action=action)
