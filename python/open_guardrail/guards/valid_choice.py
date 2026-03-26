"""Validate text is one of allowed choices."""

import time
from typing import List

from open_guardrail.core import GuardResult


class _ValidChoice:
    def __init__(
        self,
        *,
        action: str = "block",
        choices: List[str],
        case_sensitive: bool = False,
        trim_whitespace: bool = True,
    ) -> None:
        self.name = "valid-choice"
        self.action = action
        self._choices = choices
        self._case_sensitive = case_sensitive
        self._trim = trim_whitespace

        self._normalized = []
        for c in choices:
            val = c.strip() if self._trim else c
            if not case_sensitive:
                val = val.lower()
            self._normalized.append(val)

    def check(
        self, text: str, stage: str = "output"
    ) -> GuardResult:
        start = time.perf_counter()
        norm = text.strip() if self._trim else text
        if not self._case_sensitive:
            norm = norm.lower()

        is_valid = norm in self._normalized
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="valid-choice",
            passed=is_valid,
            action="allow" if is_valid else self.action,
            message=(
                None
                if is_valid
                else (
                    f'"{text.strip()}" is not one of'
                    " the allowed choices:"
                    f" {', '.join(self._choices)}"
                )
            ),
            latency_ms=round(elapsed, 2),
            details=(
                None
                if is_valid
                else {
                    "received": text.strip(),
                    "allowed_choices": self._choices,
                    "reason": (
                        "Response must be one of the"
                        " predefined valid choices"
                    ),
                }
            ),
        )


def valid_choice(
    *,
    action: str = "block",
    choices: List[str],
    case_sensitive: bool = False,
    trim_whitespace: bool = True,
) -> _ValidChoice:
    return _ValidChoice(
        action=action,
        choices=choices,
        case_sensitive=case_sensitive,
        trim_whitespace=trim_whitespace,
    )
