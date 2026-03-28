"""Validate dates in output."""
from __future__ import annotations

import re
import time

from open_guardrail.core import GuardResult

_DATE_PATTERNS = [
    (
        re.compile(r"\b(\d{1,2})/(\d{1,2})/(\d{4})\b"),
        "MDY",
    ),
    (
        re.compile(r"\b(\d{4})-(\d{2})-(\d{2})\b"),
        "YMD",
    ),
    (
        re.compile(r"\b(\d{1,2})-(\d{1,2})-(\d{4})\b"),
        "DMY",
    ),
]

_NAMED_DATE = re.compile(
    r"\b(January|February|March|April|May|June"
    r"|July|August|September|October|November"
    r"|December)\s+(\d{1,2}),?\s+(\d{4})\b",
    re.IGNORECASE,
)

_MONTH_DAYS = [
    0, 31, 29, 31, 30, 31, 30,
    31, 31, 30, 31, 30, 31,
]

_MONTH_MAP = {
    "january": 1, "february": 2, "march": 3,
    "april": 4, "may": 5, "june": 6,
    "july": 7, "august": 8, "september": 9,
    "october": 10, "november": 11, "december": 12,
}


def _is_impossible(m: int, d: int, y: int) -> bool:
    if m < 1 or m > 12:
        return True
    if d < 1 or d > _MONTH_DAYS[m]:
        return True
    if m == 2 and d == 29:
        leap = (y % 4 == 0 and y % 100 != 0) or (
            y % 400 == 0
        )
        if not leap:
            return True
    return False


class _DateAccuracy:
    def __init__(self, *, action: str = "warn") -> None:
        self.name = "date-accuracy"
        self.action = action

    def check(
        self, text: str, stage: str = "output"
    ) -> GuardResult:
        start = time.perf_counter()
        issues: list[str] = []
        formats: set[str] = set()

        for pat, order in _DATE_PATTERNS:
            for match in pat.finditer(text):
                if order == "MDY":
                    m, d, y = (
                        int(match.group(1)),
                        int(match.group(2)),
                        int(match.group(3)),
                    )
                elif order == "YMD":
                    y, m, d = (
                        int(match.group(1)),
                        int(match.group(2)),
                        int(match.group(3)),
                    )
                else:
                    d, m, y = (
                        int(match.group(1)),
                        int(match.group(2)),
                        int(match.group(3)),
                    )
                formats.add(order)
                if _is_impossible(m, d, y):
                    issues.append(
                        f"impossible_date:{match.group(0)}"
                    )
                if y > 2030:
                    issues.append(
                        f"far_future:{match.group(0)}"
                    )

        for match in _NAMED_DATE.finditer(text):
            name = match.group(1).lower()
            m = _MONTH_MAP.get(name, 0)
            d = int(match.group(2))
            y = int(match.group(3))
            formats.add("NAMED")
            if _is_impossible(m, d, y):
                issues.append(
                    f"impossible_date:{match.group(0)}"
                )
            if y > 2030:
                issues.append(
                    f"far_future:{match.group(0)}"
                )

        if len(formats) > 2:
            issues.append("inconsistent_formats")

        triggered = len(issues) > 0
        score = (
            min(len(issues) / 3, 1.0)
            if triggered
            else 0.0
        )
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="date-accuracy",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=score,
            message=(
                "Date accuracy issue detected"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {"issues": issues} if triggered else None
            ),
        )


def date_accuracy(
    *, action: str = "warn"
) -> _DateAccuracy:
    return _DateAccuracy(action=action)
