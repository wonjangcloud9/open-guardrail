"""Indian PII detection and masking guard."""

import re
import time
from typing import List, Optional

from open_guardrail.core import GuardResult

_PATTERNS: dict[str, re.Pattern[str]] = {
    "aadhaar": re.compile(r"\b\d{4}\s?\d{4}\s?\d{4}\b"),
    "pan": re.compile(r"\b[A-Z]{5}\d{4}[A-Z]\b"),
    "passport-in": re.compile(r"\b[A-Z]\d{7}\b"),
    "phone-in": re.compile(r"\b(?:\+91|0091|0)\s?[6-9]\d{4}[\s\-]?\d{5}\b"),
    "ifsc": re.compile(r"\b[A-Z]{4}0[A-Z0-9]{6}\b"),
    "voter-id": re.compile(r"\b[A-Z]{3}\d{7}\b"),
}

_MASK_LABELS: dict[str, str] = {
    "aadhaar": "[AADHAAR]",
    "pan": "[PAN]",
    "passport-in": "[PASSPORT-IN]",
    "phone-in": "[PHONE-IN]",
    "ifsc": "[IFSC]",
    "voter-id": "[VOTER-ID]",
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


class _PiiIn:
    def __init__(self, *, action: str = "block", entities: Optional[List[str]] = None) -> None:
        self.name = "pii-in"
        self.action = action
        self._entities = entities or list(_PATTERNS.keys())

    def check(self, text: str, stage: str = "input") -> GuardResult:
        start = time.perf_counter()
        matches = _detect(text, self._entities)
        elapsed = (time.perf_counter() - start) * 1000
        if not matches:
            return GuardResult(guard_name="pii-in", passed=True, action="allow", latency_ms=round(elapsed, 2))
        detected = [{"type": m["type"], "value": m["value"]} for m in matches]
        if self.action == "mask":
            return GuardResult(guard_name="pii-in", passed=True, action="override", override_text=_mask(text, matches), latency_ms=round(elapsed, 2), details={"detected": detected})
        return GuardResult(guard_name="pii-in", passed=False, action=self.action, message="Indian PII detected", latency_ms=round(elapsed, 2), details={"detected": detected})


def pii_in(*, action: str = "block", entities: Optional[List[str]] = None) -> _PiiIn:
    return _PiiIn(action=action, entities=entities)
