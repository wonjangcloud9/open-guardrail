"""Detect environment variable leaks."""
from __future__ import annotations

import re
import time
from open_guardrail.core import GuardResult

_PATTERNS: list[re.Pattern[str]] = [
    re.compile(r"process\.env\.\w+"),
    re.compile(r"os\.environ\["),
    re.compile(r"\$ENV\{[^}]+\}"),
    re.compile(r"%[A-Z_]+%"),
    re.compile(r"\$\{[A-Z_][A-Z0-9_]*\}"),
    re.compile(r"DATABASE_URL\s*[:=]\s*\S+", re.IGNORECASE),
    re.compile(r"AWS_SECRET[_A-Z]*\s*[:=]\s*\S+", re.IGNORECASE),
    re.compile(r"API_KEY\s*[:=]\s*\S+", re.IGNORECASE),
    re.compile(r"REDIS_URL\s*[:=]\s*\S+", re.IGNORECASE),
    re.compile(r"MONGO_URI\s*[:=]\s*\S+", re.IGNORECASE),
]


class _EnvVarLeak:
    def __init__(self, *, action: str = "block") -> None:
        self.name = "env-var-leak"
        self.action = action
        self._patterns = list(_PATTERNS)

    def check(self, text: str, stage: str = "output") -> GuardResult:
        start = time.perf_counter()
        matched: list[str] = []
        for pat in self._patterns:
            if pat.search(text):
                matched.append(pat.pattern)
        triggered = len(matched) > 0
        score = min(len(matched) / 3, 1.0) if triggered else 0.0
        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(
            guard_name="env-var-leak",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=score,
            message="Environment variable leak detected" if triggered else None,
            latency_ms=round(elapsed, 2),
            details=(
                {"matched_patterns": len(matched)}
                if triggered
                else None
            ),
        )


def env_var_leak(*, action: str = "block") -> _EnvVarLeak:
    return _EnvVarLeak(action=action)
