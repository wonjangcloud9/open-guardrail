"""Detect unsafe patterns in code review."""

import re
import time

from open_guardrail.core import GuardResult

_PATTERNS: list[re.Pattern[str]] = [
    # Embedded secrets / API keys
    re.compile(
        r"(api[_-]?key|api[_-]?secret|access[_-]?token"
        r"|secret[_-]?key)\s*[=:]\s*['\"][A-Za-z0-9+/=]{16,}",
        re.IGNORECASE,
    ),
    # Hardcoded credentials
    re.compile(
        r"(password|passwd|pwd)\s*[=:]\s*['\"][^'\"]{4,}",
        re.IGNORECASE,
    ),
    # Unsafe eval/exec
    re.compile(
        r"\b(eval|exec)\s*\(",
        re.IGNORECASE,
    ),
    # SQL string concatenation
    re.compile(
        r"(SELECT|INSERT|UPDATE|DELETE)\s+.*\+\s*"
        r"(request|params|input|user|query)",
        re.IGNORECASE,
    ),
    # SQL format string injection
    re.compile(
        r"(SELECT|INSERT|UPDATE|DELETE)\s+.*"
        r"(f['\"]|\.format\(|%\s*\()",
        re.IGNORECASE,
    ),
    # Command injection via os/subprocess
    re.compile(
        r"(os\.system|os\.popen|subprocess\.(call|run"
        r"|Popen))\s*\(\s*(f['\"]|['\"].*\+|.*\.format)",
        re.IGNORECASE,
    ),
    # Shell=True in subprocess
    re.compile(
        r"subprocess\.\w+\(.*shell\s*=\s*True",
        re.IGNORECASE,
    ),
    # Hardcoded private keys
    re.compile(
        r"-----BEGIN\s+(RSA\s+)?PRIVATE\s+KEY-----",
        re.IGNORECASE,
    ),
    # AWS credentials
    re.compile(
        r"\b(AKIA[0-9A-Z]{16})\b",
    ),
]


class _CodeReviewSafety:
    def __init__(self, *, action: str = "block") -> None:
        self.name = "code-review-safety"
        self.action = action

    def check(
        self, text: str, stage: str = "input"
    ) -> GuardResult:
        start = time.perf_counter()
        matched: list[str] = []

        for pat in _PATTERNS:
            if pat.search(text):
                matched.append(pat.pattern)

        triggered = len(matched) > 0
        score = min(len(matched) / 3, 1.0) if triggered else 0.0
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="code-review-safety",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=score,
            message=(
                "Unsafe code pattern detected"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {
                    "matched_count": len(matched),
                    "reason": (
                        "Code contains embedded secrets,"
                        " hardcoded credentials, or"
                        " unsafe execution patterns"
                    ),
                }
                if triggered
                else None
            ),
        )


def code_review_safety(
    *, action: str = "block"
) -> _CodeReviewSafety:
    return _CodeReviewSafety(action=action)
