"""Thai PII detection and masking guard."""
from __future__ import annotations

import re
import time
from typing import List, Optional

from open_guardrail.core import GuardResult

_PATTERNS: dict[str, re.Pattern[str]] = {
    "national-id": re.compile(r"\b[1-8]\s?\d{4}\s?\d{5}\s?\d{2}\s?\d\b"),
    "passport-th": re.compile(r"\b[A-Z]{2}\d{7}\b"),
    "phone-th": re.compile(r"\b(?:\+66|0066|0)\s?[2-9]\d[\s\-]?\d{3}[\s\-]?\d{4}\b"),
    "tax-id": re.compile(r"\b\d{13}\b"),
}

_MASK_LABELS: dict[str, str] = {
    "national-id": "[เลขบัตรประชาชน]",
    "passport-th": "[หนังสือเดินทาง]",
    "phone-th": "[โทรศัพท์]",
    "tax-id": "[เลขประจำตัวผู้เสียภาษี]",
}


def _detect(text: str, entities: list[str]) -> list[dict]:
    matches: list[dict] = []
    for entity in entities:
        pat = _PATTERNS.get(entity)
        if not pat:
            continue
        for m in pat.finditer(text):
            matches.append({"type": entity, "value": m.group(), "start": m.start(), "end": m.end()})
    matches.sort(key=lambda x: x["start"], reverse=True)
    return matches


def _mask(text: str, matches: list[dict]) -> str:
    result = text
    for m in matches:
        result = result[: m["start"]] + _MASK_LABELS.get(m["type"], "[PII]") + result[m["end"] :]
    return result


class _PiiTh:
    def __init__(self, *, action: str = "block", entities: Optional[List[str]] = None) -> None:
        self.name = "pii-th"
        self.action = action
        self._entities = entities or list(_PATTERNS.keys())

    def check(self, text: str, stage: str = "input") -> GuardResult:
        start = time.perf_counter()
        matches = _detect(text, self._entities)
        elapsed = (time.perf_counter() - start) * 1000
        if not matches:
            return GuardResult(guard_name="pii-th", passed=True, action="allow", latency_ms=round(elapsed, 2))
        detected = [{"type": m["type"], "value": m["value"]} for m in matches]
        if self.action == "mask":
            return GuardResult(guard_name="pii-th", passed=True, action="override", override_text=_mask(text, matches), latency_ms=round(elapsed, 2), details={"detected": detected})
        return GuardResult(guard_name="pii-th", passed=False, action=self.action, message="Thai PII detected", latency_ms=round(elapsed, 2), details={"detected": detected})


def pii_th(*, action: str = "block", entities: Optional[List[str]] = None) -> _PiiTh:
    return _PiiTh(action=action, entities=entities)
