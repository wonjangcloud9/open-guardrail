"""Audit-only guard for compliance logging."""

import time

from open_guardrail.core import GuardResult

_CATEGORIES = {
    "pii": [
        "social security", "ssn", "date of birth",
        "passport number", "driver license",
    ],
    "financial": [
        "bank account", "credit card", "routing number",
        "investment", "portfolio", "trading",
    ],
    "medical": [
        "diagnosis", "prescription", "patient",
        "medical record", "hipaa", "treatment plan",
    ],
    "legal": [
        "attorney", "litigation", "court order",
        "subpoena", "legal counsel", "contract",
    ],
}


class _ComplianceAuditLog:
    def __init__(self, *, action: str = "allow") -> None:
        self.name = "compliance-audit-log"
        self.action = "allow"

    def check(
        self, text: str, stage: str = "input"
    ) -> GuardResult:
        start = time.perf_counter()
        lower = text.lower()
        entries: dict[str, list[str]] = {}

        for cat, keywords in _CATEGORIES.items():
            matched = [k for k in keywords if k in lower]
            if matched:
                entries[cat] = matched

        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="compliance-audit-log",
            passed=True,
            action="allow",
            message=(
                f"Audit: {', '.join(entries.keys())}"
                if entries else None
            ),
            latency_ms=round(elapsed, 2),
            details={
                "audit_entries": entries,
                "categories_flagged": list(entries.keys()),
                "stage": stage,
            } if entries else {"audit_entries": {}, "stage": stage},
        )


def compliance_audit_log(
    *, action: str = "allow",
) -> _ComplianceAuditLog:
    return _ComplianceAuditLog(action=action)
