"""Check that data sources are properly documented (EU AI Act Art. 10)."""
from __future__ import annotations

import re
import time

from open_guardrail.core import GuardResult

_DATA_REF = re.compile(
    r"\b(?:dataset|training\s+data|data\s+source"
    r"|collected\s+from|data\s+from"
    r"|sourced\s+from)\b",
    re.IGNORECASE,
)

_SOURCE_ID = re.compile(
    r"(?:https?://\S+"
    r"|(?:database|db|api|org(?:anization)?)"
    r"\s*[:=]\s*\S+"
    r"|\bfrom\s+(?:the\s+)?"
    r"[A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+)*\b)",
)

_DATE_REF = re.compile(
    r"\b(?:\d{4}[-/]\d{2}(?:[-/]\d{2})?"
    r"|(?:January|February|March|April|May"
    r"|June|July|August|September|October"
    r"|November|December)\s+\d{4}"
    r"|Q[1-4]\s+\d{4}"
    r"|collected\s+(?:on|in|during)"
    r"\s+\d{4})\b",
    re.IGNORECASE,
)


class _DataProvenance:
    def __init__(
        self, *, action: str = "block"
    ) -> None:
        self.name = "data-provenance"
        self.action = action

    def check(
        self, text: str, stage: str = "output"
    ) -> GuardResult:
        start = time.perf_counter()

        has_data_ref = bool(_DATA_REF.search(text))
        if not has_data_ref:
            elapsed = (
                time.perf_counter() - start
            ) * 1000
            return GuardResult(
                guard_name="data-provenance",
                passed=True,
                action="allow",
                latency_ms=round(elapsed, 2),
            )

        has_source = bool(_SOURCE_ID.search(text))
        has_date = bool(_DATE_REF.search(text))

        missing: list[str] = []
        if not has_source:
            missing.append("source identification")
        if not has_date:
            missing.append(
                "collection date/timestamp"
            )

        triggered = len(missing) > 0
        elapsed = (
            time.perf_counter() - start
        ) * 1000

        return GuardResult(
            guard_name="data-provenance",
            passed=not triggered,
            action=(
                self.action if triggered else "allow"
            ),
            message=(
                "Data reference lacks provenance"
                " details: " + ", ".join(missing)
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {
                    "missing_fields": missing,
                    "source_found": has_source,
                    "date_found": has_date,
                    "reason": (
                        "EU AI Act Art. 10 requires"
                        " proper data provenance"
                        " documentation"
                    ),
                }
                if triggered
                else None
            ),
        )


def data_provenance(
    *, action: str = "block"
) -> _DataProvenance:
    return _DataProvenance(action=action)
