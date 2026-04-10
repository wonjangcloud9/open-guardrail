"""Flag content requiring FOIA redaction before public release."""
from __future__ import annotations
import re, time
from open_guardrail.core import GuardResult

_FOIA_CTX = re.compile(r"\b(?:FOIA\s+request|public\s+records?\s+request|freedom\s+of\s+information)\b", re.I)
_EXEMPTIONS = {
    "exemption-1-national-security": re.compile(
        r"\b(?:classified|national\s+defense|foreign\s+relations|intelligence\s+source)\b", re.I),
    "exemption-4-trade-secrets": re.compile(
        r"\b(?:trade\s+secret|proprietary|confidential\s+business|commercial\s+information)\b", re.I),
    "exemption-5-deliberative": re.compile(
        r"\b(?:draft\s+policy|internal\s+deliberation|pre[- ]decisional|attorney[- ]work\s+product)\b", re.I),
    "exemption-6-personal-privacy": re.compile(
        r"\b(?:social\s+security\s+number|SSN|date\s+of\s+birth|medical\s+(?:record|history|condition)|home\s+address)\b", re.I),
    "exemption-7-law-enforcement": re.compile(
        r"\b(?:ongoing\s+investigation|confidential\s+informant|surveillance\s+(?:target|operation)|law\s+enforcement\s+technique)\b", re.I),
}

class _FoiaRedaction:
    def __init__(self, *, action="block"):
        self.name = "foia-redaction"; self.action = action
    def check(self, text, stage="output"):
        start = time.perf_counter(); flagged = []
        if _FOIA_CTX.search(text):
            for exemption, pat in _EXEMPTIONS.items():
                if pat.search(text): flagged.append(exemption)
        triggered = len(flagged) > 0; elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(guard_name="foia-redaction", passed=not triggered,
            action=self.action if triggered else "allow",
            message=f"FOIA redaction needed: {', '.join(flagged)}" if triggered else None,
            latency_ms=round(elapsed, 2),
            details={"exemptions": flagged} if triggered else None)

def foia_redaction(*, action="block"):
    return _FoiaRedaction(action=action)
