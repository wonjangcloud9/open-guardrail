"""Detect and block code blocks in text."""
from __future__ import annotations

import re
import time
from typing import List, Optional

from open_guardrail.core import GuardResult

_CODE_PATTERNS: dict[str, re.Pattern[str]] = {
    "code-block": re.compile(r"```[\s\S]*?```"),
    "inline-code": re.compile(r"`[^`]+`"),
    "javascript": re.compile(
        r"(?:function\s+\w+|const\s+\w+\s*="
        r"|let\s+\w+\s*=|var\s+\w+\s*="
        r"|=>\s*\{|import\s+\{)"
    ),
    "python": re.compile(
        r"(?:def\s+\w+\(|class\s+\w+[:(]"
        r"|import\s+\w+|from\s+\w+\s+import"
        r"|if\s+__name__)"
    ),
    "sql": re.compile(
        r"(?:SELECT\s+.*FROM|INSERT\s+INTO"
        r"|UPDATE\s+\w+\s+SET|DELETE\s+FROM"
        r"|CREATE\s+TABLE)",
        re.IGNORECASE,
    ),
    "html": re.compile(
        r"<(?:div|span|p|h[1-6]|ul|ol|li"
        r"|table|form|input|button)[^>]*>",
        re.IGNORECASE,
    ),
    "shell": re.compile(
        r"(?:sudo\s+|chmod\s+|chown\s+|rm\s+-"
        r"|curl\s+|wget\s+|apt\s+|pip\s+install)"
    ),
}

_ALL_LANGUAGES = list(_CODE_PATTERNS.keys())


class _BanCode:
    def __init__(
        self,
        *,
        action: str = "block",
        languages: Optional[List[str]] = None,
    ) -> None:
        self.name = "ban-code"
        self.action = action
        self._languages = languages or list(
            _ALL_LANGUAGES
        )

    def check(
        self, text: str, stage: str = "input"
    ) -> GuardResult:
        start = time.perf_counter()
        detected: dict[str, int] = {}

        for lang in self._languages:
            pat = _CODE_PATTERNS.get(lang)
            if not pat:
                continue
            matches = pat.findall(text)
            if matches:
                detected[lang] = len(matches)

        triggered = len(detected) > 0
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="ban-code",
            passed=not triggered,
            action=self.action if triggered else "allow",
            message=(
                "Code detected: "
                + ", ".join(detected.keys())
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {
                    "detected": detected,
                    "reason": (
                        "Text contains code blocks"
                        " or programming language"
                        " constructs"
                    ),
                }
                if triggered
                else None
            ),
        )


def ban_code(
    *,
    action: str = "block",
    languages: Optional[List[str]] = None,
) -> _BanCode:
    return _BanCode(action=action, languages=languages)
