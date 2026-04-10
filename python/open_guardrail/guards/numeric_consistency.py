"""Detect unreasonable or inconsistent numeric claims."""
from __future__ import annotations

import re
import time
from typing import Dict, List, Optional, Tuple

from open_guardrail.core import GuardResult

_PCT_RE = re.compile(r"(-?\d+(?:\.\d+)?)\s*%")
_INCREASE_CTX_RE = re.compile(
    r"(?:increase|growth|rise|gain|up|boost|jump|surge|grew|rose)"
    r"\b[^.]{0,30}(-?\d+(?:\.\d+)?)\s*%",
    re.IGNORECASE,
)
_NEGATIVE_COUNT_RE = re.compile(
    r"(?:negative\s+\d+|(?<!\w)-\d+)\s+"
    r"(?:users?|items?|people|records?|entries|results?|"
    r"rows?|customers?|orders?|employees?|members?)",
    re.IGNORECASE,
)
_YEAR_RE = re.compile(r"\b(\d{4})\b")
_NUM_CLAIM_RE = re.compile(
    r"\b(?:there\s+(?:are|were|is|was)|(?:has|have|had)\s+|"
    r"(?:total(?:ing)?|count(?:ing)?|about|approximately|"
    r"around|exactly|only|over|under)\s+)"
    r"(\d+(?:,\d{3})*(?:\.\d+)?)\s+(\w+)",
    re.IGNORECASE,
)


class _NumericConsistency:
    def __init__(self, *, action: str = "block") -> None:
        self.name = "numeric-consistency"
        self.action = action

    def check(self, text: str, stage: str = "output") -> GuardResult:
        start = time.perf_counter()
        issues: List[str] = []

        # 1. Percentages
        increase_spans: List[Tuple[int, int]] = []
        for m in _INCREASE_CTX_RE.finditer(text):
            increase_spans.append((m.start(), m.end()))

        for m in _PCT_RE.finditer(text):
            val = float(m.group(1))
            in_increase = any(
                s <= m.start() <= e for s, e in increase_spans
            )
            if in_increase:
                continue
            if val > 100:
                issues.append(f"Percentage {val}% exceeds 100")
            if val < 0:
                issues.append(f"Negative percentage {val}%")

        # 2. Negative counts
        if _NEGATIVE_COUNT_RE.search(text):
            issues.append("Negative count for a countable entity")

        # 3. Contradictory numbers
        grouped: Dict[str, List[float]] = {}
        for m in _NUM_CLAIM_RE.finditer(text):
            raw = m.group(1).replace(",", "")
            entity = m.group(2).lower()
            grouped.setdefault(entity, []).append(float(raw))
        for entity, values in grouped.items():
            unique = list(dict.fromkeys(values))
            if len(unique) > 1:
                vs = " vs ".join(str(int(v)) for v in unique)
                issues.append(
                    f'Contradictory values for "{entity}": {vs}'
                )

        # 4. Unreasonable dates
        for m in _YEAR_RE.finditer(text):
            yr = int(m.group(1))
            if yr > 2030:
                issues.append(f"Unreasonable future year: {yr}")
            if 100 < yr < 1900:
                issues.append(f"Unreasonable past year: {yr}")

        triggered = len(issues) > 0
        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(
            guard_name=self.name,
            passed=not triggered,
            action=self.action if triggered else "allow",
            message="; ".join(issues) if triggered else None,
            latency_ms=round(elapsed, 2),
            details={"issues": issues} if triggered else None,
        )


def numeric_consistency(
    *, action: str = "block"
) -> _NumericConsistency:
    return _NumericConsistency(action=action)
