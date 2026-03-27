"""Contact information detection guard."""

import re
import time
from typing import List, Optional

from open_guardrail.core import GuardResult

_DETECTORS: dict[str, re.Pattern[str]] = {
    "email": re.compile(r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}"),
    "phone": re.compile(r"(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{4}"),
    "url": re.compile(r"https?://[^\s<>\"']+", re.I),
    "social": re.compile(r"@[\w.]{2,}|(?:twitter|instagram|facebook|linkedin|tiktok)\.com/[\w.]+", re.I),
}

_MASK_LABELS: dict[str, str] = {
    "email": "[EMAIL]",
    "phone": "[PHONE]",
    "url": "[URL]",
    "social": "[SOCIAL]",
}


class _ContactInfo:
    def __init__(
        self, *, action: str = "block", detect: Optional[List[str]] = None,
    ) -> None:
        self.name = "contact-info"
        self.action = action
        self._types = detect or list(_DETECTORS.keys())

    def check(self, text: str, stage: str = "output") -> GuardResult:
        start = time.perf_counter()
        matches: List[dict] = []
        for t in self._types:
            pat = _DETECTORS.get(t)
            if not pat:
                continue
            for m in pat.finditer(text):
                matches.append({"type": t, "value": m.group(), "start": m.start(), "end": m.end()})
        matches.sort(key=lambda x: x["start"], reverse=True)
        triggered = len(matches) > 0
        elapsed = (time.perf_counter() - start) * 1000
        if not triggered:
            return GuardResult(guard_name="contact-info", passed=True, action="allow", latency_ms=round(elapsed, 2))
        detected = [{"type": m["type"], "value": m["value"]} for m in matches]
        if self.action == "mask":
            result = text
            for m in matches:
                result = result[: m["start"]] + _MASK_LABELS.get(m["type"], "[CONTACT]") + result[m["end"] :]
            return GuardResult(guard_name="contact-info", passed=True, action="override", override_text=result, latency_ms=round(elapsed, 2), details={"detected": detected})
        return GuardResult(guard_name="contact-info", passed=False, action=self.action, message=f"Contact info detected: {len(matches)}", latency_ms=round(elapsed, 2), details={"detected": detected})


def contact_info(*, action: str = "block", detect: Optional[List[str]] = None) -> _ContactInfo:
    return _ContactInfo(action=action, detect=detect)
