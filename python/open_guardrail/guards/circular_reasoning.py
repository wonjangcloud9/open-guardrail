"""Detect circular reasoning where conclusion restates premise."""
from __future__ import annotations

import re
import time
from typing import List, Set

from open_guardrail.core import GuardResult

_TAUTOLOGY_PATTERNS: List[re.Pattern[str]] = [
    re.compile(p, re.IGNORECASE)
    for p in [
        r"\bthe reason (?:is |why .{0,40}is )because\b",
        r"\bthis is true because it is true\b",
        r"\bby definition\b",
        r"\bit is what it is\b",
        r"\bbecause (?:it |that )?(?:just )?is\b",
    ]
]

_BEGGING_RE = re.compile(
    r"\b(?:obviously|clearly|evidently|undeniably|"
    r"unquestionably)\b",
    re.IGNORECASE,
)
_EVIDENCE_RE = re.compile(
    r"\b(?:because|since|according|study|research|"
    r"data|evidence|source|found that)\b",
    re.IGNORECASE,
)
_SENTENCE_SPLIT = re.compile(r"(?<=[.!?])\s+")
_BECAUSE_RE = re.compile(
    r"([^.!?]{10,})[.!?]\s*[^.!?]*\bbecause\s+([^.!?]{10,})",
    re.IGNORECASE,
)
_THEREFORE_RE = re.compile(
    r"([^.!?]{10,})[.!?][\s\S]{0,200}"
    r"\b(?:therefore|thus|hence|so)\s*,?\s*([^.!?]{10,})",
    re.IGNORECASE,
)


def _trigrams(text: str) -> Set[str]:
    words = re.sub(r"[^a-z0-9\s]", "", text.lower()).split()
    return {
        f"{words[i]} {words[i+1]} {words[i+2]}"
        for i in range(len(words) - 2)
    }


def _trigram_similarity(a: str, b: str) -> float:
    ta, tb = _trigrams(a), _trigrams(b)
    if not ta or not tb:
        return 0.0
    intersection = len(ta & tb)
    return intersection / min(len(ta), len(tb))


class _CircularReasoning:
    def __init__(self, *, action: str = "block") -> None:
        self.name = "circular-reasoning"
        self.action = action

    def check(self, text: str, stage: str = "output") -> GuardResult:
        start = time.perf_counter()
        issues: List[str] = []

        # 1. Tautological patterns
        for p in _TAUTOLOGY_PATTERNS:
            if p.search(text):
                issues.append("Tautological pattern detected")
                break

        # 2. "because" restatement
        m = _BECAUSE_RE.search(text)
        if m and _trigram_similarity(m.group(1), m.group(2)) > 0.5:
            issues.append('"because" clause restates the claim')

        # 3. "therefore" repetition
        m = _THEREFORE_RE.search(text)
        if m and _trigram_similarity(m.group(1), m.group(2)) > 0.5:
            issues.append(
                '"therefore" conclusion restates earlier premise'
            )

        # 4. Begging the question
        sentences = [
            s.strip()
            for s in _SENTENCE_SPLIT.split(text)
            if len(s.strip()) > 5
        ]
        for s in sentences:
            if _BEGGING_RE.search(s) and not _EVIDENCE_RE.search(s):
                issues.append(
                    "Unsupported certainty claim without evidence"
                )
                break

        # 5. First vs last sentence similarity
        if len(sentences) >= 3:
            sim = _trigram_similarity(sentences[0], sentences[-1])
            if sim > 0.7:
                issues.append(
                    f"First and last sentences are very similar "
                    f"({sim * 100:.0f}% trigram overlap)"
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


def circular_reasoning(
    *, action: str = "block"
) -> _CircularReasoning:
    return _CircularReasoning(action=action)
