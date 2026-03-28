"""Limits the number of URLs/links in text."""
from __future__ import annotations

import re
import time

from open_guardrail.core import GuardResult

_URL_RE = re.compile(r"https?://[^\s<>\"']+", re.I)


class _MaxLinks:
    def __init__(self, *, action: str = "warn", max_count: int = 5) -> None:
        self.name = "max-links"
        self.action = action
        self.max_count = max_count

    def check(self, text: str, stage: str = "output") -> GuardResult:
        start = time.perf_counter()
        urls = _URL_RE.findall(text)
        triggered = len(urls) > self.max_count
        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(guard_name="max-links", passed=not triggered, action=self.action if triggered else "allow", message=f"Too many links: {len(urls)} > {self.max_count}" if triggered else None, latency_ms=round(elapsed, 2), details={"count": len(urls), "max": self.max_count} if triggered else None)


def max_links(*, action: str = "warn", max_count: int = 5) -> _MaxLinks:
    return _MaxLinks(action=action, max_count=max_count)
