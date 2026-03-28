"""Safe search guard for AI-powered search."""
from __future__ import annotations

import re
import time

from open_guardrail.core import GuardResult

_EXPLICIT: list[re.Pattern[str]] = [
    re.compile(
        r"\b(porn|pornograph|xxx|nsfw|hentai|nude|naked)\b",
        re.IGNORECASE,
    ),
    re.compile(
        r"\b(sex\s*(video|scene|tape|act)|erotic|orgasm)\b",
        re.IGNORECASE,
    ),
    re.compile(
        r"\b(escort\s*service|prostitut|brothel)\b",
        re.IGNORECASE,
    ),
]

_DRUG: list[re.Pattern[str]] = [
    re.compile(
        r"\b(buy|purchase|order)\s+"
        r"(cocaine|heroin|meth|mdma|lsd|fentanyl)\b",
        re.IGNORECASE,
    ),
    re.compile(
        r"\bhow\s+to\s+(make|cook|synthesize)"
        r"\s+(meth|drugs|crack)\b",
        re.IGNORECASE,
    ),
    re.compile(
        r"\b(drug\s*dealer|dark\s*web\s*market)\b",
        re.IGNORECASE,
    ),
]

_VIOLENCE: list[re.Pattern[str]] = [
    re.compile(
        r"\bhow\s+to\s+(kill|murder|poison|assassinate)\b",
        re.IGNORECASE,
    ),
    re.compile(
        r"\b(bomb\s*making|make\s+a\s+bomb"
        r"|explosive\s*recipe)\b",
        re.IGNORECASE,
    ),
    re.compile(
        r"\b(mass\s*shooting|school\s*shooting)"
        r"\s*(how|plan|guide)\b",
        re.IGNORECASE,
    ),
]

_STRICT: list[re.Pattern[str]] = [
    re.compile(
        r"\b(sexy|hot\s+girls|bikini|lingerie)\b",
        re.IGNORECASE,
    ),
    re.compile(
        r"\b(gore|bloody|graphic\s*violence)\b",
        re.IGNORECASE,
    ),
    re.compile(
        r"\b(weed|marijuana|cannabis)\s+(buy|order|shop)\b",
        re.IGNORECASE,
    ),
]


class _SafeSearch:
    def __init__(
        self, *, action: str = "block", strict_mode: bool = False
    ) -> None:
        self.name = "safe-search"
        self.action = action
        self._patterns = _EXPLICIT + _DRUG + _VIOLENCE
        if strict_mode:
            self._patterns += _STRICT

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
            guard_name="safe-search",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=score,
            message="Unsafe search query detected" if triggered else None,
            latency_ms=round(elapsed, 2),
            details=(
                {"matched_patterns": len(matched)}
                if triggered
                else None
            ),
        )


def safe_search(
    *, action: str = "block", strict_mode: bool = False
) -> _SafeSearch:
    return _SafeSearch(action=action, strict_mode=strict_mode)
