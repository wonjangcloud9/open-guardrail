"""Detect cloud provider credentials in output."""
from __future__ import annotations

import re
import time
from typing import Optional

from open_guardrail.core import GuardResult

_DEFAULT_PATTERNS: list[re.Pattern[str]] = [
    re.compile(r"AKIA[0-9A-Z]{16}"),
    re.compile(
        r"aws_secret_access_key\s*[=:]\s*"
        r"[A-Za-z0-9/+=]{40}",
        re.IGNORECASE,
    ),
    re.compile(r'"type"\s*:\s*"service_account"'),
    re.compile(r'"private_key"\s*:\s*"-----BEGIN'),
    re.compile(
        r"DefaultEndpointsProtocol=https;"
        r"AccountName=",
        re.IGNORECASE,
    ),
    re.compile(r"AccountKey=[A-Za-z0-9/+=]{60,}"),
    re.compile(r"dop_v1_[a-f0-9]{64}"),
    re.compile(
        r"heroku_api_key\s*[=:]\s*[a-f0-9-]{36}",
        re.IGNORECASE,
    ),
    re.compile(r"HEROKU_API_KEY=[a-f0-9-]{36}"),
]


class _CloudCredentialDetect:
    def __init__(self, *, action: str = "block") -> None:
        self.name = "cloud-credential-detect"
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
            guard_name="cloud-credential-detect",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=score,
            message=(
                "Cloud credentials detected"
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


def cloud_credential_detect(
    *, action: str = "block"
) -> _CloudCredentialDetect:
    return _CloudCredentialDetect(action=action)
