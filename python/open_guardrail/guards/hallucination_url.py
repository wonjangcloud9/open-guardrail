"""Detect hallucinated URLs in LLM output."""
from __future__ import annotations

import math
import re
import time
from typing import List, Optional

from open_guardrail.core import GuardResult

_URL_PATTERN = re.compile(
    r"https?://[^\s<>\"'\)]+", re.IGNORECASE
)

_VALID_TLDS = {
    "com", "org", "net", "edu", "gov", "io", "co",
    "dev", "app", "ai", "me", "info", "biz", "us",
    "uk", "de", "fr", "jp", "kr", "cn", "ru", "br",
    "in", "au", "ca", "it", "es", "nl", "se", "no",
    "fi", "dk", "pl", "cz", "at", "ch", "be", "pt",
    "ie", "nz", "za", "mx", "ar", "cl", "tw", "hk",
    "sg", "th", "vn", "id", "ph", "my", "xyz", "tech",
    "online", "site", "store", "cloud", "blog", "page",
}


def _entropy(s: str) -> float:
    if not s:
        return 0.0
    freq: dict[str, int] = {}
    for c in s:
        freq[c] = freq.get(c, 0) + 1
    length = len(s)
    return -sum(
        (count / length) * math.log2(count / length)
        for count in freq.values()
    )


def _has_repeated_segments(path: str) -> bool:
    parts = [p for p in path.split("/") if p]
    if len(parts) < 2:
        return False
    seen: set[str] = set()
    repeats = 0
    for part in parts:
        if part in seen:
            repeats += 1
        seen.add(part)
    return repeats >= 2


class _HallucinationUrl:
    def __init__(
        self,
        *,
        action: str = "warn",
        allowed_domains: Optional[List[str]] = None,
    ) -> None:
        self.name = "hallucination-url"
        self.action = action
        self._allowed = set(allowed_domains or [])

    def check(
        self, text: str, stage: str = "output"
    ) -> GuardResult:
        start = time.perf_counter()
        suspicious: list[str] = []

        for m in _URL_PATTERN.finditer(text):
            url = m.group(0).rstrip(".,;:!?)")
            try:
                domain = url.split("//", 1)[1].split("/", 1)[0]
                domain = domain.split(":")[0]
            except IndexError:
                continue

            if domain in self._allowed:
                continue

            tld = domain.rsplit(".", 1)[-1].lower()
            path = url.split("//", 1)[1]
            path = path.split("/", 1)[1] if "/" in path else ""

            if tld not in _VALID_TLDS:
                suspicious.append(url)
                continue

            if len(path) > 80 and _entropy(path) > 4.0:
                suspicious.append(url)
                continue

            path_parts = path.split("/")
            if any(
                _entropy(p) > 4.5 and len(p) > 15
                for p in path_parts
                if p
            ):
                suspicious.append(url)
                continue

            if _has_repeated_segments(path):
                suspicious.append(url)

        triggered = len(suspicious) > 0
        score = (
            min(len(suspicious) / 3, 1.0)
            if triggered
            else 0.0
        )
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="hallucination-url",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=score,
            message=(
                "Potentially hallucinated URLs detected"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {
                    "suspicious_urls": suspicious[:5],
                    "count": len(suspicious),
                    "reason": (
                        "URLs appear to be hallucinated"
                        " based on entropy, TLD, or"
                        " structural analysis"
                    ),
                }
                if triggered
                else None
            ),
        )


def hallucination_url(
    *,
    action: str = "warn",
    allowed_domains: Optional[List[str]] = None,
) -> _HallucinationUrl:
    return _HallucinationUrl(
        action=action, allowed_domains=allowed_domains
    )
