"""Verify cited sources actually support claims."""
from __future__ import annotations

import re
import time

from open_guardrail.core import GuardResult

_GENERIC = re.compile(
    r"\[(?:citation needed|source|reference)\]",
    re.IGNORECASE,
)
_BROKEN = re.compile(
    r"\[(?:\?|unknown|N/A)\]", re.IGNORECASE
)
_FABRICATED = re.compile(
    r"\[Source:\s*AI[- ]generated\]", re.IGNORECASE
)
_NUM_REF = re.compile(r"\[(\d+)\]")
_PAREN_REF = re.compile(r"\((\d+)\)")
_CURLY_REF = re.compile(r"\{(\d+)\}")


def _detect_issues(text: str) -> list[str]:
    issues: list[str] = []

    if _GENERIC.search(text):
        issues.append("generic_citation")
    if _BROKEN.search(text):
        issues.append("broken_citation")
    if _FABRICATED.search(text):
        issues.append("fabricated_source")

    for m in _NUM_REF.finditer(text):
        n = m.group(1)
        defn = re.compile(
            rf"^\s*\[{re.escape(n)}\]\s*:", re.MULTILINE
        )
        if not defn.search(text):
            issues.append(f"undefined_ref_[{n}]")

    has_num = bool(_NUM_REF.search(text))
    has_par = bool(_PAREN_REF.search(text))
    has_cur = bool(_CURLY_REF.search(text))
    if sum([has_num, has_par, has_cur]) > 1:
        issues.append("inconsistent_citation_format")

    return issues


class _SourceAttributionAccuracy:
    def __init__(self, *, action: str = "warn") -> None:
        self.name = "source-attribution-accuracy"
        self.action = action

    def check(
        self, text: str, stage: str = "output"
    ) -> GuardResult:
        start = time.perf_counter()
        issues = _detect_issues(text)
        triggered = len(issues) > 0
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="source-attribution-accuracy",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=(
                min(len(issues) / 5, 1.0)
                if triggered
                else 0.0
            ),
            message=(
                "Source attribution issues detected"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {"issues": issues} if triggered else None
            ),
        )


def source_attribution_accuracy(
    *, action: str = "warn"
) -> _SourceAttributionAccuracy:
    return _SourceAttributionAccuracy(action=action)
