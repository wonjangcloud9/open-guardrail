"""Detects hate speech patterns."""

import re
import time
from typing import List

from open_guardrail.core import GuardResult

_PATTERNS = [
    re.compile(r"\b(?:kill|murder|eliminate|exterminate|destroy)\s+(?:all\s+)?(?:the\s+)?(?:\w+\s+)?(?:people|race|group|community)\b", re.I),
    re.compile(r"\b(?:death\s+to|go\s+back\s+to)\b", re.I),
    re.compile(r"\b(?:subhuman|inferior\s+race|master\s+race|racial\s+purity)\b", re.I),
    re.compile(r"\b(?:ethnic\s+cleansing|white\s+power|white\s+supremac)\b", re.I),
    re.compile(r"\b(?:gas\s+the|lynch|string\s+up)\b", re.I),
    re.compile(r"\b(?:don't\s+deserve\s+to\s+live|should\s+(?:all\s+)?die)\b", re.I),
    re.compile(r"\b(?:vermin|cockroach|animal)s?\b.*\b(?:people|race|ethnic|immigrant)\b", re.I),
]


class _HateSpeech:
    def __init__(self, *, action: str = "block") -> None:
        self.name = "hate-speech"
        self.action = action

    def check(self, text: str, stage: str = "output") -> GuardResult:
        start = time.perf_counter()
        matched: List[str] = []
        for p in _PATTERNS:
            m = p.search(text)
            if m:
                matched.append(m.group()[:60])
        triggered = len(matched) > 0
        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(
            guard_name="hate-speech",
            passed=not triggered,
            action=self.action if triggered else "allow",
            message="Hate speech detected" if triggered else None,
            latency_ms=round(elapsed, 2),
            details={"matched": matched, "count": len(matched)} if triggered else None,
        )


def hate_speech(*, action: str = "block") -> _HateSpeech:
    return _HateSpeech(action=action)
