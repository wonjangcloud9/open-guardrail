"""Detect and enforce classification markings in AI outputs."""
from __future__ import annotations
import re, time
from open_guardrail.core import GuardResult

_MARKINGS = {
    "top_secret": re.compile(r"\bTOP\s+SECRET\b"),
    "secret": re.compile(r"\bSECRET\b"),
    "confidential": re.compile(r"\bCONFIDENTIAL\b"),
    "cui": re.compile(r"\bCUI\b"),
    "fouo": re.compile(r"\bFOUO\b"),
    "sbu": re.compile(r"\bSBU\b"),
    "noforn": re.compile(r"\bNOFORN\b"),
    "rel_to": re.compile(r"\bREL\s+TO\b"),
    "classified": re.compile(r"\bCLASSIFIED\b"),
    "ufouo": re.compile(r"\bUNCLASSIFIED//FOR\s+OFFICIAL\s+USE\s+ONLY\b"),
}
_SENSITIVE = re.compile(
    r"\b(?:intelligence\s+(?:report|briefing)|military\s+operation|weapons?\s+system"
    r"|covert|surveillance\s+program|nuclear\s+capability)\b", re.I)

class _ClassificationMarking:
    def __init__(self, *, action="block"):
        self.name = "classification-marking"; self.action = action
    def check(self, text, stage="output"):
        start = time.perf_counter(); issues = []; found = []
        for label, pat in _MARKINGS.items():
            if pat.search(text): found.append(label)
        has_secret = any(f in ("top_secret", "secret") for f in found)
        has_unclass = "UNCLASSIFIED" in text and "UNCLASSIFIED//FOR OFFICIAL USE ONLY" not in text
        if has_secret and has_unclass:
            issues.append("classification downgrade detected")
        lines = [l for l in text.split("\n") if l.strip()]
        if found and len(lines) > 2:
            top, bottom = lines[0].upper(), lines[-1].upper()
            top_ok = any(re.search(_MARKINGS[f].pattern, top) for f in found)
            bot_ok = any(re.search(_MARKINGS[f].pattern, bottom) for f in found)
            if not top_ok or not bot_ok:
                issues.append("classified content missing proper top/bottom marking")
        if _SENSITIVE.search(text) and not found:
            issues.append("sensitive content appears unmarked")
        triggered = len(issues) > 0; elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(guard_name="classification-marking", passed=not triggered,
            action=self.action if triggered else "allow",
            message=f"Classification issue: {'; '.join(issues)}" if triggered else None,
            latency_ms=round(elapsed, 2),
            details={"issues": issues, "markings_found": found} if triggered else None)

def classification_marking(*, action="block"):
    return _ClassificationMarking(action=action)
