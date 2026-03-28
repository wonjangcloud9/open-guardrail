"""Detect cache poisoning patterns in responses."""
from __future__ import annotations

import re
import time

from open_guardrail.core import GuardResult

_PATTERNS: list[tuple[str, re.Pattern[str]]] = [
    (
        "set_cookie_in_cacheable",
        re.compile(
            r"cache-control\s*:\s*public.*set-cookie\s*:",
            re.IGNORECASE | re.DOTALL,
        ),
    ),
    (
        "set_cookie_in_cacheable_rev",
        re.compile(
            r"set-cookie\s*:.*cache-control\s*:\s*public",
            re.IGNORECASE | re.DOTALL,
        ),
    ),
    (
        "vary_header_abuse",
        re.compile(r"vary\s*:\s*\*", re.IGNORECASE),
    ),
    (
        "stale_while_revalidate_abuse",
        re.compile(
            r"stale-while-revalidate\s*=\s*\d{7,}",
            re.IGNORECASE,
        ),
    ),
    (
        "cache_key_injection",
        re.compile(
            r"x-forwarded-host\s*:.*cache",
            re.IGNORECASE,
        ),
    ),
    (
        "poisoned_header",
        re.compile(
            r"x-original-url\s*:|x-rewrite-url\s*:",
            re.IGNORECASE,
        ),
    ),
]


class _ResponseCachePoison:
    def __init__(self, *, action: str = "block") -> None:
        self.name = "response-cache-poison"
        self.action = action

    def check(
        self, text: str, stage: str = "output"
    ) -> GuardResult:
        start = time.perf_counter()
        matched: list[str] = []

        for name, pat in _PATTERNS:
            if pat.search(text):
                matched.append(name)

        triggered = len(matched) > 0
        score = (
            min(len(matched) / 3, 1.0) if triggered else 0.0
        )
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="response-cache-poison",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=score,
            message=(
                "Cache poisoning pattern detected"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {"matched": matched} if triggered else None
            ),
        )


def response_cache_poison(
    *, action: str = "block"
) -> _ResponseCachePoison:
    return _ResponseCachePoison(action=action)
