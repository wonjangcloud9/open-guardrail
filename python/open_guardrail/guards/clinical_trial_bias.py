"""Detect discriminatory eligibility in trials."""
from __future__ import annotations

import re
import time
from typing import List

from open_guardrail.core import GuardResult

_BIAS_PATTERNS = [
    re.compile(
        r"\b(?:males?\s+only|females?\s+excluded"
        r"|men\s+only|women\s+excluded)\b",
        re.IGNORECASE,
    ),
    re.compile(
        r"\b(?:over\s+65\s+excluded|exclude\s+"
        r"(?:elderly|older\s+adults?))\b",
        re.IGNORECASE,
    ),
    re.compile(
        r"\b(?:under\s+18\s+only|"
        r"children\s+excluded)\b",
        re.IGNORECASE,
    ),
    re.compile(
        r"\b(?:caucasian\s+only|white\s+only|"
        r"excluding\s+(?:african\s+american|"
        r"black|hispanic|asian|latino))\b",
        re.IGNORECASE,
    ),
    re.compile(
        r"\b(?:must\s+have\s+(?:insurance|"
        r"private\s+insurance|"
        r"health\s+coverage))\b",
        re.IGNORECASE,
    ),
    re.compile(
        r"\b(?:must\s+have\s+(?:transportation|"
        r"reliable\s+transport))\b",
        re.IGNORECASE,
    ),
    re.compile(
        r"\b(?:english[\s-]speaking\s+only|"
        r"must\s+speak\s+english)\b",
        re.IGNORECASE,
    ),
    re.compile(
        r"\b(?:no\s+physical\s+disabilities|"
        r"must\s+be\s+ambulatory|"
        r"wheelchair\s+users?\s+excluded)\b",
        re.IGNORECASE,
    ),
    re.compile(
        r"\b(?:no\s+mental\s+health\s+"
        r"(?:history|conditions?))\b",
        re.IGNORECASE,
    ),
    re.compile(
        r"\b(?:must\s+(?:own|have)\s+(?:a\s+)?"
        r"(?:car|vehicle|computer|"
        r"smartphone))\b",
        re.IGNORECASE,
    ),
]

_JUSTIFICATION_PATTERNS = [
    re.compile(
        r"\bmedically?\s+(?:justified|necessary|"
        r"indicated|required)\b",
        re.IGNORECASE,
    ),
    re.compile(
        r"\bclinical(?:ly)?\s+(?:justified|"
        r"necessary|indicated)\b",
        re.IGNORECASE,
    ),
    re.compile(
        r"\breproductive\s+(?:study|health|"
        r"system)\b",
        re.IGNORECASE,
    ),
    re.compile(
        r"\bphysiological\s+(?:reason|basis|"
        r"requirement)\b",
        re.IGNORECASE,
    ),
    re.compile(
        r"\bsafety\s+(?:concern|reason|"
        r"requirement|consideration)\b",
        re.IGNORECASE,
    ),
]


class _ClinicalTrialBias:
    def __init__(
        self, *, action: str = "block"
    ) -> None:
        self.name = "clinical-trial-bias"
        self.action = action

    def check(
        self, text: str, stage: str = "output"
    ) -> GuardResult:
        start = time.perf_counter()
        bias_found: List[str] = []

        for p in _BIAS_PATTERNS:
            m = p.search(text)
            if m:
                bias_found.append(m.group(0))

        has_justification = False
        if bias_found:
            for j in _JUSTIFICATION_PATTERNS:
                if j.search(text):
                    has_justification = True
                    break

        triggered = (
            len(bias_found) > 0
            and not has_justification
        )
        elapsed = (
            time.perf_counter() - start
        ) * 1000

        return GuardResult(
            guard_name="clinical-trial-bias",
            passed=not triggered,
            action=(
                self.action if triggered else "allow"
            ),
            message=(
                "Discriminatory eligibility criteria"
                f' detected: "{bias_found[0]}"'
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {
                    "bias_found": bias_found,
                    "reason": (
                        "Exclusion criteria without"
                        " medical justification"
                    ),
                }
                if triggered
                else None
            ),
        )


def clinical_trial_bias(
    *, action: str = "block"
) -> _ClinicalTrialBias:
    return _ClinicalTrialBias(action=action)
