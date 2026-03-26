"""Ban specific substrings from text."""

import time
from typing import List

from open_guardrail.core import GuardResult


class _BanSubstring:
    def __init__(
        self,
        *,
        action: str = "block",
        substrings: List[str],
        case_sensitive: bool = False,
        contains_all: bool = False,
    ) -> None:
        self.name = "ban-substring"
        self.action = action
        self._substrings = substrings
        self._case_sensitive = case_sensitive
        self._contains_all = contains_all

    def check(
        self, text: str, stage: str = "input"
    ) -> GuardResult:
        start = time.perf_counter()
        search_text = (
            text
            if self._case_sensitive
            else text.lower()
        )
        matched: list[str] = []

        for sub in self._substrings:
            search_sub = (
                sub
                if self._case_sensitive
                else sub.lower()
            )
            if search_sub in search_text:
                matched.append(sub)

        if self._contains_all:
            triggered = (
                len(matched) == len(self._substrings)
            )
        else:
            triggered = len(matched) > 0

        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="ban-substring",
            passed=not triggered,
            action=self.action if triggered else "allow",
            message=(
                "Banned substring found: "
                + ", ".join(matched)
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {
                    "matched": matched,
                    "reason": (
                        "Text contains banned"
                        " substrings"
                    ),
                }
                if triggered
                else None
            ),
        )


def ban_substring(
    *,
    action: str = "block",
    substrings: List[str],
    case_sensitive: bool = False,
    contains_all: bool = False,
) -> _BanSubstring:
    return _BanSubstring(
        action=action,
        substrings=substrings,
        case_sensitive=case_sensitive,
        contains_all=contains_all,
    )
