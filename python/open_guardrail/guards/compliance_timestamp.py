"""Audit timestamp compliance requirements."""

import re
import time

from open_guardrail.core import GuardResult

_ISO8601_RE = re.compile(
    r"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}"
)
_COMMON_DATE_RE = re.compile(
    r"\d{4}[-/]\d{2}[-/]\d{2}"
)
_UNIX_TS_RE = re.compile(r"\b\d{10,13}\b")


class _ComplianceTimestamp:
    def __init__(
        self,
        *,
        action: str = "warn",
        require_timestamp: bool = False,
        date_format: str = "iso8601",
    ) -> None:
        self.name = "compliance-timestamp"
        self.action = action
        self.require_timestamp = require_timestamp
        self.date_format = date_format

    def check(
        self, text: str, stage: str = "output"
    ) -> GuardResult:
        start = time.perf_counter()
        issues: list[str] = []

        has_iso = bool(_ISO8601_RE.search(text))
        has_date = bool(_COMMON_DATE_RE.search(text))
        has_unix = bool(_UNIX_TS_RE.search(text))
        has_any = has_iso or has_date or has_unix

        if self.require_timestamp and not has_any:
            issues.append("missing_timestamp")

        if has_any and self.date_format == "iso8601":
            if not has_iso and (has_date or has_unix):
                issues.append("non_iso8601_format")

        if has_any and self.date_format != "iso8601":
            fmt_re = re.compile(
                self.date_format.replace(
                    "YYYY", r"\d{4}"
                )
                .replace("MM", r"\d{2}")
                .replace("DD", r"\d{2}")
            )
            if not fmt_re.search(text):
                issues.append("wrong_date_format")

        triggered = len(issues) > 0
        score = min(len(issues) / 2, 1.0) if triggered else 0.0
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="compliance-timestamp",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=score,
            message=(
                "Timestamp compliance issue"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {
                    "issues": issues,
                    "has_timestamp": has_any,
                    "reason": (
                        "Text does not meet audit"
                        " timestamp requirements"
                    ),
                }
                if triggered
                else None
            ),
        )


def compliance_timestamp(
    *,
    action: str = "warn",
    require_timestamp: bool = False,
    date_format: str = "iso8601",
) -> _ComplianceTimestamp:
    return _ComplianceTimestamp(
        action=action,
        require_timestamp=require_timestamp,
        date_format=date_format,
    )
