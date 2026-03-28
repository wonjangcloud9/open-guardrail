"""Detect SOX compliance violations: financial manipulation language."""
from __future__ import annotations

import re
import time

from open_guardrail.core import GuardResult

_SOX_PATTERNS: list[re.Pattern[str]] = [
    re.compile(
        r"alter\s+financial\s+records?", re.IGNORECASE
    ),
    re.compile(r"\bbackdate\b", re.IGNORECASE),
    re.compile(r"cook\s+the\s+books?", re.IGNORECASE),
    re.compile(r"hide\s+losses", re.IGNORECASE),
    re.compile(
        r"off[\-\s]balance[\-\s]sheet", re.IGNORECASE
    ),
    re.compile(r"inflate\s+revenue", re.IGNORECASE),
    re.compile(
        r"destroy\s+audit\s+trail", re.IGNORECASE
    ),
    re.compile(
        r"falsif(?:y|ied|ication)\s+"
        r"(?:financial|accounting|earnings)",
        re.IGNORECASE,
    ),
    re.compile(
        r"manipulat(?:e|ing|ion)\s+"
        r"(?:earnings|revenue|profit|financial)",
        re.IGNORECASE,
    ),
    re.compile(
        r"(?:shred|destroy|delete)\s+"
        r"(?:financial|accounting)\s+"
        r"(?:documents?|records?|evidence)",
        re.IGNORECASE,
    ),
    re.compile(
        r"(?:conceal|obscure)\s+"
        r"(?:debt|liabilit(?:y|ies)|losses?|expenses?)",
        re.IGNORECASE,
    ),
    re.compile(
        r"fraudulent\s+(?:reporting|statements?|entries?)",
        re.IGNORECASE,
    ),
]


class _SoxCompliance:
    def __init__(self, *, action: str = "block") -> None:
        self.name = "sox-compliance"
        self.action = action

    def check(
        self, text: str, stage: str = "input"
    ) -> GuardResult:
        start = time.perf_counter()
        matched: list[str] = []

        for pat in _SOX_PATTERNS:
            if pat.search(text):
                matched.append(pat.pattern)

        triggered = len(matched) > 0
        score = min(len(matched) / 3, 1.0) if triggered else 0.0
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="sox-compliance",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=score,
            message=(
                "SOX compliance violation detected"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {
                    "matched_patterns": len(matched),
                    "reason": (
                        "Text contains language indicating"
                        " financial manipulation or fraud"
                        " in violation of SOX requirements"
                    ),
                }
                if triggered
                else None
            ),
        )


def sox_compliance(
    *, action: str = "block"
) -> _SoxCompliance:
    return _SoxCompliance(action=action)
