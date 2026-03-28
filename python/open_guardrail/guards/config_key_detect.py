"""Detect configuration keys and values in output."""
from __future__ import annotations

import re
import time
from typing import Optional

from open_guardrail.core import GuardResult

_DEFAULT_PATTERNS: list[re.Pattern[str]] = [
    re.compile(
        r"connection_string\s*[=:]\s*[\"']?"
        r"[^\s\"']+",
        re.IGNORECASE,
    ),
    re.compile(
        r"database_url\s*[=:]\s*[\"']?"
        r"[^\s\"']+",
        re.IGNORECASE,
    ),
    re.compile(
        r"redis_url\s*[=:]\s*[\"']?[^\s\"']+",
        re.IGNORECASE,
    ),
    re.compile(
        r"smtp_(host|password|user)\s*[=:]\s*"
        r"[\"']?[^\s\"']+",
        re.IGNORECASE,
    ),
    re.compile(
        r"config\.(get|set)\s*\(\s*[\"']"
        r"[^\"']*secret[^\"']*[\"']",
        re.IGNORECASE,
    ),
    re.compile(
        r"DB_(HOST|PASSWORD|USER|NAME)\s*[=:]"
        r"\s*[\"']?[^\s\"']+",
        re.IGNORECASE,
    ),
    re.compile(
        r"MONGO_URI\s*[=:]\s*[\"']?[^\s\"']+",
        re.IGNORECASE,
    ),
    re.compile(
        r"AWS_(ACCESS|SECRET|REGION)\s*[=:]"
        r"\s*[\"']?[^\s\"']+",
        re.IGNORECASE,
    ),
    re.compile(
        r"PRIVATE_KEY\s*[=:]\s*[\"']?[^\s\"']+",
        re.IGNORECASE,
    ),
    re.compile(
        r"api_secret\s*[=:]\s*[\"']?[^\s\"']+",
        re.IGNORECASE,
    ),
]


class _ConfigKeyDetect:
    def __init__(self, *, action: str = "block") -> None:
        self.name = "config-key-detect"
        self.action = action
        self._patterns = list(_DEFAULT_PATTERNS)

    def check(
        self, text: str, stage: str = "output"
    ) -> GuardResult:
        start = time.perf_counter()
        matched: list[str] = []

        for pat in self._patterns:
            if pat.search(text):
                matched.append(pat.pattern)

        triggered = len(matched) > 0
        score = (
            min(len(matched) / 3, 1.0)
            if triggered
            else 0.0
        )
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="config-key-detect",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=score,
            message=(
                "Configuration key detected"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {"matched_patterns": len(matched)}
                if triggered
                else None
            ),
        )


def config_key_detect(
    *, action: str = "block"
) -> _ConfigKeyDetect:
    return _ConfigKeyDetect(action=action)
