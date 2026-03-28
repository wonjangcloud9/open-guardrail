"""Validate links/URLs for safety."""
from __future__ import annotations

import re
import time

from open_guardrail.core import GuardResult

_URL_RE = re.compile(
    r"https?://[^\s\"'<>]+"
    r"|data:[^\s\"'<>]+"
    r"|javascript:[^\s\"'<>]+",
    re.IGNORECASE,
)

_SHORTENERS = [
    "bit.ly", "tinyurl.com", "t.co", "goo.gl",
    "ow.ly", "is.gd", "buff.ly", "adf.ly",
    "bl.ink", "short.io", "rb.gy", "cutt.ly",
    "shorturl.at",
]

_SUS_TLDS = [".tk", ".ml", ".ga", ".cf", ".gq"]
_DATA_URI = re.compile(r"^data:", re.IGNORECASE)
_JS_URI = re.compile(r"^javascript:", re.IGNORECASE)
_IP_URL = re.compile(
    r"https?://\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}",
    re.IGNORECASE,
)
_PUNYCODE = re.compile(r"xn--", re.IGNORECASE)


class _LinkSafety:
    def __init__(
        self,
        *,
        action: str = "block",
        allow_shortened: bool = False,
    ) -> None:
        self.name = "link-safety"
        self.action = action
        self._allow_short = allow_shortened

    def check(
        self, text: str, stage: str = "input"
    ) -> GuardResult:
        start = time.perf_counter()
        urls = _URL_RE.findall(text)
        issues: list[str] = []

        for url in urls:
            if _DATA_URI.search(url):
                issues.append(f"data_uri")
            if _JS_URI.search(url):
                issues.append(f"javascript_uri")
            if _IP_URL.search(url):
                issues.append(f"ip_url")
            if _PUNYCODE.search(url):
                issues.append(f"punycode_homograph")

            lower = url.lower()
            if not self._allow_short:
                for d in _SHORTENERS:
                    if d in lower:
                        issues.append(f"shortened_url")
                        break

            for tld in _SUS_TLDS:
                if tld + "/" in lower or lower.endswith(tld):
                    issues.append(f"suspicious_tld")
                    break

        unique = list(dict.fromkeys(issues))
        triggered = len(unique) > 0
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="link-safety",
            passed=not triggered,
            action=(
                self.action if triggered else "allow"
            ),
            score=(
                min(len(unique) / 3, 1.0)
                if triggered
                else 0.0
            ),
            message=(
                f"Unsafe links: {len(unique)} issue(s)"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {
                    "issues": unique,
                    "url_count": len(urls),
                }
                if triggered
                else None
            ),
        )


def link_safety(
    *,
    action: str = "block",
    allow_shortened: bool = False,
) -> _LinkSafety:
    return _LinkSafety(
        action=action,
        allow_shortened=allow_shortened,
    )
