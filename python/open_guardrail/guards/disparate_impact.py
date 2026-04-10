"""Detect disparate impact using the 4/5 (80%) rule."""
from __future__ import annotations

import re
import time
from typing import Optional

from open_guardrail.core import GuardResult

_GROUP_TERMS = re.compile(
    r"(?:men|women|male|female|black|white|asian|hispanic|latino|latina|"
    r"indigenous|native|elderly|senior|young|disabled|muslim|christian|"
    r"jewish|hindu|sikh|buddhist)",
    re.IGNORECASE,
)

_QUANT = re.compile(
    r"(\d+(?:\.\d+)?)\s*%\s*(?:of\s+)?(\w[\w\s]*?)"
    r"\s+(?:vs\.?|versus|compared\s+to|while|but)\s+"
    r"(\d+(?:\.\d+)?)\s*%\s*(?:of\s+)?(\w[\w\s]*)",
    re.IGNORECASE,
)

_QUALITATIVE = [
    re.compile(
        r"\b(?:mostly|predominantly|primarily|mainly|largely|"
        r"disproportionately)\s+(?:\w+\s+){0,2}"
        r"(?:men|women|male|female|black|white|asian|hispanic|"
        r"latino|latina|indigenous|elderly|senior|disabled|"
        r"muslim|christian|jewish)\b",
        re.IGNORECASE,
    ),
    re.compile(
        r"\b(?:men|women|males?|females?|blacks?|whites?|asians?|"
        r"hispanics?|latinos?|latinas?|indigenous|elderly|seniors?|"
        r"disabled|muslims?|christians?|jews?|jewish)"
        r"\s+(?:are|were)\s+(?:more|less)\s+likely\b",
        re.IGNORECASE,
    ),
    re.compile(
        r"\b(?:under-?represented|over-?represented|excluded|"
        r"marginalized)\s+(?:\w+\s+){0,3}"
        r"(?:group|population|community|demographic)\b",
        re.IGNORECASE,
    ),
]


def _check_four_fifths(
    text: str,
) -> tuple[bool, Optional[dict]]:
    for m in _QUANT.finditer(text):
        rate_a = float(m.group(1))
        group_a = m.group(2).strip()
        rate_b = float(m.group(3))
        group_b = m.group(4).strip()
        if rate_a > 0 and rate_b > 0:
            lower = min(rate_a, rate_b)
            higher = max(rate_a, rate_b)
            ratio = lower / higher
            if ratio < 0.8 and (
                _GROUP_TERMS.search(group_a)
                or _GROUP_TERMS.search(group_b)
            ):
                return True, {
                    "rule": "4/5",
                    "group_a": group_a,
                    "rate_a": rate_a,
                    "group_b": group_b,
                    "rate_b": rate_b,
                    "ratio": round(ratio, 3),
                }
    return False, None


class _DisparateImpact:
    def __init__(
        self, *, action: str = "block"
    ) -> None:
        self.name = "disparate-impact"
        self.action = action

    def check(
        self, text: str, stage: str = "output"
    ) -> GuardResult:
        start = time.perf_counter()
        triggered, details = _check_four_fifths(text)

        if not triggered:
            for p in _QUALITATIVE:
                m = p.search(text)
                if m:
                    triggered = True
                    details = {
                        "matched": m.group(0),
                        "reason": (
                            "Qualitative disparate impact"
                            " language detected"
                        ),
                    }
                    break

        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(
            guard_name="disparate-impact",
            passed=not triggered,
            action=(
                self.action if triggered else "allow"
            ),
            message=(
                "Disparate impact detected"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=details if triggered else None,
        )


def disparate_impact(
    *, action: str = "block"
) -> _DisparateImpact:
    return _DisparateImpact(action=action)
