"""Auto-classify AI output by EU AI Act risk level."""
from __future__ import annotations

import re
import time

from open_guardrail.core import GuardResult

_UNACCEPTABLE: list[re.Pattern[str]] = [
    re.compile(r"\bcitizen\s+score\b", re.IGNORECASE),
    re.compile(r"\bsocial\s+credit\b", re.IGNORECASE),
    re.compile(r"\bsocial\s+scoring\b", re.IGNORECASE),
    re.compile(
        r"\bwithout\s+your\s+knowledge\b", re.IGNORECASE
    ),
    re.compile(r"\bsubconsciously\b", re.IGNORECASE),
    re.compile(
        r"\bsubliminal\s+manipulation\b", re.IGNORECASE
    ),
    re.compile(
        r"\btargeting\s+children\b", re.IGNORECASE
    ),
    re.compile(
        r"\bexploiting\s+elderly\b", re.IGNORECASE
    ),
    re.compile(
        r"\bexploit(?:ing)?\s+vulnerabilit",
        re.IGNORECASE,
    ),
]

_HIGH_RISK: list[re.Pattern[str]] = [
    re.compile(
        r"\bfacial\s+recognition\b", re.IGNORECASE
    ),
    re.compile(r"\bfingerprint\b", re.IGNORECASE),
    re.compile(r"\bbiometric\b", re.IGNORECASE),
    re.compile(
        r"\bhiring\s+decision\b", re.IGNORECASE
    ),
    re.compile(
        r"\bcandidate\s+evaluation\b", re.IGNORECASE
    ),
    re.compile(
        r"\bemployment\s+screening\b", re.IGNORECASE
    ),
    re.compile(
        r"\bcredit\s+scor(?:e|ing)\b", re.IGNORECASE
    ),
    re.compile(
        r"\bloan\s+approval\b", re.IGNORECASE
    ),
    re.compile(
        r"\bcreditworthiness\b", re.IGNORECASE
    ),
    re.compile(
        r"\bcriminal\s+prediction\b", re.IGNORECASE
    ),
    re.compile(r"\brecidivism\b", re.IGNORECASE),
    re.compile(r"\bsurveillance\b", re.IGNORECASE),
    re.compile(
        r"\bstudent\s+assessment\b", re.IGNORECASE
    ),
    re.compile(
        r"\badmission\s+decision\b", re.IGNORECASE
    ),
    re.compile(r"\bgrading\b", re.IGNORECASE),
]

_LIMITED: list[re.Pattern[str]] = [
    re.compile(r"\bchatbot\b", re.IGNORECASE),
    re.compile(
        r"\bemotion\s+recognition\b", re.IGNORECASE
    ),
    re.compile(r"\bdeepfake\b", re.IGNORECASE),
]

_LEVEL_ORDER = {
    "minimal": 0,
    "limited": 1,
    "high": 2,
    "unacceptable": 3,
}


def _classify(text: str) -> str:
    if any(p.search(text) for p in _UNACCEPTABLE):
        return "unacceptable"
    if any(p.search(text) for p in _HIGH_RISK):
        return "high"
    if any(p.search(text) for p in _LIMITED):
        return "limited"
    return "minimal"


class _EuAiRiskClassification:
    def __init__(
        self,
        *,
        action: str = "warn",
        min_risk_level: str = "high",
    ) -> None:
        self.name = "eu-ai-risk-classification"
        self.action = action
        self._min_level = min_risk_level

    def check(
        self, text: str, stage: str = "output"
    ) -> GuardResult:
        start = time.perf_counter()
        level = _classify(text)
        triggered = (
            _LEVEL_ORDER[level]
            >= _LEVEL_ORDER[self._min_level]
        )
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="eu-ai-risk-classification",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=(
                _LEVEL_ORDER[level] / 3
                if triggered
                else 0.0
            ),
            message=(
                f"Risk level: {level}"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details={"risk_level": level},
        )


def eu_ai_risk_classification(
    *, action: str = "warn", min_risk_level: str = "high"
) -> _EuAiRiskClassification:
    return _EuAiRiskClassification(
        action=action, min_risk_level=min_risk_level
    )
