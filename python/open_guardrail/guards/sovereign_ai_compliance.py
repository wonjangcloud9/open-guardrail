"""Enforce jurisdiction-specific AI regulations."""
from __future__ import annotations
import re, time
from open_guardrail.core import GuardResult

_DATA_LOC = re.compile(r"\b(?:process\s+in|store\s+in|host\s+in|transfer\s+(?:to|outside)|data\s+(?:residency|sovereignty|localization))\b", re.I)
_MODEL_GOV = re.compile(r"\b(?:(?:use|deploy|rely\s+on)\s+(?:a\s+)?(?:foreign|non[- ]domestic|overseas|external)\s+(?:AI|model|LLM)|cross[- ]border\s+AI\s+service)\b", re.I)
_REGS: dict[str, re.Pattern] = {
    "eu": re.compile(r"\b(?:EU\s+AI\s+Act|GDPR|General\s+Data\s+Protection)\b", re.I),
    "china": re.compile(r"\b(?:PIPL|CAC|Cyberspace\s+Administration|Chinese\s+AI\s+regulation)\b", re.I),
    "korea": re.compile(r"\b(?:PIPA|개인정보보호법|한국\s*AI|Korean\s+AI\s+regulation)\b", re.I),
    "us": re.compile(r"\b(?:Executive\s+Order\s+on\s+AI|NIST\s+AI\s+RMF|FedRAMP)\b", re.I),
    "brazil": re.compile(r"\b(?:LGPD|Brazilian\s+AI)\b", re.I),
    "canada": re.compile(r"\b(?:AIDA|Artificial\s+Intelligence\s+and\s+Data\s+Act)\b", re.I),
}
_ACK = re.compile(r"\b(?:in\s+compliance\s+with|compliant|authorized|approved\s+for|meets?\s+(?:regulatory|compliance)\s+requirements)\b", re.I)

class _SovereignAiCompliance:
    def __init__(self, *, action="block", jurisdiction="global"):
        self.name = "sovereign-ai-compliance"; self.action = action
        self._jur = jurisdiction.lower()
    def check(self, text, stage="output"):
        start = time.perf_counter(); issues = []
        has_loc = bool(_DATA_LOC.search(text))
        has_gov = bool(_MODEL_GOV.search(text))
        has_ack = bool(_ACK.search(text))
        if has_loc and not has_ack:
            issues.append("data locality concern without compliance acknowledgment")
        if has_gov and not has_ack:
            issues.append("cross-jurisdictional AI usage without compliance acknowledgment")
        if self._jur != "global":
            reg = _REGS.get(self._jur)
            if reg and not reg.search(text) and (has_loc or has_gov):
                issues.append(f"no reference to {self._jur.upper()} regulations")
            for jur, pat in _REGS.items():
                if jur == self._jur: continue
                if pat.search(text) and not has_ack:
                    issues.append(f"references {jur.upper()} regulation in {self._jur.upper()} context")
        triggered = len(issues) > 0; elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(guard_name="sovereign-ai-compliance", passed=not triggered,
            action=self.action if triggered else "allow",
            message=f"Sovereign AI issue: {issues[0]}" if triggered else None,
            latency_ms=round(elapsed, 2),
            details={"issues": issues, "jurisdiction": self._jur} if triggered else None)

def sovereign_ai_compliance(*, action="block", jurisdiction="global"):
    return _SovereignAiCompliance(action=action, jurisdiction=jurisdiction)
