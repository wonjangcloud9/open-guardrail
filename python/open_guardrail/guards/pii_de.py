"""German PII detection and masking guard."""
from __future__ import annotations

import re
import time
from typing import List, Optional

from open_guardrail.core import GuardResult

_PATTERNS: dict[str, re.Pattern[str]] = {
    "personalausweis": re.compile(r"\b[CFGHJKLMNPRTVWXYZ0-9]{9}\d\b"),
    "steuer-id": re.compile(r"\b\d{11}\b"),
    "sozialversicherung": re.compile(r"\b\d{2}\s?\d{6}\s?[A-Z]\s?\d{3}\b"),
    "iban-de": re.compile(r"\bDE\d{2}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{2}\b", re.I),
    "phone-de": re.compile(r"\b(?:\+49|0049|0)\s?(?:\d[\s\-]?){9,11}\b"),
}

_MASK_LABELS: dict[str, str] = {
    "personalausweis": "[PERSONALAUSWEIS-NR]",
    "steuer-id": "[STEUER-ID]",
    "sozialversicherung": "[SOZIALVERSICHERUNGSNR]",
    "iban-de": "[IBAN-DE]",
    "phone-de": "[TELEFON-DE]",
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


class _PiiDe:
    def __init__(self, *, action: str = "block", entities: Optional[List[str]] = None) -> None:
        self.name = "pii-de"
        self.action = action
        self._entities = entities or list(_PATTERNS.keys())

    def check(self, text: str, stage: str = "input") -> GuardResult:
        start = time.perf_counter()
        matches = _detect(text, self._entities)
        elapsed = (time.perf_counter() - start) * 1000
        if not matches:
            return GuardResult(guard_name="pii-de", passed=True, action="allow", latency_ms=round(elapsed, 2))
        detected = [{"type": m["type"], "value": m["value"]} for m in matches]
        if self.action == "mask":
            return GuardResult(guard_name="pii-de", passed=True, action="override", override_text=_mask(text, matches), latency_ms=round(elapsed, 2), details={"detected": detected})
        return GuardResult(guard_name="pii-de", passed=False, action=self.action, message="German PII detected", latency_ms=round(elapsed, 2), details={"detected": detected})


def pii_de(*, action: str = "block", entities: Optional[List[str]] = None) -> _PiiDe:
    return _PiiDe(action=action, entities=entities)
