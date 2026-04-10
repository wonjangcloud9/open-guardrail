"""Detect factual inconsistencies within a response."""
from __future__ import annotations

import re
import time

from open_guardrail.core import GuardResult

_ASSERTION_RE = re.compile(
    r"\b(?:is|are|was|were|has|have|had|does|do)\b",
    re.IGNORECASE,
)
_NUMBER_RE = re.compile(r"\b\d[\d,.]*\b")
_YEAR_RE = re.compile(r"\b(?:19|20)\d{2}\b")
_NEGATION_RE = re.compile(
    r"\b(?:not|n't|never|no|neither|nor|cannot)\b",
    re.IGNORECASE,
)
_PROPER_NOUN_RE = re.compile(
    r"\b[A-Z][a-z]{2,}(?:\s+[A-Z][a-z]+)*"
)


def _extract_statements(text: str) -> list[dict]:
    sentences = re.split(r"(?<=[.!?])\s+", text)
    results: list[dict] = []

    for s in sentences:
        if not _ASSERTION_RE.search(s):
            continue

        numbers = _NUMBER_RE.findall(s)
        years = _YEAR_RE.findall(s)
        nouns = _PROPER_NOUN_RE.findall(s)

        if not numbers and not years and not nouns:
            continue

        subject = nouns[0] if nouns else ""
        negated = bool(_NEGATION_RE.search(s))
        predicate = re.sub(
            r"[^a-z\s]", "", s.lower()
        ).strip()

        results.append(
            {
                "sentence": s,
                "subject": subject,
                "predicate": predicate,
                "negated": negated,
                "numbers": numbers,
                "years": years,
            }
        )
    return results


def _find_contradictions(
    stmts: list[dict],
) -> list[str]:
    issues: list[str] = []

    for i in range(len(stmts)):
        for j in range(i + 1, len(stmts)):
            a, b = stmts[i], stmts[j]
            if not a["subject"] or not b["subject"]:
                continue
            if (
                a["subject"].lower()
                != b["subject"].lower()
            ):
                continue

            if (
                a["numbers"]
                and b["numbers"]
                and a["numbers"][0] != b["numbers"][0]
            ):
                a_words = set(
                    w
                    for w in a["predicate"].split()
                    if len(w) >= 4
                )
                shared = [
                    w
                    for w in b["predicate"].split()
                    if len(w) >= 4 and w in a_words
                ]
                if shared:
                    issues.append(
                        f"Numeric conflict for "
                        f"\"{a['subject']}\": "
                        f"{a['numbers'][0]} vs "
                        f"{b['numbers'][0]}"
                    )

            if (
                a["years"]
                and b["years"]
                and a["years"][0] != b["years"][0]
            ):
                issues.append(
                    f"Temporal conflict for "
                    f"\"{a['subject']}\": "
                    f"{a['years'][0]} vs "
                    f"{b['years'][0]}"
                )

            if a["negated"] != b["negated"]:
                a_words = set(
                    w
                    for w in a["predicate"].split()
                    if len(w) >= 4
                )
                overlap = [
                    w
                    for w in b["predicate"].split()
                    if len(w) >= 4 and w in a_words
                ]
                if len(overlap) >= 2:
                    issues.append(
                        f"Boolean contradiction for "
                        f"\"{a['subject']}\""
                    )

    return issues


class _FactualConsistencyCheck:
    def __init__(
        self, *, action: str = "block"
    ) -> None:
        self.name = "factual-consistency-check"
        self.action = action

    def check(
        self, text: str, stage: str = "output"
    ) -> GuardResult:
        start = time.perf_counter()

        stmts = _extract_statements(text)
        issues = _find_contradictions(stmts)
        triggered = len(issues) > 0
        score = (
            min(len(issues) / 3, 1.0) if triggered else 0.0
        )
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="factual-consistency-check",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=score,
            message=(
                "Factual inconsistencies detected"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {
                    "contradictions": issues,
                    "factual_statements": len(stmts),
                }
                if triggered
                else None
            ),
        )


def factual_consistency_check(
    *, action: str = "block"
) -> _FactualConsistencyCheck:
    return _FactualConsistencyCheck(action=action)
