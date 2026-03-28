"""Encoding normalization and mixed-encoding attack detection."""
from __future__ import annotations

import re
import time

from open_guardrail.core import GuardResult

_FULLWIDTH = re.compile(r"[\uff01-\uff5e]")
_COMBINING = re.compile(r"[\u0300-\u036f]{2,}")
_MIXED_SCRIPT = re.compile(
    r"[\u0400-\u04ff].*[a-zA-Z]"
    r"|[a-zA-Z].*[\u0400-\u04ff]"
)
_HTML_ENTITY = re.compile(
    r"&(?:#\d{2,5}|#x[0-9a-fA-F]{2,4}|[a-z]+);"
)


class _EncodingNormalize:
    def __init__(self, *, action: str = "block") -> None:
        self.name = "encoding-normalize"
        self.action = action

    def check(
        self, text: str, stage: str = "input"
    ) -> GuardResult:
        start = time.perf_counter()
        issues: list[str] = []

        if _FULLWIDTH.search(text):
            issues.append("fullwidth-chars")
        if _COMBINING.search(text):
            issues.append("combining-diacriticals")
        if _MIXED_SCRIPT.search(text):
            issues.append("mixed-script")
        if _HTML_ENTITY.search(text):
            issues.append("html-entities")

        triggered = len(issues) > 0
        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(
            guard_name="encoding-normalize",
            passed=not triggered,
            action=self.action if triggered else "allow",
            message=(
                "Encoding anomalies detected"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {"issues": issues} if triggered else None
            ),
        )


def encoding_normalize(
    *, action: str = "block"
) -> _EncodingNormalize:
    return _EncodingNormalize(action=action)
