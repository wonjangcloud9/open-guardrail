"""Detect fabricated/hallucinated URLs in LLM output."""
from __future__ import annotations

import re
import time
from urllib.parse import urlparse

from open_guardrail.core import GuardResult

_URL_RE = re.compile(r"https?://[^\s\"'<>)\]]+", re.I)
_ARXIV_ID = re.compile(r"^(\d{4}\.\d{4,5})(v\d+)?$")


def _check(url: str) -> str | None:
    if re.search(r"\b(?:127\.0\.0\.1|localhost|\.local\b|\.internal\b)", url, re.I):
        return "internal-url"
    if len(url) > 200:
        return "excessively-long-url"
    arxiv = re.search(r"arxiv\.org/abs/(.+?)(?:[?#]|$)", url)
    if arxiv and not _ARXIV_ID.match(arxiv.group(1)):
        return "invalid-arxiv-id"
    try:
        parsed = urlparse(url)
        segs = [s for s in (parsed.path or "").split("/") if s]
        if len(segs) >= 4:
            rand = [s for s in segs if re.match(r"^[a-f0-9]{8,}$", s, re.I) or re.match(r"^[A-Za-z0-9_-]{20,}$", s)]
            if len(rand) >= 2:
                return "random-path-segments"
        tld = (parsed.hostname or "").split(".")[-1]
        if tld.lower() in ("xyz123", "notreal", "fake", "test123"):
            return "suspicious-tld"
    except Exception:
        return "malformed-url"
    return None


class _HallucinatedUrl:
    def __init__(self, *, action: str = "warn") -> None:
        self.name = "hallucinated-url"
        self.action = action

    def check(self, text: str, stage: str = "output") -> GuardResult:
        start = time.perf_counter()
        urls = _URL_RE.findall(text)
        flagged: list[dict[str, str]] = []
        for u in urls:
            reason = _check(u)
            if reason:
                flagged.append({"url": u, "reason": reason})
        triggered = len(flagged) > 0
        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(
            guard_name="hallucinated-url",
            passed=not triggered,
            action=self.action if triggered else "allow",
            message=f"{len(flagged)} potentially hallucinated URL(s)" if triggered else None,
            latency_ms=round(elapsed, 2),
            details={"flagged_urls": flagged} if triggered else None,
        )


def hallucinated_url(*, action: str = "warn") -> _HallucinatedUrl:
    return _HallucinatedUrl(action=action)
