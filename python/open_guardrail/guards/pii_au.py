"""Australian PII detection and masking guard."""

import re
import time
from typing import List, Optional

from open_guardrail.core import GuardResult

_PATTERNS: dict[str, re.Pattern[str]] = {
    "tfn": re.compile(r"\b\d{3}\s?\d{3}\s?\d{3}\b"),
    "medicare": re.compile(r"\b\d{4}\s?\d{5}\s?\d\b"),
    "passport-au": re.compile(r"\b[A-Z]{1,2}\d{7}\b"),
    "phone-au": re.compile(r"\b(?:\+61|0061|0)\s?[2-9]\d{3}[\s\-]?\d{4}\b"),
    "abn": re.compile(r"\b\d{2}\s?\d{3}\s?\d{3}\s?\d{3}\b"),
    "driver-license-au": re.compile(r"\b\d{6,10}\b"),
}

_MASK_LABELS: dict[str, str] = {
    "tfn": "[TFN]",
    "medicare": "[MEDICARE]",
    "passport-au": "[PASSPORT-AU]",
    "phone-au": "[PHONE-AU]",
    "abn": "[ABN]",
    "driver-license-au": "[DRIVER-LICENSE-AU]",
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


class _PiiAu:
    def __init__(self, *, action: str = "block", entities: Optional[List[str]] = None) -> None:
        self.name = "pii-au"
        self.action = action
        self._entities = entities or list(_PATTERNS.keys())

    def check(self, text: str, stage: str = "input") -> GuardResult:
        start = time.perf_counter()
        matches = _detect(text, self._entities)
        elapsed = (time.perf_counter() - start) * 1000
        if not matches:
            return GuardResult(guard_name="pii-au", passed=True, action="allow", latency_ms=round(elapsed, 2))
        detected = [{"type": m["type"], "value": m["value"]} for m in matches]
        if self.action == "mask":
            return GuardResult(guard_name="pii-au", passed=True, action="override", override_text=_mask(text, matches), latency_ms=round(elapsed, 2), details={"detected": detected})
        return GuardResult(guard_name="pii-au", passed=False, action=self.action, message="Australian PII detected", latency_ms=round(elapsed, 2), details={"detected": detected})


def pii_au(*, action: str = "block", entities: Optional[List[str]] = None) -> _PiiAu:
    return _PiiAu(action=action, entities=entities)
