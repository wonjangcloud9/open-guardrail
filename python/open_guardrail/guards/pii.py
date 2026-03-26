"""PII detection and masking guard."""

import re
import time
from typing import List, Optional

from open_guardrail.core import GuardResult

_PATTERNS: dict[str, re.Pattern[str]] = {
    "email": re.compile(
        r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}"
    ),
    "phone": re.compile(
        r"(?:\+?\d{1,3}[-.\s]?)?"
        r"\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{4}"
    ),
    "credit-card": re.compile(
        r"\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b"
    ),
    "ssn": re.compile(r"\b\d{3}-\d{2}-\d{4}\b"),
    "passport": re.compile(r"\b[A-Z]{1,2}\d{6,9}\b"),
    "driver-license": re.compile(
        r"\b[A-Z]\d{3}-\d{4}-\d{4}\b"
    ),
    "itin": re.compile(r"\b9\d{2}-[7-9]\d-\d{4}\b"),
    "medicare": re.compile(
        r"\b\d[A-Z][A-Z0-9]\d[- ]?"
        r"[A-Z][A-Z0-9]\d[- ]?[A-Z]{2}\d{2}\b"
    ),
}

_MASK_LABELS: dict[str, str] = {
    "email": "[EMAIL]",
    "phone": "[PHONE]",
    "credit-card": "[CREDIT_CARD]",
    "ssn": "[SSN]",
    "passport": "[PASSPORT]",
    "driver-license": "[DRIVER_LICENSE]",
    "itin": "[ITIN]",
    "medicare": "[MEDICARE]",
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


class _Pii:
    def __init__(
        self,
        *,
        action: str = "block",
        entities: Optional[List[str]] = None,
    ) -> None:
        self.name = "pii"
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
                guard_name="pii",
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
                guard_name="pii",
                passed=True,
                action="override",
                override_text=_mask_text(text, matches),
                latency_ms=round(elapsed, 2),
                details={"detected": detected},
            )

        return GuardResult(
            guard_name="pii",
            passed=False,
            action=self.action,
            message="PII detected in text",
            latency_ms=round(elapsed, 2),
            details={
                "detected": detected,
                "reason": (
                    "Text contains personally"
                    " identifiable information"
                ),
            },
        )


def pii(
    *,
    action: str = "block",
    entities: Optional[List[str]] = None,
) -> _Pii:
    return _Pii(action=action, entities=entities)
