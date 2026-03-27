"""URL validation and filtering guard."""

import re
import time
from typing import List, Optional

from open_guardrail.core import GuardResult

_URL_RE = re.compile(r"https?://[^\s<>\"']+", re.I)


class _UrlGuard:
    def __init__(self, *, action: str = "block", allowed_domains: Optional[List[str]] = None, denied_domains: Optional[List[str]] = None) -> None:
        self.name = "url-guard"
        self.action = action
        self.allowed = allowed_domains
        self.denied = denied_domains or []

    def check(self, text: str, stage: str = "input") -> GuardResult:
        start = time.perf_counter()
        urls = _URL_RE.findall(text)
        violations: List[str] = []
        for url in urls:
            domain = url.split("/")[2].lower() if len(url.split("/")) > 2 else ""
            if self.allowed is not None and not any(d in domain for d in self.allowed):
                violations.append(f"Domain not allowed: {domain}")
            if any(d in domain for d in self.denied):
                violations.append(f"Domain denied: {domain}")
        triggered = len(violations) > 0
        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(guard_name="url-guard", passed=not triggered, action=self.action if triggered else "allow", message=violations[0] if triggered else None, latency_ms=round(elapsed, 2), details={"violations": violations, "urls_found": len(urls)} if triggered else None)


def url_guard(*, action: str = "block", allowed_domains: Optional[List[str]] = None, denied_domains: Optional[List[str]] = None) -> _UrlGuard:
    return _UrlGuard(action=action, allowed_domains=allowed_domains, denied_domains=denied_domains)
