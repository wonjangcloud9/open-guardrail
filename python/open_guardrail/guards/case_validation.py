"""Validate text follows expected case."""

import re
import time

from open_guardrail.core import GuardResult


def _is_upper(text: str) -> bool:
    letters = re.findall(r"[a-zA-Z]", text)
    if not letters:
        return True
    return all(c.isupper() for c in letters)


def _is_lower(text: str) -> bool:
    letters = re.findall(r"[a-zA-Z]", text)
    if not letters:
        return True
    return all(c.islower() for c in letters)


def _is_title(text: str) -> bool:
    words = re.findall(r"[a-zA-Z]+", text)
    if not words:
        return True
    return all(w[0].isupper() for w in words)


def _is_sentence(text: str) -> bool:
    sentences = re.split(r"[.!?]\s+", text.strip())
    for s in sentences:
        s = s.strip()
        if not s:
            continue
        first = re.search(r"[a-zA-Z]", s)
        if first and not first.group().isupper():
            return False
    return True


class _CaseValidation:
    def __init__(
        self,
        *,
        action: str = "warn",
        expected: str = "lower",
    ) -> None:
        self.name = "case-validation"
        self.action = action
        self.expected = expected

    def check(
        self, text: str, stage: str = "output"
    ) -> GuardResult:
        start = time.perf_counter()
        validators = {
            "upper": _is_upper,
            "lower": _is_lower,
            "title": _is_title,
            "sentence": _is_sentence,
        }
        validator = validators.get(
            self.expected, lambda t: True
        )
        valid = validator(text)
        triggered = not valid
        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(
            guard_name="case-validation",
            passed=not triggered,
            action=(
                self.action if triggered else "allow"
            ),
            message=(
                f"Text does not match {self.expected} case"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {"expected": self.expected}
                if triggered
                else None
            ),
        )


def case_validation(
    *,
    action: str = "warn",
    expected: str = "lower",
) -> _CaseValidation:
    return _CaseValidation(
        action=action, expected=expected
    )
