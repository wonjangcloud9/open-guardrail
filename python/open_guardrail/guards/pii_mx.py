"""Mexican PII detection and masking guard."""
from __future__ import annotations

import re
import time
from typing import List, Optional

from open_guardrail.core import GuardResult

_PATTERNS: dict[str, re.Pattern[str]] = {
    "curp": re.compile(
        r"[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d"
    ),
    "rfc": re.compile(r"[A-Z]{3,4}\d{6}[A-Z0-9]{3}"),
    "phone": re.compile(
        r"\+52[\s-]?\d{2,3}[\s-]?\d{3,4}[\s-]?\d{4}"
    ),
}

_MASK_LABELS: dict[str, str] = {
    "curp": "[CURP]",
    "rfc": "[RFC]",
    "phone": "[PHONE]",
}


def _detect(
    text: str, entities: list[str]
) -> list[dict]:
    matches: list[dict] = []
    for entity in entities:
        pat = _PATTERNS.get(entity)
        if not pat:
            continue
        for m in pat.finditer(text):
            matches.append(
                {
                    "type": entity,
                    "value": m.group(),
                    "start": m.start(),
                    "end": m.end(),
                }
            )
    matches.sort(key=lambda x: x["start"], reverse=True)
    return matches


def _mask_text(text: str, matches: list[dict]) -> str:
    result = text
    for m in matches:
        label = _MASK_LABELS.get(m["type"], "[PII]")
        result = (
            result[: m["start"]] + label + result[m["end"] :]
        )
    return result


class _PiiMx:
    def __init__(
        self,
        *,
        action: str = "block",
        entities: Optional[List[str]] = None,
    ) -> None:
        self.name = "pii-mx"
        self.action = action
        self._entities = entities or list(_PATTERNS.keys())

    def check(
        self, text: str, stage: str = "input"
    ) -> GuardResult:
        start = time.perf_counter()
        matches = _detect(text, self._entities)
        elapsed = (time.perf_counter() - start) * 1000

        if not matches:
            return GuardResult(
                guard_name="pii-mx",
                passed=True,
                action="allow",
                latency_ms=round(elapsed, 2),
            )

        detected = [
            {"type": m["type"], "value": m["value"]}
            for m in matches
        ]

        if self.action == "mask":
            return GuardResult(
                guard_name="pii-mx",
                passed=True,
                action="override",
                override_text=_mask_text(text, matches),
                latency_ms=round(elapsed, 2),
                details={"detected": detected},
            )

        return GuardResult(
            guard_name="pii-mx",
            passed=False,
            action=self.action,
            message="Mexican PII detected in text",
            latency_ms=round(elapsed, 2),
            details={
                "detected": detected,
                "reason": (
                    "Text contains Mexican personally"
                    " identifiable information"
                ),
            },
        )


def pii_mx(
    *,
    action: str = "block",
    entities: Optional[List[str]] = None,
) -> _PiiMx:
    return _PiiMx(action=action, entities=entities)
