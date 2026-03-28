"""Detects mixed language usage with allowed pairs."""
from __future__ import annotations

import time
from typing import Dict, List, Optional

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


class _LanguageMix:
    def __init__(
        self, *, action: str = "warn", allowed_mix: Optional[List[List[str]]] = None,
    ) -> None:
        self.name = "language-mix"
        self.action = action
        self.allowed_mix = allowed_mix or []

    def _is_allowed(self, scripts: List[str]) -> bool:
        script_set = set(scripts)
        for pair in self.allowed_mix:
            if script_set.issubset(set(pair)):
                return True
        return False

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
        present = []
        if total > 0:
            for script, count in counts.items():
                if count / total > 0.1:
                    present.append(script)
        mixed = len(present) > 1
        triggered = mixed and not self._is_allowed(present)
        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(
            guard_name=self.name,
            passed=not triggered,
            action=self.action if triggered else "allow",
            message=f"Disallowed language mix: {', '.join(present)}" if triggered else None,
            latency_ms=round(elapsed, 2),
            details={"scripts": counts, "detected": present} if triggered else None,
        )


def language_mix(
    *, action: str = "warn", allowed_mix: Optional[List[List[str]]] = None,
) -> _LanguageMix:
    return _LanguageMix(action=action, allowed_mix=allowed_mix)
