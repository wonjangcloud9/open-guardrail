"""Canadian PII detection and masking guard."""
from __future__ import annotations

import re
import time
from typing import List, Optional

from open_guardrail.core import GuardResult

_PATTERNS: dict[str, re.Pattern[str]] = {
    "sin": re.compile(r"\d{3}-\d{3}-\d{3}"),
    "health-card": re.compile(r"\d{10}"),
    "passport": re.compile(r"[A-Z]{2}\d{6}"),
    "phone": re.compile(
        r"\+1[\s-]?\d{3}[\s-]?\d{3}[\s-]?\d{4}"
    ),
}

_MASK_LABELS: dict[str, str] = {
    "sin": "[SIN]",
    "health-card": "[HEALTH-CARD]",
    "passport": "[PASSPORT]",
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


class _PiiCa:
    def __init__(
        self,
        *,
        action: str = "block",
        entities: Optional[List[str]] = None,
    ) -> None:
        self.name = "pii-ca"
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
                guard_name="pii-ca",
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
                guard_name="pii-ca",
                passed=True,
                action="override",
                override_text=_mask_text(text, matches),
                latency_ms=round(elapsed, 2),
                details={"detected": detected},
            )

        return GuardResult(
            guard_name="pii-ca",
            passed=False,
            action=self.action,
            message="Canadian PII detected in text",
            latency_ms=round(elapsed, 2),
            details={
                "detected": detected,
                "reason": (
                    "Text contains Canadian personally"
                    " identifiable information"
                ),
            },
        )


def pii_ca(
    *,
    action: str = "block",
    entities: Optional[List[str]] = None,
) -> _PiiCa:
    return _PiiCa(action=action, entities=entities)
