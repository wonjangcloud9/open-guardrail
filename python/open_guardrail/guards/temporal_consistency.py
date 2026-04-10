"""Detect conflicting dates/times within a response."""
from __future__ import annotations

import re
import time
from typing import Dict, List, Tuple

from open_guardrail.core import GuardResult

_YEAR_RE = re.compile(r"\bin\s+(\d{4})\b", re.IGNORECASE)
_YEAR_CLAIM_RE = re.compile(
    r"\b(?:founded|established|created|started|launched|"
    r"built|born|died|opened)\s+(?:in\s+)?(\d{4})\b",
    re.IGNORECASE,
)
_COMPLETED_RE = re.compile(
    r"\b(?:completed|finished|ended)\s+in\s+(\d{4})\b",
    re.IGNORECASE,
)
_STARTED_RE = re.compile(
    r"\b(?:started|began|commenced)\s+in\s+(\d{4})\b",
    re.IGNORECASE,
)
_RELATIVE_RE = re.compile(
    r"\b(yesterday|today|tomorrow)\b", re.IGNORECASE
)
_BEFORE_AFTER_RE = re.compile(
    r"\b(before|after|prior\s+to|following)\s+([^,.\n]{3,60})",
    re.IGNORECASE,
)


class _TemporalConsistency:
    def __init__(
        self,
        *,
        action: str = "warn",
        current_year: int = 2026,
    ) -> None:
        self.name = "temporal-consistency"
        self.action = action
        self.current_year = current_year

    def check(self, text: str, stage: str = "output") -> GuardResult:
        start = time.perf_counter()
        issues: List[str] = []

        # 1. Unreasonable years
        for m in _YEAR_RE.finditer(text):
            yr = int(m.group(1))
            if yr > 2030:
                issues.append(f"Unreasonable future year: {yr}")
            if 100 < yr < 1900:
                issues.append(f"Unreasonable past year: {yr}")

        # 2. Contradictory year claims
        grouped: Dict[str, List[int]] = {}
        for m in _YEAR_CLAIM_RE.finditer(text):
            verb = m.group(0).split()[0].lower()
            grouped.setdefault(verb, []).append(int(m.group(1)))
        for verb, years in grouped.items():
            unique = list(dict.fromkeys(years))
            if len(unique) > 1:
                vs = " vs ".join(str(y) for y in unique)
                issues.append(f'Conflicting "{verb}" years: {vs}')

        # 3. Temporal impossibilities
        completed = [
            int(m.group(1)) for m in _COMPLETED_RE.finditer(text)
        ]
        started = [
            int(m.group(1)) for m in _STARTED_RE.finditer(text)
        ]
        for cy in completed:
            for sy in started:
                if cy < sy:
                    issues.append(
                        f"Temporal impossibility: completed in "
                        f"{cy} before starting in {sy}"
                    )

        # 4. Yesterday + tomorrow conflict
        refs = [
            m.group(1).lower()
            for m in _RELATIVE_RE.finditer(text)
        ]
        if "yesterday" in refs and "tomorrow" in refs:
            issues.append(
                'Mixed "yesterday" and "tomorrow" references '
                "may conflict"
            )

        # 5. Before/after contradictions
        pairs: List[Tuple[str, str]] = []
        for m in _BEFORE_AFTER_RE.finditer(text):
            rel = m.group(1).lower().strip()
            event = m.group(2).strip().lower()
            pairs.append((rel, event))
        for i, (r1, e1) in enumerate(pairs):
            for r2, e2 in pairs[i + 1 :]:
                if e1 == e2:
                    b1 = r1 in ("before", "prior to")
                    b2 = r2 in ("before", "prior to")
                    if b1 != b2:
                        issues.append(
                            f'Contradictory "before/after" '
                            f'for: "{e1}"'
                        )

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


def temporal_consistency(
    *,
    action: str = "warn",
    current_year: int = 2026,
) -> _TemporalConsistency:
    return _TemporalConsistency(
        action=action, current_year=current_year
    )
