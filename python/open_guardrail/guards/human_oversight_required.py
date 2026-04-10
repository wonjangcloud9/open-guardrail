"""Flag outputs requiring human oversight before action (EU AI Act Art. 14)."""
from __future__ import annotations

import re
import time
from typing import List, Optional

from open_guardrail.core import GuardResult

_DEFAULT_HIGH_RISK: list[str] = [
    "approve loan",
    "deny application",
    "terminate",
    "diagnose",
    "prescribe",
    "sentence",
    "arrest",
    "suspend account",
    "reject claim",
    "grade student",
    "hire",
    "fire",
    "promote",
    "demote",
]

_OVERSIGHT_MARKERS: list[re.Pattern[str]] = [
    re.compile(r"\[HUMAN_REVIEW\]", re.IGNORECASE),
    re.compile(r"\[PENDING_REVIEW\]", re.IGNORECASE),
    re.compile(
        r"subject\s+to\s+human\s+review",
        re.IGNORECASE,
    ),
    re.compile(r"awaiting\s+approval", re.IGNORECASE),
    re.compile(
        r"draft\s*-\s*requires\s+review",
        re.IGNORECASE,
    ),
]


class _HumanOversightRequired:
    def __init__(
        self,
        *,
        action: str = "block",
        high_risk_actions: Optional[List[str]] = None,
    ) -> None:
        self.name = "human-oversight-required"
        self.action = action
        self._actions = (
            high_risk_actions
            if high_risk_actions is not None
            else _DEFAULT_HIGH_RISK
        )

    def check(
        self, text: str, stage: str = "output"
    ) -> GuardResult:
        start = time.perf_counter()
        lower = text.lower()

        found = [
            a
            for a in self._actions
            if a.lower() in lower
        ]

        has_oversight = any(
            m.search(text) for m in _OVERSIGHT_MARKERS
        )

        triggered = len(found) > 0 and not has_oversight
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="human-oversight-required",
            passed=not triggered,
            action=(
                self.action if triggered else "allow"
            ),
            message=(
                "High-risk action(s) detected without"
                " human oversight marker: "
                + ", ".join(found)
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {
                    "high_risk_actions_found": found,
                    "oversight_marker_present": False,
                    "reason": (
                        "EU AI Act Art. 14 requires"
                        " human oversight for"
                        " high-risk decisions"
                    ),
                }
                if triggered
                else None
            ),
        )


def human_oversight_required(
    *,
    action: str = "block",
    high_risk_actions: Optional[List[str]] = None,
) -> _HumanOversightRequired:
    return _HumanOversightRequired(
        action=action,
        high_risk_actions=high_risk_actions,
    )
