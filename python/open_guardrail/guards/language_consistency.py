"""Checks that text uses a consistent script."""

import time
from typing import Dict, Optional

from open_guardrail.core import GuardResult

_SCRIPT_RANGES = {
    "korean": (0xAC00, 0xD7AF),
    "japanese_hiragana": (0x3040, 0x309F),
    "japanese_katakana": (0x30A0, 0x30FF),
    "chinese": (0x4E00, 0x9FFF),
    "arabic": (0x0600, 0x06FF),
    "thai": (0x0E00, 0x0E7F),
    "cyrillic": (0x0400, 0x04FF),
    "latin": (0x0041, 0x024F),
}


class _LanguageConsistency:
    def __init__(self, *, action: str = "warn") -> None:
        self.name = "language-consistency"
        self.action = action

    def check(self, text: str, stage: str = "output") -> GuardResult:
        start = time.perf_counter()
        counts: Dict[str, int] = {}
        total = 0
        for ch in text:
            cp = ord(ch)
            for script, (lo, hi) in _SCRIPT_RANGES.items():
                if lo <= cp <= hi:
                    counts[script] = counts.get(script, 0) + 1
                    total += 1
                    break
        mixed = []
        if total > 0:
            for script, count in counts.items():
                if count / total > 0.1:
                    mixed.append(script)
        triggered = len(mixed) > 1
        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(
            guard_name=self.name,
            passed=not triggered,
            action=self.action if triggered else "allow",
            message=f"Multiple scripts detected (>10% each): {', '.join(mixed)}" if triggered else None,
            latency_ms=round(elapsed, 2),
            details={"scripts": counts, "mixed": mixed} if triggered else None,
        )


def language_consistency(*, action: str = "warn") -> _LanguageConsistency:
    return _LanguageConsistency(action=action)
