"""Detects sandbox/container escape attempts in agent output."""
from __future__ import annotations

import re
import time
from typing import List, Optional

from open_guardrail.core import GuardResult

_ESCAPE_PATTERNS = [
    re.compile(r"/proc/self", re.IGNORECASE),
    re.compile(r"chroot", re.IGNORECASE),
    re.compile(r"docker\.sock", re.IGNORECASE),
    re.compile(r"/var/run/docker", re.IGNORECASE),
    re.compile(r"nsenter", re.IGNORECASE),
    re.compile(r"mount\s+-t", re.IGNORECASE),
    re.compile(r"capabilities", re.IGNORECASE),
    re.compile(r"CAP_SYS_ADMIN", re.IGNORECASE),
    re.compile(r"seccomp", re.IGNORECASE),
    re.compile(r"apparmor\s*bypass", re.IGNORECASE),
    re.compile(r"breakout", re.IGNORECASE),
    re.compile(r"container\s*escape", re.IGNORECASE),
    re.compile(r"host\s*network", re.IGNORECASE),
    re.compile(r"privileged\s*mode", re.IGNORECASE),
    re.compile(r"--privileged", re.IGNORECASE),
    re.compile(r"/dev/sda", re.IGNORECASE),
    re.compile(r"kernel\s*exploit", re.IGNORECASE),
    re.compile(r"ptrace", re.IGNORECASE),
    re.compile(r"/proc/1/root", re.IGNORECASE),
]


class _SandboxEscapeGuard:
    def __init__(self, *, action: str = "block") -> None:
        self.name = "sandbox-escape"
        self.action = action

    def check(self, text: str, stage: str = "input") -> GuardResult:
        start = time.perf_counter()
        matched: List[str] = []

        for pattern in _ESCAPE_PATTERNS:
            m = pattern.search(text)
            if m:
                matched.append(m.group(0))

        triggered = len(matched) > 0
        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(
            guard_name="sandbox-escape",
            passed=not triggered,
            action=self.action if triggered else "allow",
            message=f"Sandbox escape patterns detected: {', '.join(matched)}" if triggered else None,
            latency_ms=round(elapsed, 2),
            details={"matched_patterns": matched, "count": len(matched)} if triggered else None,
        )


def sandbox_escape(*, action: str = "block") -> _SandboxEscapeGuard:
    return _SandboxEscapeGuard(action=action)
