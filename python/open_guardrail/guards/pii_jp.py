"""Japanese PII detection and masking guard."""
from __future__ import annotations

import re
import time
from typing import List, Optional

from open_guardrail.core import GuardResult

_PATTERNS: dict[str, re.Pattern[str]] = {
    "my-number": re.compile(r"\b\d{4}\s?\d{4}\s?\d{4}\b"),
    "passport": re.compile(r"[A-Z]{2}\d{7}"),
    "driver-license": re.compile(r"\d{12}"),
    "corporate-number": re.compile(r"\b\d{13}\b"),
    "bank-account": re.compile(r"\b\d{7}\b"),
    "health-insurance": re.compile(
        r"(?:保険者番号|被保険者).{0,20}(\d{6,10})"
    ),
}

_MASK_LABELS: dict[str, str] = {
    "my-number": "[マイナンバー]",
    "passport": "[パスポート番号]",
    "driver-license": "[運転免許証番号]",
    "corporate-number": "[法人番号]",
    "bank-account": "[口座番号]",
    "health-insurance": "[健康保険番号]",
}

_MY_NUMBER_WEIGHTS = [6, 5, 4, 3, 2, 7, 6, 5, 4, 3, 2]


def _validate_my_number(raw: str) -> bool:
    digits = raw.replace(" ", "")
    if len(digits) != 12:
        return False
    if all(d == "0" for d in digits):
        return False
    total = 0
    for i in range(11):
        total += int(digits[i]) * _MY_NUMBER_WEIGHTS[i]
    remainder = total % 11
    check = 0 if remainder <= 1 else 11 - remainder
    return check == int(digits[11])


def _detect(
    text: str, entities: list[str]
) -> list[dict]:
    matches: list[dict] = []
    for entity in entities:
        pat = _PATTERNS.get(entity)
        if not pat:
            continue
        for m in pat.finditer(text):
            if entity == "health-insurance" and m.group(1):
                value = m.group(1)
                s = m.start() + m.group().index(value)
            else:
                value = m.group()
                s = m.start()
            if entity == "my-number":
                if not _validate_my_number(value):
                    continue
            matches.append(
                {
                    "type": entity,
                    "value": value,
                    "start": s,
                    "end": s + len(value),
                }
            )
    matches.sort(key=lambda x: x["start"], reverse=True)
    return matches


def _mask_text(text: str, matches: list[dict]) -> str:
    result = text
    for m in matches:
        label = _MASK_LABELS.get(m["type"], "[PII]")
        result = (
            result[: m["start"]] + label + result[m["end"] :]
        )
    return result


class _PiiJp:
    def __init__(
        self,
        *,
        action: str = "block",
        entities: Optional[List[str]] = None,
    ) -> None:
        self.name = "pii-jp"
        self.action = action
        self._entities = entities or list(_PATTERNS.keys())

    def check(
        self, text: str, stage: str = "input"
    ) -> GuardResult:
        start = time.perf_counter()
        matches = _detect(text, self._entities)
        elapsed = (time.perf_counter() - start) * 1000

        if not matches:
            return GuardResult(
                guard_name="pii-jp",
                passed=True,
                action="allow",
                latency_ms=round(elapsed, 2),
            )

        detected = [
            {"type": m["type"], "value": m["value"]}
            for m in matches
        ]

        if self.action == "mask":
            return GuardResult(
                guard_name="pii-jp",
                passed=True,
                action="override",
                override_text=_mask_text(text, matches),
                latency_ms=round(elapsed, 2),
                details={"detected": detected},
            )

        return GuardResult(
            guard_name="pii-jp",
            passed=False,
            action=self.action,
            message="Japanese PII detected in text",
            latency_ms=round(elapsed, 2),
            details={
                "detected": detected,
                "reason": (
                    "Text contains Japanese personally"
                    " identifiable information"
                ),
            },
        )


def pii_jp(
    *,
    action: str = "block",
    entities: Optional[List[str]] = None,
) -> _PiiJp:
    return _PiiJp(action=action, entities=entities)
