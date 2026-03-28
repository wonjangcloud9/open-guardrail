"""Russian PII detection and masking guard."""
from __future__ import annotations

import re
import time
from typing import List, Optional

from open_guardrail.core import GuardResult

_PATTERNS: dict[str, re.Pattern[str]] = {
    "passport-ru": re.compile(r"\b\d{2}\s?\d{2}\s?\d{6}\b"),
    "inn": re.compile(r"\b\d{10}(?:\d{2})?\b"),
    "snils": re.compile(r"\b\d{3}-\d{3}-\d{3}\s?\d{2}\b"),
    "phone-ru": re.compile(r"\b(?:\+7|8)\s?\(?\d{3}\)?\s?\d{3}[\s\-]?\d{2}[\s\-]?\d{2}\b"),
}

_MASK_LABELS = {"passport-ru": "[ПАСПОРТ]", "inn": "[ИНН]", "snils": "[СНИЛС]", "phone-ru": "[ТЕЛЕФОН]"}


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


class _PiiRu:
    def __init__(self, *, action: str = "block", entities: Optional[List[str]] = None) -> None:
        self.name = "pii-ru"
        self.action = action
        self._entities = entities or list(_PATTERNS.keys())

    def check(self, text: str, stage: str = "input") -> GuardResult:
        start = time.perf_counter()
        matches = _detect(text, self._entities)
        elapsed = (time.perf_counter() - start) * 1000
        if not matches:
            return GuardResult(guard_name="pii-ru", passed=True, action="allow", latency_ms=round(elapsed, 2))
        detected = [{"type": m["type"], "value": m["value"]} for m in matches]
        if self.action == "mask":
            return GuardResult(guard_name="pii-ru", passed=True, action="override", override_text=_mask(text, matches), latency_ms=round(elapsed, 2), details={"detected": detected})
        return GuardResult(guard_name="pii-ru", passed=False, action=self.action, message="Russian PII detected", latency_ms=round(elapsed, 2), details={"detected": detected})


def pii_ru(*, action: str = "block", entities: Optional[List[str]] = None) -> _PiiRu:
    return _PiiRu(action=action, entities=entities)
