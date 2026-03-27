"""EU/GDPR PII detection and masking guard."""

import re
import time
from typing import List, Optional

from open_guardrail.core import GuardResult

_PATTERNS: dict[str, re.Pattern[str]] = {
    "iban": re.compile(r"\b[A-Z]{2}\d{2}\s?(?:\d{4}\s?){3,7}\d{1,4}\b", re.I),
    "vat": re.compile(r"\b(?:AT|BE|BG|CY|CZ|DE|DK|EE|EL|ES|FI|FR|HR|HU|IE|IT|LT|LU|LV|MT|NL|PL|PT|RO|SE|SI|SK)[A-Z0-9]{8,12}\b"),
    "passport-eu": re.compile(r"\b[A-Z]{1,2}\d{6,9}\b"),
    "email": re.compile(r"\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b"),
    "ip-address": re.compile(r"\b(?:\d{1,3}\.){3}\d{1,3}\b"),
    "phone-eu": re.compile(r"\b\+(?:3[0-9]|4[0-9])\s?\d[\s\-]?(?:\d[\s\-]?){6,12}\b"),
}

_MASK_LABELS: dict[str, str] = {
    "iban": "[IBAN]",
    "vat": "[VAT-ID]",
    "passport-eu": "[PASSPORT-EU]",
    "email": "[EMAIL]",
    "ip-address": "[IP-ADDRESS]",
    "phone-eu": "[PHONE-EU]",
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


class _PiiEu:
    def __init__(self, *, action: str = "block", entities: Optional[List[str]] = None) -> None:
        self.name = "pii-eu"
        self.action = action
        self._entities = entities or list(_PATTERNS.keys())

    def check(self, text: str, stage: str = "input") -> GuardResult:
        start = time.perf_counter()
        matches = _detect(text, self._entities)
        elapsed = (time.perf_counter() - start) * 1000
        if not matches:
            return GuardResult(guard_name="pii-eu", passed=True, action="allow", latency_ms=round(elapsed, 2))
        detected = [{"type": m["type"], "value": m["value"]} for m in matches]
        if self.action == "mask":
            return GuardResult(guard_name="pii-eu", passed=True, action="override", override_text=_mask(text, matches), latency_ms=round(elapsed, 2), details={"detected": detected})
        return GuardResult(guard_name="pii-eu", passed=False, action=self.action, message="EU PII detected", latency_ms=round(elapsed, 2), details={"detected": detected})


def pii_eu(*, action: str = "block", entities: Optional[List[str]] = None) -> _PiiEu:
    return _PiiEu(action=action, entities=entities)
