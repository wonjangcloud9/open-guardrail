"""Prevent unauthorized medical advice without disclaimer."""
from __future__ import annotations

import re
import time
from typing import List

from open_guardrail.core import GuardResult

_ADVICE_PATTERNS = [
    re.compile(
        r"\byou\s+have\s+[\w\s]+(?:disease|disorder|"
        r"syndrome|condition|infection|cancer)\b",
        re.IGNORECASE,
    ),
    re.compile(
        r"\byour\s+diagnosis\s+is\b",
        re.IGNORECASE,
    ),
    re.compile(
        r"\byou\s+should\s+take\s+\w+",
        re.IGNORECASE,
    ),
    re.compile(
        r"\bincrease\s+your\s+dosage\b",
        re.IGNORECASE,
    ),
    re.compile(
        r"\bstop\s+taking\s+\w+", re.IGNORECASE
    ),
    re.compile(r"\bI\s+diagnose\b", re.IGNORECASE),
    re.compile(
        r"\btake\s+\w+\s+for\s+"
        r"(?:your|the|this)\b",
        re.IGNORECASE,
    ),
    re.compile(
        r"\bthis\s+treatment\s+will\s+cure\b",
        re.IGNORECASE,
    ),
    re.compile(
        r"\byou\s+(?:are|have\s+been)\s+"
        r"diagnosed\s+with\b",
        re.IGNORECASE,
    ),
    re.compile(
        r"\bprescri(?:be|bing)\s+\w+\s+"
        r"(?:for|to)\b",
        re.IGNORECASE,
    ),
]

_DISCLAIMER_PATTERNS = [
    re.compile(
        r"\bnot\s+medical\s+advice\b",
        re.IGNORECASE,
    ),
    re.compile(
        r"\bconsult\s+(?:your\s+)?"
        r"(?:doctor|physician)\b",
        re.IGNORECASE,
    ),
    re.compile(
        r"\bconsult\s+a\s+healthcare"
        r"\s+professional\b",
        re.IGNORECASE,
    ),
    re.compile(
        r"\bfor\s+informational\s+purposes\b",
        re.IGNORECASE,
    ),
    re.compile(
        r"\bseek\s+medical\s+attention\b",
        re.IGNORECASE,
    ),
    re.compile(
        r"\bspeak\s+(?:with|to)\s+"
        r"(?:your\s+)?(?:doctor|physician|"
        r"healthcare)\b",
        re.IGNORECASE,
    ),
]


class _ClinicalAdviceDisclaimer:
    def __init__(
        self, *, action: str = "block"
    ) -> None:
        self.name = "clinical-advice-disclaimer"
        self.action = action

    def check(
        self, text: str, stage: str = "output"
    ) -> GuardResult:
        start = time.perf_counter()
        advice_found: List[str] = []

        for p in _ADVICE_PATTERNS:
            m = p.search(text)
            if m:
                advice_found.append(m.group(0))

        has_disclaimer = False
        if advice_found:
            for d in _DISCLAIMER_PATTERNS:
                if d.search(text):
                    has_disclaimer = True
                    break

        triggered = (
            len(advice_found) > 0
            and not has_disclaimer
        )
        elapsed = (
            time.perf_counter() - start
        ) * 1000

        return GuardResult(
            guard_name="clinical-advice-disclaimer",
            passed=not triggered,
            action=(
                self.action if triggered else "allow"
            ),
            message=(
                "Medical advice detected without"
                f' disclaimer: "{advice_found[0]}"'
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {
                    "advice_found": advice_found,
                    "reason": (
                        "Medical advice provided"
                        " without proper disclaimer"
                    ),
                }
                if triggered
                else None
            ),
        )


def clinical_advice_disclaimer(
    *, action: str = "block"
) -> _ClinicalAdviceDisclaimer:
    return _ClinicalAdviceDisclaimer(action=action)
