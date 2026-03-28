"""Polish PII detection and masking guard."""
from __future__ import annotations

import re
import time
from typing import List, Optional

from open_guardrail.core import GuardResult

_PATTERNS: dict[str, re.Pattern[str]] = {
    "pesel": re.compile(r"\b\d{11}\b"),
    "nip": re.compile(r"\b\d{3}-?\d{3}-?\d{2}-?\d{2}\b"),
    "regon": re.compile(r"\b\d{9}(?:\d{5})?\b"),
    "dowod": re.compile(r"\b[A-Z]{3}\d{6}\b"),
    "phone-pl": re.compile(r"\b(?:\+48|0048)\s?\d{3}[\s\-]?\d{3}[\s\-]?\d{3}\b"),
}

_MASK_LABELS = {"pesel": "[PESEL]", "nip": "[NIP]", "regon": "[REGON]", "dowod": "[DOWÓD]", "phone-pl": "[TELEFON-PL]"}


def _detect(text: str, entities: list[str]) -> list[dict]:
    matches = []
    for e in entities:
        pat = _PATTERNS.get(e)
        if pat:
            for m in pat.finditer(text):
                matches.append({"type": e, "value": m.group(), "start": m.start(), "end": m.end()})
    matches.sort(key=lambda x: x["start"], reverse=True)
    return matches


def _mask(text: str, matches: list[dict]) -> str:
    r = text
    for m in matches:
        r = r[: m["start"]] + _MASK_LABELS.get(m["type"], "[PII]") + r[m["end"] :]
    return r


class _PiiPl:
    def __init__(self, *, action: str = "block", entities: Optional[List[str]] = None) -> None:
        self.name = "pii-pl"
        self.action = action
        self._entities = entities or list(_PATTERNS.keys())

    def check(self, text: str, stage: str = "input") -> GuardResult:
        start = time.perf_counter()
        matches = _detect(text, self._entities)
        elapsed = (time.perf_counter() - start) * 1000
        if not matches:
            return GuardResult(guard_name="pii-pl", passed=True, action="allow", latency_ms=round(elapsed, 2))
        detected = [{"type": m["type"], "value": m["value"]} for m in matches]
        if self.action == "mask":
            return GuardResult(guard_name="pii-pl", passed=True, action="override", override_text=_mask(text, matches), latency_ms=round(elapsed, 2), details={"detected": detected})
        return GuardResult(guard_name="pii-pl", passed=False, action=self.action, message="Polish PII detected", latency_ms=round(elapsed, 2), details={"detected": detected})


def pii_pl(*, action: str = "block", entities: Optional[List[str]] = None) -> _PiiPl:
    return _PiiPl(action=action, entities=entities)
