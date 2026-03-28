"""Classify content age rating and block above threshold."""
from __future__ import annotations

import re
import time

from open_guardrail.core import GuardResult

_RATING_ORDER = ["G", "PG", "PG-13", "R", "NC-17"]

_NC17 = [
    re.compile(r"explicit\s+sexual", re.I),
    re.compile(r"graphic\s+(sex|nudity)", re.I),
    re.compile(r"pornograph", re.I),
    re.compile(r"hardcore", re.I),
]

_R = [
    re.compile(r"\bf[*u][*c][*k]", re.I),
    re.compile(r"\bshit\b", re.I),
    re.compile(r"\bass\b", re.I),
    re.compile(r"gore\b", re.I),
    re.compile(r"bloody\s+violence", re.I),
    re.compile(r"drug\s+use", re.I),
    re.compile(r"graphic\s+violence", re.I),
    re.compile(r"brutal", re.I),
]

_PG13 = [
    re.compile(r"\bdamn\b", re.I),
    re.compile(r"\bhell\b", re.I),
    re.compile(r"\bcrap\b", re.I),
    re.compile(r"violence", re.I),
    re.compile(r"\bkill", re.I),
    re.compile(r"\bdeath\b", re.I),
    re.compile(r"\bweapon", re.I),
    re.compile(r"\bblood\b", re.I),
]

_PG = [
    re.compile(r"\bscary\b", re.I),
    re.compile(r"\bfrightening\b", re.I),
    re.compile(r"mild\s+language", re.I),
    re.compile(r"\bthreat", re.I),
    re.compile(r"\bdanger", re.I),
]


def _classify(text: str) -> str:
    for p in _NC17:
        if p.search(text):
            return "NC-17"
    for p in _R:
        if p.search(text):
            return "R"
    for p in _PG13:
        if p.search(text):
            return "PG-13"
    for p in _PG:
        if p.search(text):
            return "PG"
    return "G"


class _ContentAgeRating:
    def __init__(
        self,
        *,
        action: str = "block",
        max_rating: str = "PG-13",
    ) -> None:
        self.name = "content-age-rating"
        self.action = action
        self._max = max_rating

    def check(
        self, text: str, stage: str = "output"
    ) -> GuardResult:
        start = time.perf_counter()
        detected = _classify(text)
        d_idx = _RATING_ORDER.index(detected)
        m_idx = _RATING_ORDER.index(self._max)
        triggered = d_idx > m_idx
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="content-age-rating",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=d_idx / 4 if triggered else 0.0,
            message=(
                f"Content rated {detected}"
                f" exceeds {self._max}"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details={
                "rating": detected,
                "max_allowed": self._max,
            },
        )


def content_age_rating(
    *,
    action: str = "block",
    max_rating: str = "PG-13",
) -> _ContentAgeRating:
    return _ContentAgeRating(
        action=action, max_rating=max_rating
    )
