"""Detect or require source attribution."""
from __future__ import annotations

import re
import time

from open_guardrail.core import GuardResult

_SOURCE_PATTERNS = [
    re.compile(
        r"according\s+to", re.IGNORECASE
    ),
    re.compile(r"source\s*:", re.IGNORECASE),
    re.compile(
        r"reference\s*:", re.IGNORECASE
    ),
    re.compile(r"\[\d+\]"),
    re.compile(
        r"(?:cited|citation)\s+(?:from|in)",
        re.IGNORECASE,
    ),
    re.compile(
        r"\(\s*\w+(?:\s+et\s+al\.?)?,?\s*"
        r"\d{4}\s*\)",
    ),
    re.compile(r"doi:\s*\S+", re.IGNORECASE),
    re.compile(
        r"https?://\S+", re.IGNORECASE
    ),
]


class _SourceAttribution:
    def __init__(
        self,
        *,
        action: str = "warn",
        require_sources: bool = False,
    ) -> None:
        self.name = "source-attribution"
        self.action = action
        self._require = require_sources

    def check(
        self, text: str, stage: str = "input"
    ) -> GuardResult:
        start = time.perf_counter()
        found: list[str] = []

        for pat in _SOURCE_PATTERNS:
            match = pat.search(text)
            if match:
                found.append(match.group())

        elapsed = (
            time.perf_counter() - start
        ) * 1000

        if self._require and not found:
            return GuardResult(
                guard_name="source-attribution",
                passed=False,
                action=self.action,
                message=(
                    "No source attribution found"
                ),
                latency_ms=round(elapsed, 2),
                details={
                    "reason": (
                        "Sources are required but"
                        " none were detected"
                    ),
                },
            )

        if not self._require and found:
            return GuardResult(
                guard_name="source-attribution",
                passed=True,
                action="allow",
                latency_ms=round(elapsed, 2),
                details={"sources_found": found},
            )

        return GuardResult(
            guard_name="source-attribution",
            passed=True,
            action="allow",
            latency_ms=round(elapsed, 2),
        )


def source_attribution(
    *,
    action: str = "warn",
    require_sources: bool = False,
) -> _SourceAttribution:
    return _SourceAttribution(
        action=action,
        require_sources=require_sources,
    )
