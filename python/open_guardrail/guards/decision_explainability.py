"""Ensure high-risk AI decisions include explanations (EU AI Act Art. 86)."""
from __future__ import annotations

import re
import time

from open_guardrail.core import GuardResult

_DECISION: list[re.Pattern[str]] = [
    re.compile(r"\brecommend\b", re.IGNORECASE),
    re.compile(r"\bdecision\s*:", re.IGNORECASE),
    re.compile(r"\bapproved\b", re.IGNORECASE),
    re.compile(r"\bdenied\b", re.IGNORECASE),
    re.compile(r"\brejected\b", re.IGNORECASE),
    re.compile(
        r"\bclassified\s+as\b", re.IGNORECASE
    ),
    re.compile(r"\bscored\b", re.IGNORECASE),
    re.compile(r"\brated\b", re.IGNORECASE),
    re.compile(r"\bevaluated\b", re.IGNORECASE),
]

_EXPLANATION: list[re.Pattern[str]] = [
    re.compile(r"\bbecause\b", re.IGNORECASE),
    re.compile(r"\breason\s*:", re.IGNORECASE),
    re.compile(r"\bdue\s+to\b", re.IGNORECASE),
    re.compile(r"\bbased\s+on\b", re.IGNORECASE),
    re.compile(r"\bfactors?\s*:", re.IGNORECASE),
    re.compile(r"\bexplanation\s*:", re.IGNORECASE),
    re.compile(r"\brationale\s*:", re.IGNORECASE),
]


def _explanation_length(text: str) -> int:
    max_len = 0
    for p in _EXPLANATION:
        m = p.search(text)
        if m:
            after = text[m.end() :].strip()
            if len(after) > max_len:
                max_len = len(after)
    return max_len


class _DecisionExplainability:
    def __init__(
        self,
        *,
        action: str = "warn",
        min_explanation_length: int = 50,
    ) -> None:
        self.name = "decision-explainability"
        self.action = action
        self._min_len = min_explanation_length

    def check(
        self, text: str, stage: str = "output"
    ) -> GuardResult:
        start = time.perf_counter()

        has_decision = any(
            p.search(text) for p in _DECISION
        )
        if not has_decision:
            elapsed = (
                time.perf_counter() - start
            ) * 1000
            return GuardResult(
                guard_name="decision-explainability",
                passed=True,
                action="allow",
                score=0.0,
                message=None,
                latency_ms=round(elapsed, 2),
                details=None,
            )

        has_expl = any(
            p.search(text) for p in _EXPLANATION
        )
        expl_len = _explanation_length(text)
        adequate = has_expl and expl_len >= self._min_len
        triggered = not adequate
        elapsed = (time.perf_counter() - start) * 1000

        reason = (
            "no_explanation"
            if not has_expl
            else "explanation_too_short"
        )

        return GuardResult(
            guard_name="decision-explainability",
            passed=not triggered,
            action=(
                self.action if triggered else "allow"
            ),
            score=0.8 if triggered else 0.0,
            message=(
                f"Decision lacks explanation: {reason}"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {
                    "reason": reason,
                    "explanation_length": expl_len,
                }
                if triggered
                else None
            ),
        )


def decision_explainability(
    *,
    action: str = "warn",
    min_explanation_length: int = 50,
) -> _DecisionExplainability:
    return _DecisionExplainability(
        action=action,
        min_explanation_length=min_explanation_length,
    )
