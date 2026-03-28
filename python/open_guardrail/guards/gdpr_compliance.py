"""GDPR compliance guard for data protection violations."""

import re
import time
from typing import Optional

from open_guardrail.core import GuardResult

_RETENTION_PATTERNS: list[re.Pattern[str]] = [
    re.compile(r"store\s+.*indefinitely", re.IGNORECASE),
    re.compile(r"never\s+delete", re.IGNORECASE),
    re.compile(r"retain\s+forever", re.IGNORECASE),
    re.compile(r"keep\s+permanently", re.IGNORECASE),
]

_CONSENT_PATTERNS: list[re.Pattern[str]] = [
    re.compile(r"without\s+consent", re.IGNORECASE),
    re.compile(r"implied\s+consent", re.IGNORECASE),
    re.compile(r"pre[-\s]?checked", re.IGNORECASE),
    re.compile(r"opt[-\s]?out\s+only", re.IGNORECASE),
]

_TRANSFER_PATTERNS: list[re.Pattern[str]] = [
    re.compile(
        r"share\s+user\s+data", re.IGNORECASE,
    ),
    re.compile(
        r"transfer\s+personal\s+data\s+outside",
        re.IGNORECASE,
    ),
    re.compile(
        r"send\s+data\s+to\s+third\s+part",
        re.IGNORECASE,
    ),
]

_ERASURE_PATTERNS: list[re.Pattern[str]] = [
    re.compile(r"cannot\s+delete", re.IGNORECASE),
    re.compile(
        r"unable\s+to\s+erase", re.IGNORECASE,
    ),
    re.compile(
        r"deletion\s+is\s+not\s+possible",
        re.IGNORECASE,
    ),
]


class _GdprCompliance:
    def __init__(
        self,
        *,
        action: str = "block",
        require_consent: bool = True,
        check_erasure: bool = True,
    ) -> None:
        self.name = "gdpr-compliance"
        self.action = action
        self._require_consent = require_consent
        self._check_erasure = check_erasure

    def check(
        self, text: str, stage: str = "input"
    ) -> GuardResult:
        start = time.perf_counter()
        violations: list[str] = []

        for pat in _RETENTION_PATTERNS:
            if pat.search(text):
                violations.append(
                    f"retention:{pat.pattern}"
                )

        if self._require_consent:
            for pat in _CONSENT_PATTERNS:
                if pat.search(text):
                    violations.append(
                        f"consent:{pat.pattern}"
                    )

        for pat in _TRANSFER_PATTERNS:
            if pat.search(text):
                violations.append(
                    f"transfer:{pat.pattern}"
                )

        if self._check_erasure:
            for pat in _ERASURE_PATTERNS:
                if pat.search(text):
                    violations.append(
                        f"erasure:{pat.pattern}"
                    )

        triggered = len(violations) > 0
        score = (
            min(len(violations) / 3, 1.0)
            if triggered
            else 0.0
        )
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="gdpr-compliance",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=score,
            message=(
                "GDPR compliance violation detected"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {
                    "violations": len(violations),
                    "categories": list(
                        {v.split(":")[0] for v in violations}
                    ),
                    "reason": (
                        "Text contains patterns that"
                        " violate GDPR requirements"
                    ),
                }
                if triggered
                else None
            ),
        )


def gdpr_compliance(
    *,
    action: str = "block",
    require_consent: bool = True,
    check_erasure: bool = True,
) -> _GdprCompliance:
    return _GdprCompliance(
        action=action,
        require_consent=require_consent,
        check_erasure=check_erasure,
    )
