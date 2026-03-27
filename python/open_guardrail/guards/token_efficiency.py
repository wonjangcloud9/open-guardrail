"""Detects low information density and filler words."""

import time
from typing import List, Optional

from open_guardrail.core import GuardResult

_DEFAULT_FILLERS = [
    "basically", "actually", "literally", "essentially", "obviously",
    "clearly", "certainly", "definitely", "honestly", "frankly",
    "simply", "really", "very", "quite", "rather", "somewhat",
    "just", "like", "you know", "i mean", "kind of", "sort of",
]


class _TokenEfficiency:
    def __init__(self, *, action: str = "warn", min_density: float = 0.3, filler_words: Optional[List[str]] = None) -> None:
        self.name = "token-efficiency"
        self.action = action
        self.min_density = min_density
        self.fillers = [f.lower() for f in (filler_words or _DEFAULT_FILLERS)]

    def check(self, text: str, stage: str = "output") -> GuardResult:
        start = time.perf_counter()
        lower = text.lower()
        words = lower.split()
        total = len(words)
        if total == 0:
            elapsed = (time.perf_counter() - start) * 1000
            return GuardResult(guard_name="token-efficiency", passed=True, action="allow", latency_ms=round(elapsed, 2))
        filler_count = 0
        found: List[str] = []
        for f in self.fillers:
            parts = f.split()
            if len(parts) == 1:
                c = words.count(f)
                if c > 0:
                    filler_count += c
                    found.append(f)
            else:
                idx = lower.find(f)
                while idx != -1:
                    filler_count += len(parts)
                    if f not in found:
                        found.append(f)
                    idx = lower.find(f, idx + 1)
        density = 1 - filler_count / total
        triggered = density < self.min_density
        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(guard_name="token-efficiency", passed=not triggered, action=self.action if triggered else "allow", message=f"Low density: {density:.2f}" if triggered else None, score=round(density, 2), latency_ms=round(elapsed, 2), details={"density": round(density, 2), "filler_count": filler_count, "top_fillers": found[:5]} if triggered else None)


def token_efficiency(*, action: str = "warn", min_density: float = 0.3, filler_words: Optional[List[str]] = None) -> _TokenEfficiency:
    return _TokenEfficiency(action=action, min_density=min_density, filler_words=filler_words)
