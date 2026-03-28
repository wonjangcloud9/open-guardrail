"""Detect phishing URLs including homograph attacks."""
from __future__ import annotations

import re
import time
from urllib.parse import urlparse

from open_guardrail.core import GuardResult

_CYRILLIC_LATIN = {
    "\u0430": "a", "\u0435": "e",
    "\u043e": "o", "\u0440": "p",
    "\u0441": "c", "\u0443": "y",
    "\u0445": "x", "\u0456": "i",
}

_URL_RE = re.compile(r"https?://[^\s\"'<>]+", re.I)

_SUSPICIOUS_SUBS = {
    "login", "signin", "secure", "account",
    "verify", "update", "confirm", "bank",
}


def _has_homograph(url: str) -> bool:
    return any(c in _CYRILLIC_LATIN for c in url)


def _suspicious_subdomain(url: str) -> bool:
    try:
        host = urlparse(url).hostname or ""
        parts = host.split(".")
        if len(parts) <= 2:
            return False
        return any(
            p in _SUSPICIOUS_SUBS for p in parts[:-2]
        )
    except Exception:
        return False


def _is_ip_based(url: str) -> bool:
    try:
        host = urlparse(url).hostname or ""
        return bool(
            re.fullmatch(r"\d{1,3}(\.\d{1,3}){3}", host)
        )
    except Exception:
        return False


def _excessive_depth(url: str) -> bool:
    try:
        path = urlparse(url).path
        return len(
            [s for s in path.split("/") if s]
        ) > 8
    except Exception:
        return False


_DATA_URI_RE = re.compile(
    r"data:[^;]+;base64,", re.I
)


class _UrlPhishing:
    def __init__(self, *, action: str = "block") -> None:
        self.name = "url-phishing"
        self.action = action

    def check(
        self, text: str, stage: str = "input"
    ) -> GuardResult:
        start = time.perf_counter()
        issues: list[str] = []

        if _DATA_URI_RE.search(text):
            issues.append("data_uri")

        for m in _URL_RE.finditer(text):
            url = m.group(0)
            if _has_homograph(url):
                issues.append("homograph_attack")
            if _suspicious_subdomain(url):
                issues.append("suspicious_subdomain")
            if _is_ip_based(url):
                issues.append("ip_based_url")
            if _excessive_depth(url):
                issues.append("excessive_depth")

        triggered = len(issues) > 0
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="url-phishing",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=(
                min(len(issues) / 3, 1.0)
                if triggered
                else 0.0
            ),
            message=(
                "Phishing URL detected"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {"issues": issues} if triggered else None
            ),
        )


def url_phishing(
    *, action: str = "block"
) -> _UrlPhishing:
    return _UrlPhishing(action=action)
