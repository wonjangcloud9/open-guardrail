"""Detect demographic bias in AI outputs (Responsible AI)."""
from __future__ import annotations

import re
import time

from open_guardrail.core import GuardResult

_GENDER_TERMS = re.compile(
    r"\b(he|she|they|man|woman|men|women"
    r"|male|female|boys?|girls?)\b",
    re.IGNORECASE,
)
_RACE_TERMS = re.compile(
    r"\b(white|black|asian|hispanic|latino"
    r"|latina|african|caucasian|indigenous"
    r"|native)\s+(people|workers?|employees?"
    r"|candidates?|students?|individuals?)\b",
    re.IGNORECASE,
)
_AGE_TERMS = re.compile(
    r"\b(young|old|older|elderly|senior"
    r"|junior|millennial|boomer)"
    r"\s+(people|workers?|employees?"
    r"|candidates?|students?"
    r"|individuals?)\b",
    re.IGNORECASE,
)

_POSITIVE = re.compile(
    r"\b(logical|rational|competent|intelligent"
    r"|capable|strong|leader|skilled"
    r"|analytical|decisive|ambitious)\b",
    re.IGNORECASE,
)
_NEGATIVE = re.compile(
    r"\b(emotional|irrational|weak|incompetent"
    r"|lazy|unreliable|aggressive|submissive"
    r"|hysterical|bossy|nagging)\b",
    re.IGNORECASE,
)

_BIAS_PATTERNS: list[re.Pattern[str]] = [
    re.compile(
        r"\b(?:men|males?)\s+are\s+(?:more\s+)?"
        r"(?:logical|rational|strong"
        r"|competent|analytical)\b",
        re.IGNORECASE,
    ),
    re.compile(
        r"\b(?:women|females?)\s+are\s+"
        r"(?:more\s+)?(?:emotional|irrational"
        r"|weak|submissive|hysterical)\b",
        re.IGNORECASE,
    ),
    re.compile(
        r"\b(?:young\s+people|millennials?)"
        r"\s+are\s+(?:more\s+)?"
        r"(?:lazy|entitled|irresponsible)\b",
        re.IGNORECASE,
    ),
    re.compile(
        r"\b(?:old(?:er)?\s+(?:people|workers?))"
        r"\s+are\s+(?:more\s+)?"
        r"(?:slow|incompetent|resistant"
        r"|outdated)\b",
        re.IGNORECASE,
    ),
    re.compile(
        r"\b(?:white|black|asian|hispanic)"
        r"\s+(?:people|workers?)\s+are\s+"
        r"(?:more\s+)?(?:lazy|criminal"
        r"|good\s+at|bad\s+at|naturally)\b",
        re.IGNORECASE,
    ),
]


def _detect_differential(
    text: str,
) -> tuple[bool, list[str]]:
    issues: list[str] = []

    for p in _BIAS_PATTERNS:
        if p.search(text):
            issues.append(p.pattern)

    sentences = [
        s.strip()
        for s in re.split(r"[.!?\n]+", text)
        if s.strip()
    ]
    for sentence in sentences:
        has_demo = (
            bool(_GENDER_TERMS.search(sentence))
            or bool(_RACE_TERMS.search(sentence))
            or bool(_AGE_TERMS.search(sentence))
        )
        if not has_demo:
            continue

        pos = len(_POSITIVE.findall(sentence))
        neg = len(_NEGATIVE.findall(sentence))

        if pos > 0 and neg > 0:
            issues.append(
                "Mixed evaluative language with"
                " demographic terms:"
                f' "{sentence[:80]}"'
            )
        if neg >= 2:
            issues.append(
                "Multiple negative traits with"
                " demographic terms:"
                f' "{sentence[:80]}"'
            )

    return len(issues) > 0, issues


class _DemographicParity:
    def __init__(
        self, *, action: str = "block"
    ) -> None:
        self.name = "demographic-parity"
        self.action = action

    def check(
        self, text: str, stage: str = "output"
    ) -> GuardResult:
        start = time.perf_counter()
        triggered, issues = _detect_differential(
            text
        )
        elapsed = (
            time.perf_counter() - start
        ) * 1000

        return GuardResult(
            guard_name="demographic-parity",
            passed=not triggered,
            action=(
                self.action if triggered else "allow"
            ),
            message=(
                "Potential demographic bias"
                f" detected: {len(issues)}"
                " issue(s) found"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {
                    "issue_count": len(issues),
                    "issues": issues,
                    "reason": (
                        "Responsible AI requires"
                        " equitable treatment across"
                        " demographic groups"
                    ),
                }
                if triggered
                else None
            ),
        )


def demographic_parity(
    *, action: str = "block"
) -> _DemographicParity:
    return _DemographicParity(action=action)
