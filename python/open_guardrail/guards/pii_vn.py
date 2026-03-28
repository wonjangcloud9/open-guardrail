"""Vietnamese PII detection and masking guard."""
from __future__ import annotations

import re
import time
from typing import List, Optional

from open_guardrail.core import GuardResult

_PATTERNS: dict[str, re.Pattern[str]] = {
    "cccd": re.compile(r"\b\d{12}\b"),
    "passport-vn": re.compile(r"\b[A-Z]\d{7,8}\b"),
    "phone-vn": re.compile(r"\b(?:\+84|0084|0)\s?[3-9]\d{2}[\s\-]?\d{3}[\s\-]?\d{3}\b"),
    "mst": re.compile(r"\b\d{10}(?:-\d{3})?\b"),
}

_MASK_LABELS = {"cccd": "[CCCD]", "passport-vn": "[HỘ CHIẾU]", "phone-vn": "[SĐT-VN]", "mst": "[MST]"}


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


class _PiiVn:
    def __init__(self, *, action: str = "block", entities: Optional[List[str]] = None) -> None:
        self.name = "pii-vn"
        self.action = action
        self._entities = entities or list(_PATTERNS.keys())

    def check(self, text: str, stage: str = "input") -> GuardResult:
        start = time.perf_counter()
        matches = _detect(text, self._entities)
        elapsed = (time.perf_counter() - start) * 1000
        if not matches:
            return GuardResult(guard_name="pii-vn", passed=True, action="allow", latency_ms=round(elapsed, 2))
        detected = [{"type": m["type"], "value": m["value"]} for m in matches]
        if self.action == "mask":
            return GuardResult(guard_name="pii-vn", passed=True, action="override", override_text=_mask(text, matches), latency_ms=round(elapsed, 2), details={"detected": detected})
        return GuardResult(guard_name="pii-vn", passed=False, action=self.action, message="Vietnamese PII detected", latency_ms=round(elapsed, 2), details={"detected": detected})


def pii_vn(*, action: str = "block", entities: Optional[List[str]] = None) -> _PiiVn:
    return _PiiVn(action=action, entities=entities)
