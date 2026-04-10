"""Detect claims with sources but no proper citation."""
from __future__ import annotations

import re
import time
from typing import List, Optional

from open_guardrail.core import GuardResult

_DEFAULT_CITATION_PATTERNS = [
    "[1]", "[2]", "(source", "(ref",
    "http://", "https://", "doi:", "arxiv:", "ISBN",
]

_CLAIM_INDICATORS: list[re.Pattern[str]] = [
    re.compile(r"\baccording\s+to\b", re.IGNORECASE),
    re.compile(r"\bresearch\s+shows?\b", re.IGNORECASE),
    re.compile(r"\bstudies\s+indicate\b", re.IGNORECASE),
    re.compile(r"\bbased\s+on\b", re.IGNORECASE),
    re.compile(r"\bas\s+reported\b", re.IGNORECASE),
    re.compile(r"\bdata\s+suggests?\b", re.IGNORECASE),
    re.compile(r"\bevidence\s+shows?\b", re.IGNORECASE),
]


class _CitationPresence:
    def __init__(
        self,
        *,
        action: str = "warn",
        citation_patterns: Optional[List[str]] = None,
    ) -> None:
        self.name = "citation-presence"
        self.action = action
        self._patterns = (
            citation_patterns
            if citation_patterns is not None
            else _DEFAULT_CITATION_PATTERNS
        )

    def check(
        self, text: str, stage: str = "output"
    ) -> GuardResult:
        start = time.perf_counter()
        lower = text.lower()

        has_claim = any(
            p.search(text) for p in _CLAIM_INDICATORS
        )
        has_citation = any(
            p.lower() in lower for p in self._patterns
        )

        triggered = has_claim and not has_citation
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="citation-presence",
            passed=not triggered,
            action=self.action if triggered else "allow",
            message=(
                "Claim indicators found without citations"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {
                    "reason": (
                        "Claim indicators found"
                        " without citation patterns"
                    ),
                }
                if triggered
                else None
            ),
        )


def citation_presence(
    *,
    action: str = "warn",
    citation_patterns: Optional[List[str]] = None,
) -> _CitationPresence:
    return _CitationPresence(
        action=action,
        citation_patterns=citation_patterns,
    )
