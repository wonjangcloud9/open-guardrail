"""EU AI Act compliance guard for risk classification."""

import re
import time
from typing import Optional

from open_guardrail.core import GuardResult

_UNACCEPTABLE_PATTERNS: list[re.Pattern[str]] = [
    re.compile(r"social\s+scoring", re.IGNORECASE),
    re.compile(
        r"subliminal\s+manipulation", re.IGNORECASE,
    ),
    re.compile(
        r"real[-\s]?time\s+biometric\s+surveillance",
        re.IGNORECASE,
    ),
    re.compile(
        r"exploit\s+vulnerabilit(y|ies)\s+of",
        re.IGNORECASE,
    ),
]

_HIGH_RISK_PATTERNS: list[re.Pattern[str]] = [
    re.compile(
        r"biometric\s+identification",
        re.IGNORECASE,
    ),
    re.compile(
        r"employment\s+scoring", re.IGNORECASE,
    ),
    re.compile(
        r"credit\s+scoring", re.IGNORECASE,
    ),
    re.compile(
        r"law\s+enforcement", re.IGNORECASE,
    ),
    re.compile(
        r"critical\s+infrastructure",
        re.IGNORECASE,
    ),
]

_TRANSPARENCY_PATTERNS: list[re.Pattern[str]] = [
    re.compile(r"deepfake", re.IGNORECASE),
    re.compile(r"\bchatbot\b", re.IGNORECASE),
    re.compile(
        r"emotion\s+detection", re.IGNORECASE,
    ),
]

_TRANSPARENCY_LABEL = re.compile(
    r"ai[-\s]?generated", re.IGNORECASE,
)


class _EuAiAct:
    def __init__(
        self,
        *,
        action: str = "block",
        risk_level: str = "high",
    ) -> None:
        self.name = "eu-ai-act"
        self.action = action
        self._risk_level = risk_level

    def check(
        self, text: str, stage: str = "input"
    ) -> GuardResult:
        start = time.perf_counter()
        violations: list[str] = []

        for pat in _UNACCEPTABLE_PATTERNS:
            if pat.search(text):
                violations.append(
                    f"unacceptable:{pat.pattern}"
                )

        if self._risk_level in ("high", "all"):
            for pat in _HIGH_RISK_PATTERNS:
                if pat.search(text):
                    violations.append(
                        f"high-risk:{pat.pattern}"
                    )

        for pat in _TRANSPARENCY_PATTERNS:
            if pat.search(text):
                has_label = bool(
                    _TRANSPARENCY_LABEL.search(text)
                )
                if not has_label:
                    violations.append(
                        f"transparency:{pat.pattern}"
                    )

        triggered = len(violations) > 0
        has_unacceptable = any(
            v.startswith("unacceptable:")
            for v in violations
        )
        score = 1.0 if has_unacceptable else (
            min(len(violations) / 3, 1.0)
            if triggered
            else 0.0
        )
        elapsed = (time.perf_counter() - start) * 1000

        effective_action = (
            "block"
            if has_unacceptable
            else (self.action if triggered else "allow")
        )

        return GuardResult(
            guard_name="eu-ai-act",
            passed=not triggered,
            action=effective_action,
            score=score,
            message=(
                "EU AI Act violation detected"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {
                    "violations": len(violations),
                    "categories": list(
                        {v.split(":")[0] for v in violations}
                    ),
                    "reason": (
                        "Text contains patterns that"
                        " violate EU AI Act requirements"
                    ),
                }
                if triggered
                else None
            ),
        )


def eu_ai_act(
    *,
    action: str = "block",
    risk_level: str = "high",
) -> _EuAiAct:
    return _EuAiAct(
        action=action, risk_level=risk_level,
    )
