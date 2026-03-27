"""Detect leaked configuration data."""

import re
import time
from typing import List

from open_guardrail.core import GuardResult

_DB_URL = [
    re.compile(
        r"(?:mongodb|postgres|mysql|redis|amqp)"
        r"://[^\s\"']+",
        re.I,
    ),
]

_ENV_VAR = [
    re.compile(r"\b[A-Z][A-Z0-9_]{2,}=[\"']?[^\s\"']{4,}[\"']?"),
]

_CONFIG_PATH = [
    re.compile(r"/etc/[a-z][a-z0-9_/.-]+", re.I),
    re.compile(r"\.env(?:\.[a-z]+)?", re.I),
    re.compile(
        r"config\.(?:yaml|yml|json|toml|ini)", re.I
    ),
]

_CRED_ENDPOINT = [
    re.compile(r"https?://[^\s\"']*[:@][^\s\"']*", re.I),
]


class _ConfigLeakDetect:
    def __init__(self, *, action: str = "block") -> None:
        self.name = "config-leak-detect"
        self.action = action

    def check(
        self, text: str, stage: str = "output"
    ) -> GuardResult:
        start = time.perf_counter()
        findings: List[dict] = []

        def _check(patterns, typ: str):
            for p in patterns:
                m = p.search(text)
                if m:
                    findings.append(
                        {"type": typ, "match": m.group()[:40]}
                    )
                    return

        _check(_DB_URL, "database-url")
        _check(_ENV_VAR, "env-variable")
        _check(_CONFIG_PATH, "config-path")
        _check(_CRED_ENDPOINT, "credential-endpoint")

        triggered = len(findings) > 0
        elapsed = (time.perf_counter() - start) * 1000
        types = [f["type"] for f in findings]
        return GuardResult(
            guard_name="config-leak-detect",
            passed=not triggered,
            action=self.action if triggered else "allow",
            message=(
                f"Config leak: {', '.join(types)}"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {"findings": findings}
                if triggered
                else None
            ),
        )


def config_leak_detect(
    *, action: str = "block"
) -> _ConfigLeakDetect:
    return _ConfigLeakDetect(action=action)
