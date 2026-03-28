"""Arabic/Middle East PII detection and masking guard."""
from __future__ import annotations

import re
import time
from typing import List, Optional

from open_guardrail.core import GuardResult

_PATTERNS: dict[str, re.Pattern[str]] = {
    "national-id": re.compile(r"\b[12]\d{9}\b"),
    "iqama": re.compile(r"\b2\d{9}\b"),
    "passport-ar": re.compile(r"\b[A-Z]\d{8}\b"),
    "phone-ar": re.compile(r"\b(?:\+(?:966|971|20|962|961|974|973|968|965)|00(?:966|971|20))\s?\d[\s\-]?\d{3}[\s\-]?\d{4}\b"),
    "email": re.compile(r"\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b"),
}

_MASK_LABELS: dict[str, str] = {
    "national-id": "[رقم الهوية]",
    "iqama": "[رقم الإقامة]",
    "passport-ar": "[جواز السفر]",
    "phone-ar": "[رقم الهاتف]",
    "email": "[البريد الإلكتروني]",
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


class _PiiAr:
    def __init__(self, *, action: str = "block", entities: Optional[List[str]] = None) -> None:
        self.name = "pii-ar"
        self.action = action
        self._entities = entities or list(_PATTERNS.keys())

    def check(self, text: str, stage: str = "input") -> GuardResult:
        start = time.perf_counter()
        matches = _detect(text, self._entities)
        elapsed = (time.perf_counter() - start) * 1000
        if not matches:
            return GuardResult(guard_name="pii-ar", passed=True, action="allow", latency_ms=round(elapsed, 2))
        detected = [{"type": m["type"], "value": m["value"]} for m in matches]
        if self.action == "mask":
            return GuardResult(guard_name="pii-ar", passed=True, action="override", override_text=_mask(text, matches), latency_ms=round(elapsed, 2), details={"detected": detected})
        return GuardResult(guard_name="pii-ar", passed=False, action=self.action, message="Arabic PII detected", latency_ms=round(elapsed, 2), details={"detected": detected})


def pii_ar(*, action: str = "block", entities: Optional[List[str]] = None) -> _PiiAr:
    return _PiiAr(action=action, entities=entities)
