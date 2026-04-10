"""Flag potentially dangerous drug interactions."""
from __future__ import annotations

import re
import time
from typing import List, Tuple

from open_guardrail.core import GuardResult

_COMBINATION_PATTERNS = [
    re.compile(
        r"\btake\s+(\w+)\s+with\s+(\w+)\b",
        re.IGNORECASE,
    ),
    re.compile(
        r"\bcombine\s+(\w+)\s+and\s+(\w+)\b",
        re.IGNORECASE,
    ),
    re.compile(
        r"\bmix\s+(\w+)\s+with\s+(\w+)\b",
        re.IGNORECASE,
    ),
    re.compile(
        r"\b(\w+)\s+(?:along|together)"
        r"\s+with\s+(\w+)\b",
        re.IGNORECASE,
    ),
]

_DANGEROUS_PAIRS: List[Tuple[re.Pattern, re.Pattern]] = [
    (re.compile(r"\bwarfarin\b", re.I), re.compile(r"\baspirin\b", re.I)),
    (re.compile(r"\bssri\b", re.I), re.compile(r"\bmaoi\b", re.I)),
    (re.compile(r"\bopioid\b", re.I), re.compile(r"\bbenzodiazepine\b", re.I)),
    (re.compile(r"\bmetformin\b", re.I), re.compile(r"\balcohol\b", re.I)),
    (re.compile(r"\bstatin(?:s)?\b", re.I), re.compile(r"\bgrapefruit\b", re.I)),
    (re.compile(r"\blithium\b", re.I), re.compile(r"\bnsaid\b", re.I)),
]

_DOSAGE_CHANGE = [
    re.compile(
        r"\bdouble\s+your\s+dose\b",
        re.IGNORECASE,
    ),
    re.compile(
        r"\bincrease\s+to\s+\d+", re.IGNORECASE
    ),
    re.compile(
        r"\btake\s+extra\s+\w+", re.IGNORECASE
    ),
]

_SAFETY_WARNING = [
    re.compile(
        r"\bconsult\s+(?:your\s+)?"
        r"(?:doctor|physician|pharmacist)\b",
        re.IGNORECASE,
    ),
    re.compile(
        r"\bunder\s+medical\s+supervision\b",
        re.IGNORECASE,
    ),
    re.compile(
        r"\bmedical\s+professional\b",
        re.IGNORECASE,
    ),
]


class _DrugInteractionSafety:
    def __init__(
        self, *, action: str = "block"
    ) -> None:
        self.name = "drug-interaction-safety"
        self.action = action

    def check(
        self, text: str, stage: str = "output"
    ) -> GuardResult:
        start = time.perf_counter()
        issues: List[str] = []

        for p in _COMBINATION_PATTERNS:
            m = p.search(text)
            if m:
                issues.append(m.group(0))

        for a, b in _DANGEROUS_PAIRS:
            if a.search(text) and b.search(text):
                issues.append(
                    f"Dangerous pair: "
                    f"{a.pattern} + {b.pattern}"
                )

        for p in _DOSAGE_CHANGE:
            m = p.search(text)
            if m:
                issues.append(m.group(0))

        has_safety = False
        if issues:
            for s in _SAFETY_WARNING:
                if s.search(text):
                    has_safety = True
                    break

        triggered = len(issues) > 0 and not has_safety
        elapsed = (
            time.perf_counter() - start
        ) * 1000

        return GuardResult(
            guard_name="drug-interaction-safety",
            passed=not triggered,
            action=(
                self.action if triggered else "allow"
            ),
            message=(
                "Drug interaction risk detected:"
                f' "{issues[0]}"'
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {
                    "issues": issues,
                    "reason": (
                        "Drug interaction or dosage"
                        " change without safety"
                        " warning"
                    ),
                }
                if triggered
                else None
            ),
        )


def drug_interaction_safety(
    *, action: str = "block"
) -> _DrugInteractionSafety:
    return _DrugInteractionSafety(action=action)
