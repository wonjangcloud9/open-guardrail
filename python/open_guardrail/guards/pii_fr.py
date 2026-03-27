"""French PII detection and masking guard."""

import re
import time
from typing import List, Optional

from open_guardrail.core import GuardResult

_PATTERNS: dict[str, re.Pattern[str]] = {
    "insee": re.compile(r"\b[12]\s?\d{2}\s?\d{2}\s?\d{2}\s?\d{3}\s?\d{3}\s?\d{2}\b"),
    "carte-nationale": re.compile(r"\b\d{12}\b"),
    "iban-fr": re.compile(r"\bFR\d{2}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{3}\b", re.I),
    "phone-fr": re.compile(r"\b(?:\+33|0033|0)\s?[1-9](?:[\s.\-]?\d{2}){4}\b"),
    "carte-vitale": re.compile(r"\b[12]\s?\d{2}\s?\d{2}\s?\d{5}\s?\d{3}\s?\d{2}\b"),
}

_MASK_LABELS: dict[str, str] = {
    "insee": "[N° INSEE]",
    "carte-nationale": "[CARTE NATIONALE]",
    "iban-fr": "[IBAN-FR]",
    "phone-fr": "[TÉLÉPHONE-FR]",
    "carte-vitale": "[CARTE VITALE]",
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


class _PiiFr:
    def __init__(self, *, action: str = "block", entities: Optional[List[str]] = None) -> None:
        self.name = "pii-fr"
        self.action = action
        self._entities = entities or list(_PATTERNS.keys())

    def check(self, text: str, stage: str = "input") -> GuardResult:
        start = time.perf_counter()
        matches = _detect(text, self._entities)
        elapsed = (time.perf_counter() - start) * 1000
        if not matches:
            return GuardResult(guard_name="pii-fr", passed=True, action="allow", latency_ms=round(elapsed, 2))
        detected = [{"type": m["type"], "value": m["value"]} for m in matches]
        if self.action == "mask":
            return GuardResult(guard_name="pii-fr", passed=True, action="override", override_text=_mask(text, matches), latency_ms=round(elapsed, 2), details={"detected": detected})
        return GuardResult(guard_name="pii-fr", passed=False, action=self.action, message="French PII detected", latency_ms=round(elapsed, 2), details={"detected": detected})


def pii_fr(*, action: str = "block", entities: Optional[List[str]] = None) -> _PiiFr:
    return _PiiFr(action=action, entities=entities)
