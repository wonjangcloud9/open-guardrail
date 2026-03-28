"""Detect physical addresses in text."""
from __future__ import annotations

import re
import time

from open_guardrail.core import GuardResult

_STREET_RE = re.compile(
    r"\d+\s+\w+\s+"
    r"(Street|St|Avenue|Ave|Road|Rd|"
    r"Boulevard|Blvd|Drive|Dr|Lane|Ln)",
    re.I,
)
_ZIP_RE = re.compile(r"\b\d{5}(-\d{4})?\b")
_PO_BOX_RE = re.compile(
    r"P\.?O\.?\s*Box\s+\d+", re.I
)


class _AddressDetect:
    def __init__(
        self, *, action: str = "warn"
    ) -> None:
        self.name = "address-detect"
        self.action = action

    def check(
        self, text: str, stage: str = "input"
    ) -> GuardResult:
        start = time.perf_counter()
        matches: list[dict] = []

        for m in _STREET_RE.finditer(text):
            matches.append(
                {"type": "street", "value": m.group()}
            )
        for m in _ZIP_RE.finditer(text):
            matches.append(
                {"type": "zip", "value": m.group()}
            )
        for m in _PO_BOX_RE.finditer(text):
            matches.append(
                {"type": "po_box", "value": m.group()}
            )

        triggered = len(matches) > 0
        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(
            guard_name="address-detect",
            passed=not triggered,
            action=(
                self.action if triggered else "allow"
            ),
            message=(
                f"Address detected: {len(matches)} match(es)"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {"matches": matches}
                if triggered
                else None
            ),
        )


def address_detect(
    *, action: str = "warn"
) -> _AddressDetect:
    return _AddressDetect(action=action)
