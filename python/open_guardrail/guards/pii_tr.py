"""Turkish PII detection and masking guard."""

import re
import time
from typing import List, Optional

from open_guardrail.core import GuardResult

_PATTERNS: dict[str, re.Pattern[str]] = {
    "tc-kimlik": re.compile(r"\b[1-9]\d{10}\b"),
    "passport-tr": re.compile(r"\b[A-Z]\d{8}\b"),
    "phone-tr": re.compile(r"\b(?:\+90|0090|0)\s?5\d{2}[\s\-]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2}\b"),
    "iban-tr": re.compile(r"\bTR\d{2}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{2}\b", re.I),
}

_MASK_LABELS = {"tc-kimlik": "[TC KİMLİK]", "passport-tr": "[PASAPORT]", "phone-tr": "[TELEFON-TR]", "iban-tr": "[IBAN-TR]"}


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


class _PiiTr:
    def __init__(self, *, action: str = "block", entities: Optional[List[str]] = None) -> None:
        self.name = "pii-tr"
        self.action = action
        self._entities = entities or list(_PATTERNS.keys())

    def check(self, text: str, stage: str = "input") -> GuardResult:
        start = time.perf_counter()
        matches = _detect(text, self._entities)
        elapsed = (time.perf_counter() - start) * 1000
        if not matches:
            return GuardResult(guard_name="pii-tr", passed=True, action="allow", latency_ms=round(elapsed, 2))
        detected = [{"type": m["type"], "value": m["value"]} for m in matches]
        if self.action == "mask":
            return GuardResult(guard_name="pii-tr", passed=True, action="override", override_text=_mask(text, matches), latency_ms=round(elapsed, 2), details={"detected": detected})
        return GuardResult(guard_name="pii-tr", passed=False, action=self.action, message="Turkish PII detected", latency_ms=round(elapsed, 2), details={"detected": detected})


def pii_tr(*, action: str = "block", entities: Optional[List[str]] = None) -> _PiiTr:
    return _PiiTr(action=action, entities=entities)
