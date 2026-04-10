"""Ensure outputs include conformity assessment logging fields (EU AI Act Art. 16)."""
from __future__ import annotations

import re
import time
from typing import List, Optional

from open_guardrail.core import GuardResult

_DEFAULT_FIELDS: list[str] = [
    "timestamp",
    "model",
    "version",
    "input_hash",
    "risk_level",
]

_DECISION_PAT = re.compile(
    r"\b(?:decision|classification|prediction"
    r"|result|recommendation|assessment"
    r"|verdict|determination|ruling"
    r"|approval|rejection)\s*[:=]",
    re.IGNORECASE,
)


class _ConformityAssessment:
    def __init__(
        self,
        *,
        action: str = "block",
        required_fields: Optional[List[str]] = None,
    ) -> None:
        self.name = "conformity-assessment"
        self.action = action
        self._required = (
            required_fields
            if required_fields is not None
            else _DEFAULT_FIELDS
        )

    def check(
        self, text: str, stage: str = "output"
    ) -> GuardResult:
        start = time.perf_counter()

        is_decision = bool(
            _DECISION_PAT.search(text)
        )
        if not is_decision:
            elapsed = (
                time.perf_counter() - start
            ) * 1000
            return GuardResult(
                guard_name="conformity-assessment",
                passed=True,
                action="allow",
                latency_ms=round(elapsed, 2),
            )

        lower = text.lower()
        found = [
            f
            for f in self._required
            if re.search(
                rf'(?:"{f}"|' + rf"'{f}'|{f})"
                + r"\s*[:=]",
                lower,
            )
        ]

        threshold = 3
        triggered = len(found) < threshold
        elapsed = (
            time.perf_counter() - start
        ) * 1000

        return GuardResult(
            guard_name="conformity-assessment",
            passed=not triggered,
            action=(
                self.action if triggered else "allow"
            ),
            message=(
                "Decision output missing conformity"
                f" assessment fields (found"
                f" {len(found)}/{len(self._required)})"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {
                    "fields_found": found,
                    "fields_missing": [
                        f
                        for f in self._required
                        if f not in found
                    ],
                    "threshold": threshold,
                    "reason": (
                        "EU AI Act Art. 16 requires"
                        " conformity assessment"
                        " logging for decisions"
                    ),
                }
                if triggered
                else None
            ),
        )


def conformity_assessment(
    *,
    action: str = "block",
    required_fields: Optional[List[str]] = None,
) -> _ConformityAssessment:
    return _ConformityAssessment(
        action=action,
        required_fields=required_fields,
    )
