"""Detect URL redirect attacks including open redirects and SSRF."""

import re
import time
from typing import Optional

from open_guardrail.core import GuardResult

_DEFAULT_PATTERNS: list[re.Pattern[str]] = [
    re.compile(
        r"[?&](?:url|redirect|next|returnTo|return_to"
        r"|goto|dest|destination|redir|continue|forward)"
        r"\s*=\s*https?:\/\/",
        re.IGNORECASE,
    ),
    re.compile(
        r"[?&](?:url|redirect|next|returnTo|return_to"
        r"|goto)\s*=\s*\/\/",
        re.IGNORECASE,
    ),
    re.compile(
        r"[?&](?:url|redirect)\s*=\s*data:", re.IGNORECASE
    ),
    re.compile(r"Location:\s*https?:\/\/[^\s]*@", re.IGNORECASE),
    re.compile(r"https?:\/\/[^\/]*@[^\/]*\/"),
    re.compile(
        r"(?:url|redirect)\s*=\s*https?:\/\/.*"
        r"[?&](?:token|key|secret|password|auth)",
        re.IGNORECASE,
    ),
    re.compile(
        r"(?:127\.0\.0\.1|localhost|0\.0\.0\.0"
        r"|169\.254\.\d+\.\d+|10\.\d+\.\d+\.\d+"
        r"|192\.168\.\d+\.\d+)"
    ),
    re.compile(
        r"(?:url|redirect)\s*=\s*(?:ftp|file|gopher):\/\/",
        re.IGNORECASE,
    ),
]


class _UrlRedirectDetect:
    def __init__(
        self, *, action: str = "block"
    ) -> None:
        self.name = "url-redirect-detect"
        self.action = action
        self._patterns = list(_DEFAULT_PATTERNS)

    def check(
        self, text: str, stage: str = "input"
    ) -> GuardResult:
        start = time.perf_counter()
        matched: list[str] = []

        for pat in self._patterns:
            if pat.search(text):
                matched.append(pat.pattern)

        triggered = len(matched) > 0
        score = (
            min(len(matched) / 3, 1.0) if triggered else 0.0
        )
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="url-redirect-detect",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=score,
            message=(
                "URL redirect attack detected"
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


def url_redirect_detect(
    *, action: str = "block"
) -> _UrlRedirectDetect:
    return _UrlRedirectDetect(action=action)
