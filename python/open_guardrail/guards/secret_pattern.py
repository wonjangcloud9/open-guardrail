"""Secret and credential pattern detection guard."""

import re
import time
from typing import List, Optional

from open_guardrail.core import GuardResult

_PATTERNS: dict[str, re.Pattern[str]] = {
    "env-var": re.compile(
        r"(?:API_KEY|SECRET|PASSWORD|TOKEN"
        r"|PRIVATE_KEY|ACCESS_KEY|AUTH)"
        r"\s*[=:]\s*['\"]?[\w\-./+]{8,}['\"]?",
        re.IGNORECASE,
    ),
    "connection-string": re.compile(
        r"(?:mongodb|mysql|postgres|postgresql"
        r"|redis|amqp|mssql)://[^\s'\"]+",
        re.IGNORECASE,
    ),
    "private-key": re.compile(
        r"-----BEGIN\s+(?:RSA|DSA|EC|OPENSSH)?"
        r"\s*PRIVATE\s+KEY-----",
        re.IGNORECASE,
    ),
    "bearer-token": re.compile(
        r"Bearer\s+[A-Za-z0-9\-._~+/]+=*"
    ),
    "basic-auth": re.compile(
        r"Basic\s+[A-Za-z0-9+/]{20,}={0,2}"
    ),
    "webhook-url": re.compile(
        r"https://hooks\.slack\.com/[^\s'\"]+",
        re.IGNORECASE,
    ),
    "database-url": re.compile(
        r"DATABASE_URL\s*[=:]\s*['\"]?[^\s'\"]+['\"]?",
        re.IGNORECASE,
    ),
}

_MASK_LABELS: dict[str, str] = {
    "env-var": "[ENV_SECRET]",
    "connection-string": "[CONNECTION_STRING]",
    "private-key": "[PRIVATE_KEY]",
    "bearer-token": "[BEARER_TOKEN]",
    "basic-auth": "[BASIC_AUTH]",
    "webhook-url": "[WEBHOOK_URL]",
    "database-url": "[DATABASE_URL]",
}

_ALL_TYPES = list(_PATTERNS.keys())


def _detect(
    text: str, types: list[str]
) -> list[dict]:
    matches: list[dict] = []
    for t in types:
        pat = _PATTERNS.get(t)
        if not pat:
            continue
        for m in pat.finditer(text):
            matches.append(
                {
                    "type": t,
                    "value": m.group(),
                    "start": m.start(),
                    "end": m.end(),
                }
            )
    matches.sort(key=lambda x: x["start"], reverse=True)
    return matches


def _mask_text(text: str, matches: list[dict]) -> str:
    result = text
    for m in matches:
        label = _MASK_LABELS.get(m["type"], "[SECRET]")
        result = (
            result[: m["start"]] + label + result[m["end"] :]
        )
    return result


class _SecretPattern:
    def __init__(
        self,
        *,
        action: str = "block",
        types: Optional[List[str]] = None,
    ) -> None:
        self.name = "secret-pattern"
        self.action = action
        self._types = types or list(_ALL_TYPES)

    def check(
        self, text: str, stage: str = "input"
    ) -> GuardResult:
        start = time.perf_counter()
        matches = _detect(text, self._types)
        elapsed = (time.perf_counter() - start) * 1000

        if not matches:
            return GuardResult(
                guard_name="secret-pattern",
                passed=True,
                action="allow",
                latency_ms=round(elapsed, 2),
            )

        detected = [{"type": m["type"]} for m in matches]

        if self.action == "mask":
            return GuardResult(
                guard_name="secret-pattern",
                passed=True,
                action="override",
                override_text=_mask_text(text, matches),
                latency_ms=round(elapsed, 2),
                details={"detected": detected},
            )

        types_found = ", ".join(
            m["type"] for m in matches
        )
        return GuardResult(
            guard_name="secret-pattern",
            passed=False,
            action=self.action,
            message=f"Secret detected: {types_found}",
            latency_ms=round(elapsed, 2),
            details={
                "detected": detected,
                "reason": (
                    "Text contains credentials, API"
                    " keys, or connection strings"
                    " that should not be exposed"
                ),
            },
        )


def secret_pattern(
    *,
    action: str = "block",
    types: Optional[List[str]] = None,
) -> _SecretPattern:
    return _SecretPattern(action=action, types=types)
