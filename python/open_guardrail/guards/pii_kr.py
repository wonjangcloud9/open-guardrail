"""Korean PII detection and masking guard."""
from __future__ import annotations

import re
import time
from typing import List, Optional

from open_guardrail.core import GuardResult

_PATTERNS: dict[str, re.Pattern[str]] = {
    "resident-id": re.compile(r"\d{6}-[1-4]\d{6}"),
    "passport": re.compile(r"[A-Z]{1,2}\d{7,8}"),
    "driver-license": re.compile(
        r"\d{2}-\d{2}-\d{6}-\d{2}"
    ),
    "business-id": re.compile(r"\d{3}-\d{2}-\d{5}"),
    "health-insurance": re.compile(
        r"(?:건강보험).{0,20}(\d{10,14})"
    ),
    "foreigner-id": re.compile(r"\d{6}-[5-8]\d{6}"),
}

_MASK_LABELS: dict[str, str] = {
    "resident-id": "[주민등록번호]",
    "passport": "[여권번호]",
    "driver-license": "[운전면허번호]",
    "business-id": "[사업자등록번호]",
    "health-insurance": "[건강보험번호]",
    "foreigner-id": "[외국인등록번호]",
}

_CHECKSUM_WEIGHTS = [2, 3, 4, 5, 6, 7, 8, 9, 2, 3, 4, 5]


def _validate_resident_id(raw: str) -> bool:
    digits = raw.replace("-", "")
    if len(digits) != 13:
        return False
    total = 0
    for i in range(12):
        total += int(digits[i]) * _CHECKSUM_WEIGHTS[i]
    check = (11 - (total % 11)) % 10
    return check == int(digits[12])


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
            if entity == "resident-id":
                if not _validate_resident_id(value):
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


class _PiiKr:
    def __init__(
        self,
        *,
        action: str = "block",
        entities: Optional[List[str]] = None,
    ) -> None:
        self.name = "pii-kr"
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
                guard_name="pii-kr",
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
                guard_name="pii-kr",
                passed=True,
                action="override",
                override_text=_mask_text(text, matches),
                latency_ms=round(elapsed, 2),
                details={"detected": detected},
            )

        return GuardResult(
            guard_name="pii-kr",
            passed=False,
            action=self.action,
            message="Korean PII detected in text",
            latency_ms=round(elapsed, 2),
            details={
                "detected": detected,
                "reason": (
                    "Text contains Korean personally"
                    " identifiable information"
                ),
            },
        )


def pii_kr(
    *,
    action: str = "block",
    entities: Optional[List[str]] = None,
) -> _PiiKr:
    return _PiiKr(action=action, entities=entities)
