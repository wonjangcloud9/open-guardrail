"""Detect stereotype patterns."""
from __future__ import annotations

import re
import time

from open_guardrail.core import GuardResult

_GROUP_WORDS = (
    r"(?:women|men|boys|girls|whites|blacks|"
    r"asians|latinos|hispanics|muslims|jews|"
    r"christians|hindus|immigrants|elderly|"
    r"millennials|boomers|gen\s*z|teenagers|"
    r"disabled|lgbtq|gay|lesbian|trans)"
)

_STEREOTYPE_PATTERNS = [
    re.compile(
        r"typical\s+" + _GROUP_WORDS,
        re.IGNORECASE,
    ),
    re.compile(
        _GROUP_WORDS + r"\s+always",
        re.IGNORECASE,
    ),
    re.compile(
        _GROUP_WORDS + r"\s+never",
        re.IGNORECASE,
    ),
    re.compile(
        _GROUP_WORDS + r"\s+can'?t",
        re.IGNORECASE,
    ),
    re.compile(
        r"all\s+" + _GROUP_WORDS + r"\s+are",
        re.IGNORECASE,
    ),
    re.compile(
        _GROUP_WORDS
        + r"\s+(?:should|belong|need\s+to)",
        re.IGNORECASE,
    ),
]


class _StereotypeDetect:
    def __init__(
        self, *, action: str = "warn"
    ) -> None:
        self.name = "stereotype-detect"
        self.action = action

    def check(
        self, text: str, stage: str = "input"
    ) -> GuardResult:
        start = time.perf_counter()
        found: list[str] = []

        for pat in _STEREOTYPE_PATTERNS:
            match = pat.search(text)
            if match:
                found.append(match.group())

        elapsed = (
            time.perf_counter() - start
        ) * 1000

        if not found:
            return GuardResult(
                guard_name="stereotype-detect",
                passed=True,
                action="allow",
                latency_ms=round(elapsed, 2),
            )

        return GuardResult(
            guard_name="stereotype-detect",
            passed=False,
            action=self.action,
            message="Stereotype pattern detected",
            latency_ms=round(elapsed, 2),
            details={
                "matched": found,
                "reason": (
                    "Text contains generalizations"
                    " about a group"
                ),
            },
        )


def stereotype_detect(
    *, action: str = "warn"
) -> _StereotypeDetect:
    return _StereotypeDetect(action=action)
