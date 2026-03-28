"""Allowlist/denylist for domains in text."""
from __future__ import annotations

import re
import time
from typing import List, Optional

from open_guardrail.core import GuardResult

_URL_RE = re.compile(
    r"https?://([a-zA-Z0-9.-]+)"
)


def _extract_domains(text: str) -> list[str]:
    return [
        m.group(1).lower()
        for m in _URL_RE.finditer(text)
    ]


def _matches_domain(
    domain: str, pattern: str
) -> bool:
    p = pattern.lower()
    return domain == p or domain.endswith(
        "." + p
    )


class _DomainAllowlist:
    def __init__(
        self,
        *,
        action: str = "block",
        allowed_domains: Optional[List[str]] = None,
        denied_domains: Optional[List[str]] = None,
    ) -> None:
        self.name = "domain-allowlist"
        self.action = action
        self._allowed = allowed_domains or []
        self._denied = denied_domains or []

    def check(
        self, text: str, stage: str = "input"
    ) -> GuardResult:
        start = time.perf_counter()
        domains = _extract_domains(text)
        blocked: list[str] = []

        for d in domains:
            if self._denied and any(
                _matches_domain(d, p)
                for p in self._denied
            ):
                blocked.append(d)
                continue
            if self._allowed and not any(
                _matches_domain(d, p)
                for p in self._allowed
            ):
                blocked.append(d)

        triggered = len(blocked) > 0
        score = (
            min(len(blocked) / 3, 1.0)
            if triggered
            else 0.0
        )
        elapsed = (
            time.perf_counter() - start
        ) * 1000

        return GuardResult(
            guard_name="domain-allowlist",
            passed=not triggered,
            action=(
                self.action if triggered else "allow"
            ),
            score=score,
            message=(
                "Blocked domains found"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {"blocked_domains": blocked}
                if triggered
                else None
            ),
        )


def domain_allowlist(
    *,
    action: str = "block",
    allowed_domains: Optional[List[str]] = None,
    denied_domains: Optional[List[str]] = None,
) -> _DomainAllowlist:
    return _DomainAllowlist(
        action=action,
        allowed_domains=allowed_domains,
        denied_domains=denied_domains,
    )
