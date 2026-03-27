"""Indonesian PII detection and masking guard."""

import re
import time
from typing import List, Optional

from open_guardrail.core import GuardResult

_PATTERNS: dict[str, re.Pattern[str]] = {
    "nik": re.compile(r"\b\d{16}\b"),
    "ktp": re.compile(r"\b\d{6}[. ]?\d{6}[. ]?\d{4}\b"),
    "npwp": re.compile(r"\b\d{2}\.\d{3}\.\d{3}\.\d-\d{3}\.\d{3}\b"),
    "passport-id": re.compile(r"\b[A-Z]\d{7,8}\b"),
    "phone-id": re.compile(r"\b(?:\+62|0062|0)\s?8\d{2}[\s\-]?\d{4}[\s\-]?\d{3,4}\b"),
}

_MASK_LABELS = {"nik": "[NIK]", "ktp": "[KTP]", "npwp": "[NPWP]", "passport-id": "[PASPOR]", "phone-id": "[TELEPON-ID]"}


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


class _PiiId:
    def __init__(self, *, action: str = "block", entities: Optional[List[str]] = None) -> None:
        self.name = "pii-id"
        self.action = action
        self._entities = entities or list(_PATTERNS.keys())

    def check(self, text: str, stage: str = "input") -> GuardResult:
        start = time.perf_counter()
        matches = _detect(text, self._entities)
        elapsed = (time.perf_counter() - start) * 1000
        if not matches:
            return GuardResult(guard_name="pii-id", passed=True, action="allow", latency_ms=round(elapsed, 2))
        detected = [{"type": m["type"], "value": m["value"]} for m in matches]
        if self.action == "mask":
            return GuardResult(guard_name="pii-id", passed=True, action="override", override_text=_mask(text, matches), latency_ms=round(elapsed, 2), details={"detected": detected})
        return GuardResult(guard_name="pii-id", passed=False, action=self.action, message="Indonesian PII detected", latency_ms=round(elapsed, 2), details={"detected": detected})


def pii_id(*, action: str = "block", entities: Optional[List[str]] = None) -> _PiiId:
    return _PiiId(action=action, entities=entities)
