"""Enforce data residency within FedRAMP boundaries."""
from __future__ import annotations
import re, time
from open_guardrail.core import GuardResult

_GOV_CTX = re.compile(r"\b(?:federal|\.gov|agency|classified|government\s+data|dod|department\s+of)\b", re.I)
_TRANSFER = re.compile(r"\b(?:send\s+to|upload\s+to|store\s+in|transfer\s+to|export\s+to|share\s+externally|migrate\s+to)\b", re.I)
_NON_COMPLIANT = re.compile(r"\b(?:S3\s+bucket|Azure\s+blob|GCS|Google\s+Cloud\s+Storage)\b", re.I)
_FEDRAMP_OK = re.compile(r"\b(?:FedRAMP\s+authorized|gov[- ]?cloud|GovCloud|IL[45])\b", re.I)
_THIRD_PARTY = re.compile(r"\b(?:Dropbox|Box\.com|OneDrive|iCloud|mega\.nz|WeTransfer)\b", re.I)

class _FedrampDataBoundary:
    def __init__(self, *, action="block"):
        self.name = "fedramp-data-boundary"; self.action = action
    def check(self, text, stage="output"):
        start = time.perf_counter(); issues = []
        has_gov = bool(_GOV_CTX.search(text))
        if has_gov:
            if _TRANSFER.search(text): issues.append("cross-boundary transfer detected")
            if _NON_COMPLIANT.search(text) and not _FEDRAMP_OK.search(text):
                issues.append("non-FedRAMP-qualified cloud storage")
            if _THIRD_PARTY.search(text): issues.append("third-party external service")
        triggered = len(issues) > 0; elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(guard_name="fedramp-data-boundary", passed=not triggered,
            action=self.action if triggered else "allow",
            message=f"FedRAMP boundary violation: {'; '.join(issues)}" if triggered else None,
            latency_ms=round(elapsed, 2),
            details={"issues": issues, "gov_context": has_gov} if triggered else None)

def fedramp_data_boundary(*, action="block"):
    return _FedrampDataBoundary(action=action)
