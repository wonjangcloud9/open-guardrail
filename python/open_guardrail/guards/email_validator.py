"""Email format validation guard."""
from __future__ import annotations

import re
import time
from typing import List, Optional

from open_guardrail.core import GuardResult

_EMAIL_RE = re.compile(r"\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b")


class _EmailValidator:
    def __init__(self, *, action: str = "block", allowed_domains: Optional[List[str]] = None, denied_domains: Optional[List[str]] = None) -> None:
        self.name = "email-validator"
        self.action = action
        self.allowed = allowed_domains
        self.denied = denied_domains or []

    def check(self, text: str, stage: str = "input") -> GuardResult:
        start = time.perf_counter()
        emails = _EMAIL_RE.findall(text)
        violations: List[str] = []
        for email in emails:
            domain = email.split("@")[1].lower()
            if self.allowed is not None and domain not in self.allowed:
                violations.append(f"Domain not allowed: {domain}")
            if domain in self.denied:
                violations.append(f"Domain denied: {domain}")
        triggered = len(violations) > 0
        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(guard_name="email-validator", passed=not triggered, action=self.action if triggered else "allow", message=violations[0] if triggered else None, latency_ms=round(elapsed, 2), details={"violations": violations, "emails_found": len(emails)} if triggered else None)


def email_validator(*, action: str = "block", allowed_domains: Optional[List[str]] = None, denied_domains: Optional[List[str]] = None) -> _EmailValidator:
    return _EmailValidator(action=action, allowed_domains=allowed_domains, denied_domains=denied_domains)
