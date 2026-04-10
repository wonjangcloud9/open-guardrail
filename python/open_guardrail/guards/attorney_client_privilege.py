"""Detect and protect privileged communication markers."""
from __future__ import annotations

import re
import time

from open_guardrail.core import GuardResult

_PRIVILEGE = [
    re.compile(r"\battorney[- ]client\s+privilege\b", re.I),
    re.compile(r"\bprivileged\s+and\s+confidential\b", re.I),
    re.compile(r"\bwork\s+product\b", re.I),
    re.compile(r"\blitigation\s+hold\b", re.I),
    re.compile(r"\blegal\s+hold\b", re.I),
    re.compile(r"\bunder\s+privilege\b", re.I),
    re.compile(r"\bprivileged\s+communication\b", re.I),
    re.compile(r"\bprotected\s+by\s+attorney\b", re.I),
]

_SHARING = [
    re.compile(r"\bforward\s+this\b", re.I),
    re.compile(r"\bshare\s+with\b", re.I),
    re.compile(r"\bCC:", re.I),
    re.compile(r"\bsend\s+to\b", re.I),
    re.compile(r"\bpost\s+this\b", re.I),
    re.compile(r"\bmake\s+public\b", re.I),
]


class _AttorneyClientPrivilege:
    def __init__(self, *, action: str = "block") -> None:
        self.name = "attorney-client-privilege"
        self.action = action

    def check(self, text: str, stage: str = "output") -> GuardResult:
        start = time.perf_counter()
        priv: list[str] = []
        for p in _PRIVILEGE:
            m = p.search(text)
            if m:
                priv.append(m.group())
        sharing: list[str] = []
        for p in _SHARING:
            m = p.search(text)
            if m:
                sharing.append(m.group())
        triggered = len(priv) > 0 and len(sharing) > 0
        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(
            guard_name="attorney-client-privilege",
            passed=not triggered,
            action=self.action if triggered else "allow",
            message=f'Privileged content may be shared: "{priv[0]}" + "{sharing[0]}"' if triggered else None,
            latency_ms=round(elapsed, 2),
            details={"privilege_markers": priv, "sharing_indicators": sharing} if triggered else None,
        )


def attorney_client_privilege(*, action: str = "block") -> _AttorneyClientPrivilege:
    return _AttorneyClientPrivilege(action=action)
