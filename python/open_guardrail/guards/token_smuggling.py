"""Detect token smuggling via alternate encodings."""

import re
import time
from typing import List, Optional

from open_guardrail.core import GuardResult

_DEFAULT_PATTERNS: list[re.Pattern[str]] = [
    re.compile(
        r"\batob\s*\(", re.IGNORECASE,
    ),
    re.compile(
        r"Buffer\.from\s*\(", re.IGNORECASE,
    ),
    re.compile(
        r"base64[._\-]?decode", re.IGNORECASE,
    ),
    re.compile(
        r"\\x[0-9a-fA-F]{2}(\\x[0-9a-fA-F]{2}){3,}",
    ),
    re.compile(
        r"(?:0x[0-9a-fA-F]{2}\s*,?\s*){4,}",
    ),
    re.compile(
        r"\brot13\b", re.IGNORECASE,
    ),
    re.compile(
        r"\\u[0-9a-fA-F]{4}(\\u[0-9a-fA-F]{4}){3,}",
    ),
    re.compile(
        r"\bu(?:\+|%)[0-9a-fA-F]{4}", re.IGNORECASE,
    ),
    re.compile(
        r"1gn0r3|byp[a@]ss|3x3cut3|d3l3t3",
        re.IGNORECASE,
    ),
    re.compile(
        r"[\u0400-\u04ff].*[a-zA-Z]|[a-zA-Z].*[\u0400-\u04ff]",
    ),
    re.compile(
        r"[\uff01-\uff5e]{3,}",
    ),
]


class _TokenSmuggling:
    def __init__(
        self,
        *,
        action: str = "block",
        extra_patterns: Optional[List[re.Pattern[str]]] = None,
    ) -> None:
        self.name = "token-smuggling"
        self.action = action
        self._patterns = list(_DEFAULT_PATTERNS)
        if extra_patterns:
            self._patterns.extend(extra_patterns)

    def check(
        self, text: str, stage: str = "input"
    ) -> GuardResult:
        start = time.perf_counter()
        matched: list[str] = []

        for pat in self._patterns:
            if pat.search(text):
                matched.append(pat.pattern)

        triggered = len(matched) > 0
        score = min(len(matched) / 3, 1.0) if triggered else 0.0
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="token-smuggling",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=score,
            message=(
                "Token smuggling detected"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {
                    "matched_patterns": len(matched),
                    "reason": (
                        "Text contains alternate encoding"
                        " patterns that may smuggle"
                        " hidden instructions"
                    ),
                }
                if triggered
                else None
            ),
        )


def token_smuggling(
    *,
    action: str = "block",
    extra_patterns: Optional[List[re.Pattern[str]]] = None,
) -> _TokenSmuggling:
    return _TokenSmuggling(
        action=action, extra_patterns=extra_patterns
    )
