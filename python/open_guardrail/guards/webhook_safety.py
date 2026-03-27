"""Detects webhook and callback URL patterns."""

import re
import time
from typing import List

from open_guardrail.core import GuardResult

_PATTERNS = [
    re.compile(r"\bwebhook\b", re.I),
    re.compile(r"\bcallback\s*url\b", re.I),
    re.compile(r"\bPOST\s+https?://", re.I),
    re.compile(r"fetch\s*\(\s*['\"]https?://", re.I),
    re.compile(r"requests\.post\s*\(", re.I),
]


class _WebhookSafety:
    def __init__(self, *, action: str = "block") -> None:
        self.name = "webhook-safety"
        self.action = action

    def check(self, text: str, stage: str = "input") -> GuardResult:
        start = time.perf_counter()
        matched: List[str] = []
        for p in _PATTERNS:
            m = p.search(text)
            if m:
                matched.append(m.group()[:60])
        triggered = len(matched) > 0
        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(
            guard_name=self.name,
            passed=not triggered,
            action=self.action if triggered else "allow",
            message="Webhook/callback URL detected" if triggered else None,
            latency_ms=round(elapsed, 2),
            details={"matched": matched} if triggered else None,
        )


def webhook_safety(*, action: str = "block") -> _WebhookSafety:
    return _WebhookSafety(action=action)
