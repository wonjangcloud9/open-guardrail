"""Validate webhook requests for integrity."""
from __future__ import annotations

import re
import time
from typing import Optional

from open_guardrail.core import GuardResult

_HMAC_RE = re.compile(
    r"^[a-fA-F0-9]{64}$|^sha256=[a-fA-F0-9]{64}$"
)
_TS_RE = re.compile(r"^\d{10,13}$")


class _WebhookValidate:
    def __init__(
        self,
        *,
        action: str = "block",
        max_payload_size: int = 1_048_576,
    ) -> None:
        self.name = "webhook-validate"
        self.action = action
        self.max_payload_size = max_payload_size

    def check(
        self,
        text: str,
        stage: str = "input",
        *,
        signature: Optional[str] = None,
        timestamp: Optional[str] = None,
        headers: Optional[dict] = None,
    ) -> GuardResult:
        start = time.perf_counter()
        issues: list[str] = []

        if len(text.encode("utf-8")) > self.max_payload_size:
            issues.append("payload_size_exceeded")

        if signature is None:
            issues.append("missing_signature")
        elif not _HMAC_RE.match(signature):
            issues.append("invalid_signature_format")

        if timestamp is None:
            issues.append("missing_timestamp")
        elif not _TS_RE.match(timestamp):
            issues.append("invalid_timestamp_format")

        if headers is not None:
            required = ["content-type"]
            for h in required:
                lower_keys = [
                    k.lower() for k in headers.keys()
                ]
                if h not in lower_keys:
                    issues.append(f"missing_header_{h}")

        triggered = len(issues) > 0
        score = min(len(issues) / 4, 1.0) if triggered else 0.0
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="webhook-validate",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=score,
            message=(
                "Webhook validation failed"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {
                    "issues": issues,
                    "reason": (
                        "Webhook request failed"
                        " integrity checks"
                    ),
                }
                if triggered
                else None
            ),
        )


def webhook_validate(
    *,
    action: str = "block",
    max_payload_size: int = 1_048_576,
) -> _WebhookValidate:
    return _WebhookValidate(
        action=action,
        max_payload_size=max_payload_size,
    )
