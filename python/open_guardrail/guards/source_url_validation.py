"""Validate URLs in citations are well-formed and not fabricated."""
from __future__ import annotations

import re
import time
from typing import List, Optional

from open_guardrail.core import GuardResult

_URL_RE = re.compile(r"https?://[^\s\"'<>)\]]+")

_SUSPICIOUS_DOMAINS = [
    "localhost",
    "127.0.0.1",
    ".example.com",
    ".test",
    ".invalid",
]


def _extract_domain(url: str) -> Optional[str]:
    m = re.match(r"^https?://([^/:]+)", url)
    return m.group(1) if m else None


def _is_fabricated_path(url: str) -> bool:
    if len(url) > 500:
        return True
    m = re.match(r"^https?://[^/]+(/.*)", url)
    if not m:
        return False
    segments = [s for s in m.group(1).split("/") if s]
    random_segs = [
        s
        for s in segments
        if re.fullmatch(r"[a-zA-Z0-9]{20,}", s)
        and not re.fullmatch(r"[a-fA-F0-9]{32,40}", s)
    ]
    return len(random_segs) >= 2


class _SourceUrlValidation:
    def __init__(
        self,
        *,
        action: str = "warn",
        allowed_domains: Optional[List[str]] = None,
    ) -> None:
        self.name = "source-url-validation"
        self.action = action
        self.allowed_domains = allowed_domains

    def check(self, text: str, stage: str = "output") -> GuardResult:
        start = time.perf_counter()
        urls = _URL_RE.findall(text)
        issues: List[str] = []

        for url in urls:
            domain = _extract_domain(url)
            if not domain:
                issues.append(f"Invalid URL: {url[:80]}")
                continue
            if "." not in domain or " " in domain:
                issues.append(f"Invalid domain: {domain}")
                continue
            suspicious = any(
                domain == s or domain.endswith(s)
                for s in _SUSPICIOUS_DOMAINS
            )
            if suspicious:
                issues.append(f"Suspicious domain: {domain}")
                continue
            if self.allowed_domains is not None:
                allowed = any(
                    domain == d or domain.endswith("." + d)
                    for d in self.allowed_domains
                )
                if not allowed:
                    issues.append(f"Domain not in allowlist: {domain}")
                    continue
            if _is_fabricated_path(url):
                issues.append(f"Fabricated-looking URL: {url[:80]}")

        triggered = len(issues) > 0
        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(
            guard_name=self.name,
            passed=not triggered,
            action=self.action if triggered else "allow",
            message="; ".join(issues) if triggered else None,
            latency_ms=round(elapsed, 2),
            details={"url_count": len(urls), "issues": issues} if triggered else None,
        )


def source_url_validation(
    *,
    action: str = "warn",
    allowed_domains: Optional[List[str]] = None,
) -> _SourceUrlValidation:
    return _SourceUrlValidation(
        action=action, allowed_domains=allowed_domains
    )
