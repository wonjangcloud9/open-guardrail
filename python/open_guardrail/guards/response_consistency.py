"""Detect contradictions within text."""
from __future__ import annotations

import re
import time
from typing import List

from open_guardrail.core import GuardResult

_CONTRADICTION_PAIRS: List[tuple[str, str]] = [
    (r"\byes\b", r"\bno\b"),
    (r"\bcan\b", r"\bcannot\b"),
    (r"\bwill\b", r"\bwill\s+not\b"),
    (r"\bshould\b", r"\bshould\s+not\b"),
    (r"\bis\b", r"\bis\s+not\b"),
    (r"\btrue\b", r"\bfalse\b"),
    (r"\bcorrect\b", r"\bincorrect\b"),
    (r"\bagree\b", r"\bdisagree\b"),
    (r"\bpossible\b", r"\bimpossible\b"),
    (r"\balways\b", r"\bnever\b"),
]


class _ResponseConsistency:
    def __init__(
        self, *, action: str = "warn"
    ) -> None:
        self.name = "response-consistency"
        self.action = action

    def check(
        self, text: str, stage: str = "output"
    ) -> GuardResult:
        start = time.perf_counter()
        lower = text.lower()
        found_pairs: list[tuple[str, str]] = []

        for pat_a, pat_b in _CONTRADICTION_PAIRS:
            ma = re.search(pat_a, lower, re.I)
            mb = re.search(pat_b, lower, re.I)
            if ma and mb:
                found_pairs.append(
                    (ma.group(), mb.group())
                )

        triggered = len(found_pairs) > 0
        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(
            guard_name="response-consistency",
            passed=not triggered,
            action=(
                self.action if triggered else "allow"
            ),
            message=(
                f"Contradictions found: {len(found_pairs)}"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {
                    "pairs": [
                        {"a": a, "b": b}
                        for a, b in found_pairs
                    ]
                }
                if triggered
                else None
            ),
        )


def response_consistency(
    *, action: str = "warn"
) -> _ResponseConsistency:
    return _ResponseConsistency(action=action)
