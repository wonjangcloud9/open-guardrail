"""Aggregate multiple safety signals into one score."""
from __future__ import annotations

import re
import time

from open_guardrail.core import GuardResult

_TOXICITY_MARKERS = [
    re.compile(
        r"\b(kill|murder|destroy|hate"
        r"|stupid|idiot|moron)\b",
        re.IGNORECASE,
    ),
]

_PII_HINTS = [
    re.compile(r"\b\d{3}[-.]?\d{2}[-.]?\d{4}\b"),
    re.compile(
        r"\b[A-Za-z0-9._%+-]+"
        r"@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b"
    ),
]

_INJECTION_HINTS = [
    re.compile(
        r"ignore\s+(all\s+)?previous",
        re.IGNORECASE,
    ),
    re.compile(r"system\s+prompt", re.IGNORECASE),
    re.compile(r"\bjailbreak\b", re.IGNORECASE),
]


class _OutputSafetyScore:
    def __init__(
        self,
        *,
        action: str = "block",
        threshold: float = 0.7,
    ) -> None:
        self.name = "output-safety-score"
        self.action = action
        self._threshold = threshold

    def check(
        self, text: str, stage: str = "output"
    ) -> GuardResult:
        start = time.perf_counter()
        tox = 0.0
        pii = 0.0
        inj = 0.0

        for p in _TOXICITY_MARKERS:
            if p.search(text):
                tox += 0.3
        tox = min(tox, 1.0)

        for p in _PII_HINTS:
            if p.search(text):
                pii += 0.4
        pii = min(pii, 1.0)

        for p in _INJECTION_HINTS:
            if p.search(text):
                inj += 0.35
        inj = min(inj, 1.0)

        safety = 1.0 - (
            tox * 0.3 + pii * 0.3 + inj * 0.4
        )
        final = max(
            0.0, min(1.0, round(safety, 2))
        )
        triggered = final < self._threshold
        elapsed = (
            time.perf_counter() - start
        ) * 1000

        return GuardResult(
            guard_name="output-safety-score",
            passed=not triggered,
            action=(
                self.action if triggered else "allow"
            ),
            score=round(1.0 - final, 2),
            message=(
                "Safety score below threshold"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details={
                "safety_score": final,
                "toxicity": round(tox, 2),
                "pii": round(pii, 2),
                "injection": round(inj, 2),
            },
        )


def output_safety_score(
    *,
    action: str = "block",
    threshold: float = 0.7,
) -> _OutputSafetyScore:
    return _OutputSafetyScore(
        action=action, threshold=threshold
    )
