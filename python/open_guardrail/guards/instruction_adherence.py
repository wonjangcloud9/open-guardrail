"""Check if text contains all required phrases."""
from __future__ import annotations

import re
import time
from typing import List

from open_guardrail.core import GuardResult


class _InstructionAdherence:
    def __init__(
        self,
        *,
        action: str = "warn",
        required_phrases: List[str],
    ) -> None:
        self.name = "instruction-adherence"
        self.action = action
        self._required = required_phrases

    def check(
        self, text: str, stage: str = "output"
    ) -> GuardResult:
        start = time.perf_counter()
        lower = text.lower()
        missing: list[str] = []

        for phrase in self._required:
            pattern = re.escape(phrase.lower())
            if not re.search(pattern, lower):
                missing.append(phrase)

        triggered = len(missing) > 0
        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(
            guard_name="instruction-adherence",
            passed=not triggered,
            action=(
                self.action if triggered else "allow"
            ),
            message=(
                "Missing required phrases: "
                + ", ".join(missing)
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {"missing": missing}
                if triggered
                else None
            ),
        )


def instruction_adherence(
    *,
    action: str = "warn",
    required_phrases: List[str],
) -> _InstructionAdherence:
    return _InstructionAdherence(
        action=action,
        required_phrases=required_phrases,
    )
