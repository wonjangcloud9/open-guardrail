"""Detect leaked auth tokens."""
from __future__ import annotations

import re
import time
from open_guardrail.core import GuardResult

_PATTERNS: list[re.Pattern[str]] = [
    re.compile(r"Bearer\s+[A-Za-z0-9\-._~+/]+=*", re.IGNORECASE),
    re.compile(
        r"eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+"
        r"\.[A-Za-z0-9_\-+/=]+"
    ),
    re.compile(r"oauth[_-]?token\s*[:=]\s*\S+", re.IGNORECASE),
    re.compile(r"PHPSESSID\s*[:=]\s*\S+", re.IGNORECASE),
    re.compile(r"JSESSIONID\s*[:=]\s*\S+", re.IGNORECASE),
    re.compile(
        r"ASP\.NET_SessionId\s*[:=]\s*\S+", re.IGNORECASE
    ),
    re.compile(r"refresh[_-]?token\s*[:=]\s*\S+", re.IGNORECASE),
    re.compile(r"access[_-]?token\s*[:=]\s*\S+", re.IGNORECASE),
    re.compile(r"x-api-key\s*[:=]\s*\S+", re.IGNORECASE),
    re.compile(r"session[_-]?cookie\s*[:=]\s*\S+", re.IGNORECASE),
]


class _AuthTokenDetect:
    def __init__(self, *, action: str = "block") -> None:
        self.name = "auth-token-detect"
        self.action = action
        self._patterns = list(_PATTERNS)

    def check(self, text: str, stage: str = "input") -> GuardResult:
        start = time.perf_counter()
        matched: list[str] = []
        for pat in self._patterns:
            if pat.search(text):
                matched.append(pat.pattern)
        triggered = len(matched) > 0
        score = min(len(matched) / 3, 1.0) if triggered else 0.0
        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(
            guard_name="auth-token-detect",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=score,
            message="Auth token detected" if triggered else None,
            latency_ms=round(elapsed, 2),
            details=(
                {"matched_patterns": len(matched)}
                if triggered
                else None
            ),
        )


def auth_token_detect(*, action: str = "block") -> _AuthTokenDetect:
    return _AuthTokenDetect(action=action)
