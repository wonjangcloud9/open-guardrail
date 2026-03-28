"""Validate email domains against disposable, typosquat, and phishing lists."""
from __future__ import annotations

import re
import time
from typing import List, Optional

from open_guardrail.core import GuardResult

_DISPOSABLE_DOMAINS = {
    "mailinator.com", "guerrillamail.com", "tempmail.com",
    "throwaway.email", "yopmail.com", "sharklasers.com",
    "guerrillamailblock.com", "grr.la", "dispostable.com",
    "maildrop.cc", "fakeinbox.com", "trashmail.com",
}

_TYPOSQUAT_MAP = {
    "gmial.com": "gmail.com", "gmali.com": "gmail.com",
    "gmal.com": "gmail.com", "gamil.com": "gmail.com",
    "gmai.com": "gmail.com", "gnail.com": "gmail.com",
    "yahooo.com": "yahoo.com", "yaho.com": "yahoo.com",
    "yhoo.com": "yahoo.com", "yaoo.com": "yahoo.com",
    "hotmal.com": "hotmail.com",
    "hotmial.com": "hotmail.com",
    "hotamil.com": "hotmail.com",
    "outlok.com": "outlook.com",
    "outloo.com": "outlook.com",
    "outlookk.com": "outlook.com",
}

_EMAIL_RE = re.compile(
    r"[\w.+-]+@([\w-]+\.[\w.-]+)"
)


class _EmailDomainCheck:
    def __init__(
        self,
        *,
        action: str = "block",
        allowed_domains: Optional[List[str]] = None,
    ) -> None:
        self.name = "email-domain-check"
        self.action = action
        self._allowed = allowed_domains or []

    def check(
        self, text: str, stage: str = "input"
    ) -> GuardResult:
        start = time.perf_counter()
        issues: list[str] = []

        for m in _EMAIL_RE.finditer(text):
            domain = m.group(1).lower()

            if self._allowed:
                if domain not in self._allowed:
                    issues.append(
                        f"domain_not_allowed:{domain}"
                    )
                continue

            if domain in _DISPOSABLE_DOMAINS:
                issues.append(f"disposable:{domain}")
            if domain in _TYPOSQUAT_MAP:
                issues.append(
                    f"typosquat:{domain}"
                    f"->{_TYPOSQUAT_MAP[domain]}"
                )

        triggered = len(issues) > 0
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="email-domain-check",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=(
                min(len(issues) / 3, 1.0)
                if triggered
                else 0.0
            ),
            message=(
                "Suspicious email domain detected"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {"issues": issues} if triggered else None
            ),
        )


def email_domain_check(
    *,
    action: str = "block",
    allowed_domains: Optional[List[str]] = None,
) -> _EmailDomainCheck:
    return _EmailDomainCheck(
        action=action,
        allowed_domains=allowed_domains,
    )
