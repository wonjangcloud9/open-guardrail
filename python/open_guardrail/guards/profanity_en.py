"""English profanity detection guard."""

import re
import time
from typing import List, Optional

from open_guardrail.core import GuardResult

_SEVERE = ["fuck", "shit", "cunt", "nigger", "faggot"]
_MODERATE = ["ass", "asshole", "bitch", "bastard", "damn", "dick", "piss"]
_MILD = ["crap", "hell", "suck", "idiot", "stupid", "dumb"]

_OBFUSCATION = [
    re.compile(r"f[\*#@$!]+(?:ck|k)", re.I),
    re.compile(r"f\s*u\s*c\s*k", re.I),
    re.compile(r"sh[i1!]t", re.I),
    re.compile(r"b[i1!]tch", re.I),
    re.compile(r"a[$\$][$\$]", re.I),
]


class _ProfanityEn:
    def __init__(
        self, *, action: str = "block", severity: str = "moderate", detect_obfuscation: bool = True,
    ) -> None:
        self.name = "profanity-en"
        self.action = action
        self.detect_obfuscation = detect_obfuscation
        words: List[str] = list(_SEVERE)
        if severity in ("moderate", "mild"):
            words.extend(_MODERATE)
        if severity == "mild":
            words.extend(_MILD)
        self._patterns = [re.compile(r"\b" + re.escape(w) + r"\b", re.I) for w in words]

    def check(self, text: str, stage: str = "output") -> GuardResult:
        start = time.perf_counter()
        matched: set[str] = set()
        for p in self._patterns:
            m = p.search(text)
            if m:
                matched.add(m.group().lower())
        if self.detect_obfuscation:
            for p in _OBFUSCATION:
                m = p.search(text)
                if m:
                    matched.add(m.group() + " (obfuscated)")
        triggered = len(matched) > 0
        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(
            guard_name="profanity-en",
            passed=not triggered,
            action=self.action if triggered else "allow",
            message=f"Profanity detected: {len(matched)} match(es)" if triggered else None,
            latency_ms=round(elapsed, 2),
            details={"matched": list(matched)} if triggered else None,
        )


def profanity_en(
    *, action: str = "block", severity: str = "moderate", detect_obfuscation: bool = True,
) -> _ProfanityEn:
    return _ProfanityEn(action=action, severity=severity, detect_obfuscation=detect_obfuscation)
