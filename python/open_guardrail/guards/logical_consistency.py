"""Detect contradictory statements within a response."""
from __future__ import annotations

import re
import time
from typing import Dict, List, Set

from open_guardrail.core import GuardResult

_CONTRADICTION_MARKERS = [
    "however, this contradicts",
    "but earlier i said",
    "actually the opposite",
    "this is incorrect",
    "i was wrong",
    "let me correct",
    "actually, no",
    "on second thought",
    "i take that back",
    "contrary to what i said",
    "i need to correct",
    "that was incorrect",
    "i misstated",
]

_IS_PATTERN = re.compile(r"\b(\w+)\s+is\s+(not\s+)?(\w+)", re.IGNORECASE)
_NUM_PATTERN = re.compile(
    r"\b(\w+(?:\s+\w+)?)\s+(?:is|was|are|were|=|equals?)\s+(\d[\d,.]*)",
    re.IGNORECASE,
)


def _split_sentences(text: str) -> List[str]:
    return [s.strip() for s in re.split(r"(?<=[.!?])\s+", text) if s.strip()]


def _find_negation_contradictions(sentences: List[str]) -> List[str]:
    issues: List[str] = []
    claims: Dict[str, Dict[str, List[str]]] = {}

    for s in sentences:
        for m in _IS_PATTERN.finditer(s):
            subj = m.group(1).lower()
            is_neg = bool(m.group(2))
            pred = m.group(3).lower()
            key = f"{subj}:{pred}"
            if key not in claims:
                claims[key] = {"positive": [], "negative": []}
            bucket = "negative" if is_neg else "positive"
            claims[key][bucket].append(s)

    for key, buckets in claims.items():
        if buckets["positive"] and buckets["negative"]:
            label = key.replace(":", " is ")
            issues.append(f'Negation contradiction on "{label}"')
    return issues


def _find_numeric_contradictions(sentences: List[str]) -> List[str]:
    issues: List[str] = []
    facts: Dict[str, Set[str]] = {}

    for s in sentences:
        for m in _NUM_PATTERN.finditer(s):
            entity = m.group(1).lower()
            value = m.group(2)
            facts.setdefault(entity, set()).add(value)

    for entity, values in facts.items():
        if len(values) > 1:
            vals = ", ".join(sorted(values))
            issues.append(f'Numeric contradiction: "{entity}" has values {vals}')
    return issues


class _LogicalConsistency:
    def __init__(self, *, action: str = "warn") -> None:
        self.name = "logical-consistency"
        self.action = action

    def check(self, text: str, stage: str = "output") -> GuardResult:
        start = time.perf_counter()
        issues: List[str] = []
        lower = text.lower()

        for marker in _CONTRADICTION_MARKERS:
            if marker in lower:
                issues.append(f'Self-correction signal: "{marker}"')

        sentences = _split_sentences(text)
        issues.extend(_find_negation_contradictions(sentences))
        issues.extend(_find_numeric_contradictions(sentences))

        for s in sentences:
            sl = s.lower()
            if ("always" in sl and "never" in sl) or (
                "all" in sl and "none" in sl
            ):
                issues.append(
                    f'Contradictory absolutes in: "{s[:60]}..."'
                )

        triggered = len(issues) > 0
        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(
            guard_name=self.name,
            passed=not triggered,
            action=self.action if triggered else "allow",
            message="; ".join(issues) if triggered else None,
            latency_ms=round(elapsed, 2),
            details={"issues": issues} if triggered else None,
        )


def logical_consistency(*, action: str = "warn") -> _LogicalConsistency:
    return _LogicalConsistency(action=action)
