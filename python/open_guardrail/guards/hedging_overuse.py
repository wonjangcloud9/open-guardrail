"""Detect excessive hedging that undermines response usefulness."""
from __future__ import annotations

import re
import time
from typing import List

from open_guardrail.core import GuardResult

_HEDGE_PATTERNS: List[re.Pattern[str]] = [
    re.compile(p, re.IGNORECASE)
    for p in [
        r"\bmaybe\b",
        r"\bperhaps\b",
        r"\bmight\b",
        r"\bcould be\b",
        r"\bpossibly\b",
        r"\bit'?s unclear\b",
        r"\bI'?m not sure\b",
        r"\bit depends\b",
        r"\barguably\b",
        r"\bpotentially\b",
        r"\bconceivably\b",
        r"\bit seems\b",
        r"\bappears to\b",
        r"\bmay or may not\b",
    ]
]

_SENTENCE_SPLIT = re.compile(r"(?<=[.!?])\s+")


class _HedgingOveruse:
    def __init__(
        self,
        *,
        action: str = "block",
        max_hedge_ratio: float = 0.15,
    ) -> None:
        self.name = "hedging-overuse"
        self.action = action
        self.max_hedge_ratio = max_hedge_ratio

    def check(self, text: str, stage: str = "output") -> GuardResult:
        start = time.perf_counter()
        sentences = [
            s.strip()
            for s in _SENTENCE_SPLIT.split(text)
            if s.strip()
        ]
        if not sentences:
            elapsed = (time.perf_counter() - start) * 1000
            return GuardResult(
                guard_name=self.name,
                passed=True,
                action="allow",
                latency_ms=round(elapsed, 2),
            )

        hedge_count = 0
        hedge_sentences: List[str] = []
        for s in sentences:
            if any(p.search(s) for p in _HEDGE_PATTERNS):
                hedge_count += 1
                short = s[:77] + "..." if len(s) > 80 else s
                hedge_sentences.append(short)

        ratio = hedge_count / len(sentences)
        triggered = ratio > self.max_hedge_ratio
        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(
            guard_name=self.name,
            passed=not triggered,
            action=self.action if triggered else "allow",
            message=(
                f"Hedging ratio {ratio * 100:.1f}% exceeds "
                f"{self.max_hedge_ratio * 100:.1f}% threshold"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details={
                "hedge_count": hedge_count,
                "total_sentences": len(sentences),
                "ratio": round(ratio, 3),
                **(
                    {"hedge_sentences": hedge_sentences}
                    if triggered
                    else {}
                ),
            },
        )


def hedging_overuse(
    *,
    action: str = "block",
    max_hedge_ratio: float = 0.15,
) -> _HedgingOveruse:
    return _HedgingOveruse(
        action=action, max_hedge_ratio=max_hedge_ratio
    )
