"""Spanish PII detection and masking guard."""
from __future__ import annotations

import re
import time
from typing import List, Optional

from open_guardrail.core import GuardResult

_PATTERNS: dict[str, re.Pattern[str]] = {
    "dni": re.compile(r"\b\d{8}[A-Z]\b"),
    "nie": re.compile(r"\b[XYZ]\d{7}[A-Z]\b"),
    "nss": re.compile(r"\b\d{2}/?\d{8}/?\d{2}\b"),
    "iban-es": re.compile(r"\bES\d{2}\s?\d{4}\s?\d{4}\s?\d{2}\s?\d{10}\b", re.I),
    "phone-es": re.compile(r"\b(?:\+34|0034)\s?[6-9]\d{2}[\s\-]?\d{3}[\s\-]?\d{3}\b"),
    "cif": re.compile(r"\b[ABCDEFGHJNPQRSUVW]\d{7}[A-Z0-9]\b"),
}

_MASK_LABELS: dict[str, str] = {
    "dni": "[DNI]",
    "nie": "[NIE]",
    "nss": "[NSS]",
    "iban-es": "[IBAN-ES]",
    "phone-es": "[TELÉFONO-ES]",
    "cif": "[CIF]",
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


class _PiiEs:
    def __init__(self, *, action: str = "block", entities: Optional[List[str]] = None) -> None:
        self.name = "pii-es"
        self.action = action
        self._entities = entities or list(_PATTERNS.keys())

    def check(self, text: str, stage: str = "input") -> GuardResult:
        start = time.perf_counter()
        matches = _detect(text, self._entities)
        elapsed = (time.perf_counter() - start) * 1000
        if not matches:
            return GuardResult(guard_name="pii-es", passed=True, action="allow", latency_ms=round(elapsed, 2))
        detected = [{"type": m["type"], "value": m["value"]} for m in matches]
        if self.action == "mask":
            return GuardResult(guard_name="pii-es", passed=True, action="override", override_text=_mask(text, matches), latency_ms=round(elapsed, 2), details={"detected": detected})
        return GuardResult(guard_name="pii-es", passed=False, action=self.action, message="Spanish PII detected", latency_ms=round(elapsed, 2), details={"detected": detected})


def pii_es(*, action: str = "block", entities: Optional[List[str]] = None) -> _PiiEs:
    return _PiiEs(action=action, entities=entities)
