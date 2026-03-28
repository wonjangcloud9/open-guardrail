"""Detect PII in sensitive sharing contexts."""

import re
import time
from typing import Optional

from open_guardrail.core import GuardResult

_PII_LIKE = re.compile(
    r"(?:\b\d{3}[-.]?\d{2}[-.]?\d{4}\b"
    r"|\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b"
    r"|\b\d{3}[-.]?\d{3}[-.]?\d{4}\b)"
)

_PII_FRAG = (
    r"(?:\d{3}[-.]?\d{2}[-.]?\d{4}"
    r"|\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+"
    r"\.[A-Za-z]{2,}"
    r"|\d{3}[-.]?\d{3}[-.]?\d{4})"
)

_CONTEXT_PATTERNS: list[re.Pattern[str]] = [
    re.compile(
        r"(?:share|send|post|publish|tweet|broadcast)"
        r"\s+(?:.*?)" + _PII_FRAG,
        re.IGNORECASE,
    ),
    re.compile(
        _PII_FRAG + r"(?:.*?)"
        r"(?:share|send|post|publish|tweet|broadcast)",
        re.IGNORECASE,
    ),
    re.compile(
        r"(?:subject|title)\s*[:=]\s*.*" + _PII_FRAG,
        re.IGNORECASE,
    ),
    re.compile(
        r"(?:https?://[^\s]*[?&][^\s]*=)"
        r"(?:.*?)" + _PII_FRAG,
        re.IGNORECASE,
    ),
    re.compile(
        r"(?:public|publicly|everyone)"
        r"\s+(?:.*?)" + _PII_FRAG,
        re.IGNORECASE,
    ),
]


class _PiiContext:
    def __init__(
        self, *, action: str = "block"
    ) -> None:
        self.name = "pii-context"
        self.action = action
        self._patterns = list(_CONTEXT_PATTERNS)

    def check(
        self, text: str, stage: str = "output"
    ) -> GuardResult:
        start = time.perf_counter()

        if not _PII_LIKE.search(text):
            elapsed = (time.perf_counter() - start) * 1000
            return GuardResult(
                guard_name="pii-context",
                passed=True,
                action="allow",
                score=0.0,
                latency_ms=round(elapsed, 2),
            )

        matched: list[str] = []
        for pat in self._patterns:
            if pat.search(text):
                matched.append(pat.pattern)

        triggered = len(matched) > 0
        score = (
            min(len(matched) / 2, 1.0) if triggered else 0.0
        )
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="pii-context",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=score,
            message=(
                "PII detected in sensitive context"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {"matched_patterns": len(matched)}
                if triggered
                else None
            ),
        )


def pii_context(
    *, action: str = "block"
) -> _PiiContext:
    return _PiiContext(action=action)
