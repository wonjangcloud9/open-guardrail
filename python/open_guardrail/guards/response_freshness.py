"""Detect potentially stale or outdated information."""

import re
import time
from datetime import datetime
from open_guardrail.core import GuardResult


class _ResponseFreshness:
    def __init__(
        self, *, action: str = "warn", current_year: int | None = None
    ) -> None:
        self.name = "response-freshness"
        self.action = action
        yr = current_year or datetime.now().year
        self._patterns: list[re.Pattern[str]] = [
            re.compile(
                rf"as of (20[0-1][0-9]|202[0-{max(yr - 2022, 0)}])",
                re.IGNORECASE,
            ),
            re.compile(
                rf"in (20[0-1][0-9]|202[0-{max(yr - 2022, 0)}]),",
                re.IGNORECASE,
            ),
            re.compile(r"deprecated\s+since\s+\d{4}", re.IGNORECASE),
            re.compile(r"end[- ]of[- ]life", re.IGNORECASE),
            re.compile(
                r"no\s+longer\s+(maintained|supported)", re.IGNORECASE
            ),
            re.compile(
                r"as\s+of\s+my\s+(last\s+)?training", re.IGNORECASE
            ),
            re.compile(
                r"as\s+of\s+my\s+knowledge\s+cutoff", re.IGNORECASE
            ),
            re.compile(r"Python\s+2\.\d"),
            re.compile(r"Java\s+[1-7]\b"),
            re.compile(r"Node\.?js\s+[0-9]\b"),
            re.compile(r"Angular\.?js\s+1\."),
            re.compile(r"React\s+1[0-5]\."),
        ]

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
            guard_name="response-freshness",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=score,
            message="Stale information detected" if triggered else None,
            latency_ms=round(elapsed, 2),
            details=(
                {"matched_patterns": len(matched)}
                if triggered
                else None
            ),
        )


def response_freshness(
    *, action: str = "warn", current_year: int | None = None
) -> _ResponseFreshness:
    return _ResponseFreshness(
        action=action, current_year=current_year
    )
