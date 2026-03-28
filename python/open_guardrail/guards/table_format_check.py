"""Validate markdown table formatting."""
from __future__ import annotations

import re
import time

from open_guardrail.core import GuardResult


class _TableFormatCheck:
    def __init__(self, *, action: str = "warn") -> None:
        self.name = "table-format-check"
        self.action = action

    def check(
        self, text: str, stage: str = "output"
    ) -> GuardResult:
        start = time.perf_counter()
        issues: list[str] = []
        table_pat = re.compile(
            r"(?:^|\n)(\|.+\|(?:\n\|.+\|)+)"
        )

        for tm in table_pat.finditer(text):
            rows = tm.group(1).strip().split("\n")
            if len(rows) < 2:
                continue

            col_counts = []
            for r in rows:
                cells = r.split("|")
                cols = cells[1:-1]
                col_counts.append(len(cols))

            header_cols = col_counts[0]
            for i in range(1, len(col_counts)):
                if col_counts[i] != header_cols:
                    issues.append(
                        f"Row {i+1} has {col_counts[i]}"
                        f" cols, expected {header_cols}"
                    )

            if len(rows) >= 2:
                sep = rows[1]
                if not re.match(
                    r"^\|[\s:]*-+[\s:]*\|", sep
                ):
                    issues.append(
                        "Missing or invalid alignment row"
                    )

            for i, row in enumerate(rows):
                cells = row.split("|")[1:-1]
                for j, cell in enumerate(cells):
                    if cell.strip() == "" and i != 1:
                        issues.append(
                            f"Empty cell at row {i+1},"
                            f" col {j+1}"
                        )

        triggered = len(issues) > 0
        score = (
            min(len(issues) / 4, 1.0)
            if triggered
            else 0.0
        )
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="table-format-check",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=score,
            message=(
                "Table formatting issues found"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {"issues": issues} if triggered else None
            ),
        )


def table_format_check(
    *, action: str = "warn"
) -> _TableFormatCheck:
    return _TableFormatCheck(action=action)
