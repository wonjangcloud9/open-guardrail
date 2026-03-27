"""Italian PII detection and masking guard."""

import re
import time
from typing import List, Optional

from open_guardrail.core import GuardResult

_PATTERNS: dict[str, re.Pattern[str]] = {
    "codice-fiscale": re.compile(r"\b[A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z]\b"),
    "partita-iva": re.compile(r"\b\d{11}\b"),
    "carta-identita": re.compile(r"\b[A-Z]{2}\d{5}[A-Z]{2}\b"),
    "iban-it": re.compile(r"\bIT\d{2}\s?[A-Z]\s?\d{5}\s?\d{5}\s?\d{12}\b", re.I),
    "phone-it": re.compile(r"\b(?:\+39|0039)\s?[03]\d{2}[\s\-]?\d{3}[\s\-]?\d{4}\b"),
    "tessera-sanitaria": re.compile(r"\b\d{20}\b"),
}

_MASK_LABELS: dict[str, str] = {
    "codice-fiscale": "[CODICE FISCALE]",
    "partita-iva": "[PARTITA IVA]",
    "carta-identita": "[CARTA IDENTITÀ]",
    "iban-it": "[IBAN-IT]",
    "phone-it": "[TELEFONO-IT]",
    "tessera-sanitaria": "[TESSERA SANITARIA]",
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


class _PiiIt:
    def __init__(self, *, action: str = "block", entities: Optional[List[str]] = None) -> None:
        self.name = "pii-it"
        self.action = action
        self._entities = entities or list(_PATTERNS.keys())

    def check(self, text: str, stage: str = "input") -> GuardResult:
        start = time.perf_counter()
        matches = _detect(text, self._entities)
        elapsed = (time.perf_counter() - start) * 1000
        if not matches:
            return GuardResult(guard_name="pii-it", passed=True, action="allow", latency_ms=round(elapsed, 2))
        detected = [{"type": m["type"], "value": m["value"]} for m in matches]
        if self.action == "mask":
            return GuardResult(guard_name="pii-it", passed=True, action="override", override_text=_mask(text, matches), latency_ms=round(elapsed, 2), details={"detected": detected})
        return GuardResult(guard_name="pii-it", passed=False, action=self.action, message="Italian PII detected", latency_ms=round(elapsed, 2), details={"detected": detected})


def pii_it(*, action: str = "block", entities: Optional[List[str]] = None) -> _PiiIt:
    return _PiiIt(action=action, entities=entities)
