"""Detect spam link patterns."""
from __future__ import annotations

import re
import time

from open_guardrail.core import GuardResult

_URL_RE = re.compile(r"https?://[^\s]+", re.IGNORECASE)
_SHORTENER_RE = re.compile(
    r"https?://(bit\.ly|tinyurl|t\.co|goo\.gl"
    r"|ow\.ly|is\.gd|buff\.ly|adf\.ly|shorte\.st)",
    re.IGNORECASE,
)
_AFFILIATE_RE = re.compile(
    r"[?&](ref|aff|affiliate|partner|click_?id)=",
    re.IGNORECASE,
)
_UTM_HEAVY_RE = re.compile(
    r"utm_[a-z]+=\S+.*utm_[a-z]+=\S+"
    r".*utm_[a-z]+=\S+",
    re.IGNORECASE,
)
_SUSPICIOUS_TLD_RE = re.compile(
    r"https?://[^\s]+\."
    r"(xyz|top|click|work|loan|racing"
    r"|gq|ml|cf|tk|buzz)\b",
    re.IGNORECASE,
)


class _SpamLink:
    def __init__(
        self, *, action: str = "block", max_urls: int = 3
    ) -> None:
        self.name = "spam-link"
        self.action = action
        self._max_urls = max_urls

    def check(
        self, text: str, stage: str = "input"
    ) -> GuardResult:
        start = time.perf_counter()
        issues: list[str] = []

        urls = _URL_RE.findall(text)
        if len(urls) > self._max_urls:
            issues.append(f"too_many_urls:{len(urls)}")

        shorteners = _SHORTENER_RE.findall(text)
        if len(shorteners) >= 2:
            issues.append(
                f"shorteners:{len(shorteners)}"
            )

        if _AFFILIATE_RE.search(text):
            issues.append("affiliate_params")

        if _UTM_HEAVY_RE.search(text):
            issues.append("heavy_tracking")

        if _SUSPICIOUS_TLD_RE.search(text):
            issues.append("suspicious_tld")

        triggered = len(issues) > 0
        score = min(len(issues) / 3, 1.0) if triggered else 0.0
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="spam-link",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=score,
            message=(
                "Spam link pattern detected"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {
                    "issues": issues,
                    "url_count": len(urls),
                }
                if triggered
                else None
            ),
        )


def spam_link(
    *, action: str = "block", max_urls: int = 3
) -> _SpamLink:
    return _SpamLink(action=action, max_urls=max_urls)
