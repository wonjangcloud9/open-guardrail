"""Date format validation guard."""
from __future__ import annotations

import re
import time
from typing import Optional

from open_guardrail.core import GuardResult

_FORMATS: dict[str, re.Pattern[str]] = {
    "iso": re.compile(r"\b\d{4}-\d{2}-\d{2}\b"),
    "us": re.compile(r"\b\d{2}/\d{2}/\d{4}\b"),
    "eu": re.compile(r"\b\d{2}\.\d{2}\.\d{4}\b"),
    "kr": re.compile(r"\b\d{4}년\s?\d{1,2}월\s?\d{1,2}일\b"),
}


class _DateFormat:
    def __init__(self, *, action: str = "warn", expected: str = "iso") -> None:
        self.name = "date-format"
        self.action = action
        self.expected = expected

    def check(self, text: str, stage: str = "output") -> GuardResult:
        start = time.perf_counter()
        expected_pat = _FORMATS.get(self.expected)
        has_expected = bool(expected_pat and expected_pat.search(text)) if expected_pat else False
        wrong_formats = []
        for fmt, pat in _FORMATS.items():
            if fmt != self.expected and pat.search(text):
                wrong_formats.append(fmt)
        triggered = not has_expected and len(wrong_formats) > 0
        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(guard_name="date-format", passed=not triggered, action=self.action if triggered else "allow", message=f"Expected {self.expected}, found {', '.join(wrong_formats)}" if triggered else None, latency_ms=round(elapsed, 2), details={"expected": self.expected, "found": wrong_formats} if triggered else None)


def date_format(*, action: str = "warn", expected: str = "iso") -> _DateFormat:
    return _DateFormat(action=action, expected=expected)
