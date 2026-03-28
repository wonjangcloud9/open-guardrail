"""Validate webhook signature patterns and detect replay attacks."""
from __future__ import annotations

import re
import time
from typing import Optional

from open_guardrail.core import GuardResult

_TIMESTAMP_RE = re.compile(r"timestamp[=:]\s*(\d+)", re.IGNORECASE)
_DUP_DELIVERY_RE = re.compile(
    r"x-delivery-id[=:]\s*(\S+).*x-delivery-id[=:]\s*\1",
    re.IGNORECASE | re.DOTALL,
)


class _WebhookSignature:
    def __init__(
        self,
        *,
        action: str = "block",
        max_age_ms: int = 300000,
    ) -> None:
        self.name = "webhook-signature"
        self.action = action
        self._max_age_ms = max_age_ms

    def check(
        self, text: str, stage: str = "input"
    ) -> GuardResult:
        start = time.perf_counter()
        issues: list[str] = []

        lower = text.lower()
        has_webhook = "webhook" in lower
        if has_webhook and "x-hub-signature" not in lower:
            issues.append("missing_hub_signature")
        if has_webhook and "x-webhook-signature" not in lower:
            issues.append("missing_webhook_signature")

        m = _TIMESTAMP_RE.search(text)
        if m:
            ts = int(m.group(1))
            now_ms = int(time.time() * 1000)
            if now_ms - ts > self._max_age_ms:
                issues.append("timestamp_too_old")

        if _DUP_DELIVERY_RE.search(text):
            issues.append("replay_attack_pattern")

        triggered = len(issues) > 0
        score = min(len(issues) / 3, 1.0) if triggered else 0.0
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="webhook-signature",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=score,
            message=(
                "Webhook signature issue detected"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {"issues": issues} if triggered else None
            ),
        )


def webhook_signature(
    *,
    action: str = "block",
    max_age_ms: int = 300000,
) -> _WebhookSignature:
    return _WebhookSignature(
        action=action, max_age_ms=max_age_ms
    )
