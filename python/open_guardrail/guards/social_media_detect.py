"""Detect social media content patterns."""
from __future__ import annotations

import re
import time

from open_guardrail.core import GuardResult

_PATTERNS: list[re.Pattern[str]] = [
    re.compile(r"@\w{2,}"),
    re.compile(r"#\w{2,}"),
    re.compile(r"\bRT\s+@", re.IGNORECASE),
    re.compile(r"\bretweet\b", re.IGNORECASE),
    re.compile(
        r"like\s+and\s+subscribe", re.IGNORECASE
    ),
    re.compile(
        r"share\s+if\s+you\s+agree", re.IGNORECASE
    ),
    re.compile(
        r"follow\s+(me|us)\s+(for|on)",
        re.IGNORECASE,
    ),
    re.compile(r"engagement\s+bait", re.IGNORECASE),
    re.compile(
        r"smash\s+that\s+like\s+button",
        re.IGNORECASE,
    ),
    re.compile(
        r"tag\s+\d+\s+friends", re.IGNORECASE
    ),
    re.compile(
        r"follow\s+for\s+follow", re.IGNORECASE
    ),
    re.compile(
        r"drop\s+a\s+(like|comment)", re.IGNORECASE
    ),
    re.compile(r"double\s+tap\s+if", re.IGNORECASE),
]


class _SocialMediaDetect:
    def __init__(self, *, action: str = "warn") -> None:
        self.name = "social-media-detect"
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
        score = min(len(matched) / 4, 1.0) if triggered else 0.0
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="social-media-detect",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=score,
            message=(
                "Social media content detected"
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


def social_media_detect(
    *, action: str = "warn"
) -> _SocialMediaDetect:
    return _SocialMediaDetect(action=action)
