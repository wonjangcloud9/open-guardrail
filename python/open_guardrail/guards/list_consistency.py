"""Detect inconsistent numbered/bulleted lists."""
from __future__ import annotations

import re
import time
from typing import List

from open_guardrail.core import GuardResult

_NUMBERED_ITEM_RE = re.compile(r"^\s*(\d+)[.)]\s", re.MULTILINE)
_CLAIMED_COUNT_RE = re.compile(
    r"\b(?:here\s+are|following|these|the)\s+(\d+)\s+"
    r"(?:\w+\s+)?(?:items?|points?|steps?|reasons?|things?|"
    r"ways?|tips?|examples?|options?|factors?|rules?|methods?)\b",
    re.IGNORECASE,
)


class _ListConsistency:
    def __init__(self, *, action: str = "block") -> None:
        self.name = "list-consistency"
        self.action = action

    def check(self, text: str, stage: str = "output") -> GuardResult:
        start = time.perf_counter()
        issues: List[str] = []

        numbers = [
            int(m.group(1)) for m in _NUMBERED_ITEM_RE.finditer(text)
        ]

        if numbers:
            # Gaps
            for i in range(1, len(numbers)):
                expected = numbers[i - 1] + 1
                if numbers[i] != expected and numbers[i] != 1:
                    issues.append(
                        f"Numbering gap: expected {expected}, "
                        f"found {numbers[i]}"
                    )

            # Duplicates
            for i in range(1, len(numbers)):
                if numbers[i] == numbers[i - 1] and numbers[i] != 1:
                    issues.append(f"Duplicate number: {numbers[i]}")

            # Single-item list
            if len(numbers) == 1 and numbers[0] == 1:
                issues.append("Single-item numbered list")

        # Claimed count mismatch
        for m in _CLAIMED_COUNT_RE.finditer(text):
            claimed = int(m.group(1))
            if numbers and abs(claimed - len(numbers)) > 0:
                issues.append(
                    f"Claimed {claimed} items but found "
                    f"{len(numbers)} numbered items"
                )

        triggered = len(issues) > 0
        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(
            guard_name=self.name,
            passed=not triggered,
            action=self.action if triggered else "allow",
            message="; ".join(issues) if triggered else None,
            latency_ms=round(elapsed, 2),
            details=(
                {"issues": issues, "numbers_found": numbers}
                if triggered
                else None
            ),
        )


def list_consistency(*, action: str = "block") -> _ListConsistency:
    return _ListConsistency(action=action)
