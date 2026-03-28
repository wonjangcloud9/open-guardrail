"""Korean AI Basic Act compliance guard (2026.1.22 시행)."""
from __future__ import annotations

import re
import time
from typing import Optional

from open_guardrail.core import GuardResult

_PROHIBITED_KR: list[re.Pattern[str]] = [
    re.compile(r"인간\s*존엄성\s*침해", re.IGNORECASE),
    re.compile(r"차별\s*조장", re.IGNORECASE),
    re.compile(r"사회적\s*신용\s*점수", re.IGNORECASE),
    re.compile(r"감시\s*시스템", re.IGNORECASE),
]

_PROHIBITED_EN: list[re.Pattern[str]] = [
    re.compile(
        r"social\s+credit\s+scoring", re.IGNORECASE,
    ),
    re.compile(
        r"mass\s+surveillance", re.IGNORECASE,
    ),
    re.compile(
        r"exploit\s+vulnerable", re.IGNORECASE,
    ),
]

_HIGH_IMPACT_KR: list[re.Pattern[str]] = [
    re.compile(r"채용\s*결정", re.IGNORECASE),
    re.compile(r"의료\s*진단", re.IGNORECASE),
    re.compile(r"자율\s*주행", re.IGNORECASE),
]

_IMPACT_ASSESSMENT = re.compile(
    r"영향\s*평가", re.IGNORECASE,
)


class _AiBasicActKr:
    def __init__(
        self,
        *,
        action: str = "block",
        high_impact: bool = True,
    ) -> None:
        self.name = "ai-basic-act-kr"
        self.action = action
        self._high_impact = high_impact

    def check(
        self, text: str, stage: str = "input"
    ) -> GuardResult:
        start = time.perf_counter()
        violations: list[str] = []

        for pat in _PROHIBITED_KR:
            if pat.search(text):
                violations.append(
                    f"prohibited-kr:{pat.pattern}"
                )

        for pat in _PROHIBITED_EN:
            if pat.search(text):
                violations.append(
                    f"prohibited-en:{pat.pattern}"
                )

        high_impact_warn = False
        if self._high_impact:
            has_assessment = bool(
                _IMPACT_ASSESSMENT.search(text)
            )
            for pat in _HIGH_IMPACT_KR:
                if pat.search(text) and not has_assessment:
                    violations.append(
                        f"high-impact:{pat.pattern}"
                    )
                    high_impact_warn = True

        has_prohibited = any(
            v.startswith("prohibited")
            for v in violations
        )
        triggered = len(violations) > 0
        score = 1.0 if has_prohibited else (
            min(len(violations) / 3, 1.0)
            if triggered
            else 0.0
        )
        elapsed = (time.perf_counter() - start) * 1000

        if has_prohibited:
            effective_action = self.action
        elif high_impact_warn:
            effective_action = "warn"
        else:
            effective_action = "allow"

        return GuardResult(
            guard_name="ai-basic-act-kr",
            passed=not triggered,
            action=effective_action,
            score=score,
            message=(
                "AI 기본법 위반 감지"
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
                        " violate Korean AI Basic Act"
                    ),
                }
                if triggered
                else None
            ),
        )


def ai_basic_act_kr(
    *,
    action: str = "block",
    high_impact: bool = True,
) -> _AiBasicActKr:
    return _AiBasicActKr(
        action=action, high_impact=high_impact,
    )
