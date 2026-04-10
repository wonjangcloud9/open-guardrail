"""Detects gradual permission widening via dialogue."""
from __future__ import annotations

import re
import time

from open_guardrail.core import GuardResult

PROGRESSIVE_RE = [
    re.compile(r"can\s+you\s+also", re.I),
    re.compile(r"now\s+can\s+you", re.I),
    re.compile(r"one\s+more\s+thing", re.I),
]

AUTHORITY_RE = [
    re.compile(r"i'?m\s+the\s+admin", re.I),
    re.compile(r"i\s+have\s+permission", re.I),
    re.compile(r"i'?m\s+authorized", re.I),
    re.compile(r"my\s+boss\s+said", re.I),
]

OVERRIDE_RE = [
    re.compile(r"override\s+the\s+restriction", re.I),
    re.compile(r"bypass\s+the\s+limit", re.I),
    re.compile(r"make\s+an\s+exception", re.I),
]

URGENCY_RE = [
    re.compile(r"it'?s\s+urgent", re.I),
    re.compile(r"\bemergency\b", re.I),
    re.compile(r"time[- ]sensitive", re.I),
    re.compile(r"lives\s+at\s+stake", re.I),
]


class _PrivilegeEscalationConv:
    def __init__(self, *, action: str = "block") -> None:
        self.name = "privilege-escalation-conv"
        self.action = action

    def check(self, text: str, stage: str = "input") -> GuardResult:
        start = time.perf_counter()
        flags = {
            "progressive": any(p.search(text) for p in PROGRESSIVE_RE),
            "authority": any(p.search(text) for p in AUTHORITY_RE),
            "override": any(p.search(text) for p in OVERRIDE_RE),
            "urgency": any(p.search(text) for p in URGENCY_RE),
        }

        score = sum(1 for v in flags.values() if v)
        triggered = score >= 2 or flags["authority"] or flags["override"]
        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(
            guard_name="privilege-escalation-conv",
            passed=not triggered,
            action=self.action if triggered else "allow",
            message=f"Privilege escalation detected (risk score: {score}/4)" if triggered else None,
            latency_ms=round(elapsed, 2),
            details={**flags, "risk_score": score} if triggered else None,
        )


def privilege_escalation_conv(*, action: str = "block") -> _PrivilegeEscalationConv:
    return _PrivilegeEscalationConv(action=action)
