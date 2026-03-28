"""Output consistency guard."""

import re
import time
from typing import Optional

from open_guardrail.core import GuardResult

_CONTRADICTION = [
    re.compile(
        r"\bis\s+(\w+)[\s\S]{1,100}\bis\s+not\s+\1",
        re.IGNORECASE,
    ),
    re.compile(
        r"\bwill\s+(\w+)[\s\S]{1,100}\bwill\s+not\s+\1",
        re.IGNORECASE,
    ),
    re.compile(
        r"\bcan\s+(\w+)[\s\S]{1,100}\bcannot\s+\1",
        re.IGNORECASE,
    ),
    re.compile(
        r"\bshould\s+(\w+)[\s\S]{1,100}"
        r"\bshould\s+not\s+\1",
        re.IGNORECASE,
    ),
]

_LIST_CLAIM = re.compile(
    r"(\d+)\s+(items?|points?|steps?|reasons?|things?)",
    re.IGNORECASE,
)
_NUMBERED = re.compile(r"^\s*\d+[.)]\s", re.MULTILINE)


def _detect_repetition(
    text: str, max_rep: int
) -> list[str]:
    phrases = [
        s.strip().lower()
        for s in re.split(r"[.!?]+", text)
        if len(s.strip()) > 10
    ]
    counts: dict[str, int] = {}
    for p in phrases:
        counts[p] = counts.get(p, 0) + 1
    return [p for p, c in counts.items() if c > max_rep]


def _detect_list_mismatch(text: str) -> bool:
    m = _LIST_CLAIM.search(text)
    if not m:
        return False
    claimed = int(m.group(1))
    numbered = _NUMBERED.findall(text)
    return len(numbered) > 0 and abs(
        len(numbered) - claimed
    ) > 0


class _OutputConsistency:
    def __init__(
        self,
        *,
        action: str = "warn",
        max_repetitions: int = 3,
    ) -> None:
        self.name = "output-consistency"
        self.action = action
        self._max_rep = max_repetitions

    def check(
        self, text: str, stage: str = "output"
    ) -> GuardResult:
        start = time.perf_counter()
        issues: list[str] = []

        for pat in _CONTRADICTION:
            if pat.search(text):
                issues.append("contradiction")
                break

        if _detect_repetition(text, self._max_rep):
            issues.append("excessive-repetition")

        if _detect_list_mismatch(text):
            issues.append("list-count-mismatch")

        triggered = len(issues) > 0
        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(
            guard_name="output-consistency",
            passed=not triggered,
            action=self.action if triggered else "allow",
            message=(
                "Output consistency issues detected"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {"issues": issues} if triggered else None
            ),
        )


def output_consistency(
    *,
    action: str = "warn",
    max_repetitions: int = 3,
) -> _OutputConsistency:
    return _OutputConsistency(
        action=action, max_repetitions=max_repetitions
    )
