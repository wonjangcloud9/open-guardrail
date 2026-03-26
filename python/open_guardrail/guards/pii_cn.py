"""Chinese PII detection and masking guard."""

import re
import time
from typing import List, Optional

from open_guardrail.core import GuardResult

_PATTERNS: dict[str, re.Pattern[str]] = {
    "id-card": re.compile(r"\b\d{17}[\dXx]\b"),
    "passport": re.compile(r"[EGeDSPHegdsph]\d{8}"),
    "bank-card": re.compile(r"\b\d{16,19}\b"),
    "social-security": re.compile(r"\b\d{18}\b"),
    "phone": re.compile(r"(?:1[3-9]\d{9})"),
}

_MASK_LABELS: dict[str, str] = {
    "id-card": "[身份证号]",
    "passport": "[护照号]",
    "bank-card": "[银行卡号]",
    "social-security": "[社保号]",
    "phone": "[手机号]",
}

_ID_WEIGHTS = [
    7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2,
]
_ID_CHECK_MAP = "10X98765432"

_VALID_REGIONS = {
    11, 12, 13, 14, 15, 21, 22, 23,
    31, 32, 33, 34, 35, 36, 37, 41,
    42, 43, 44, 45, 46, 50, 51, 52,
    53, 54, 61, 62, 63, 64, 65,
}


def _validate_id_card(raw: str) -> bool:
    if len(raw) != 18:
        return False
    upper = raw.upper()
    total = 0
    for i in range(17):
        d = upper[i]
        if not d.isdigit():
            return False
        total += int(d) * _ID_WEIGHTS[i]
    check = _ID_CHECK_MAP[total % 11]
    return check == upper[17]


def _is_valid_region(raw: str) -> bool:
    region = int(raw[:2])
    return region in _VALID_REGIONS


def _detect(
    text: str, entities: list[str]
) -> list[dict]:
    matches: list[dict] = []
    for entity in entities:
        pat = _PATTERNS.get(entity)
        if not pat:
            continue
        for m in pat.finditer(text):
            value = m.group()
            if entity == "id-card":
                if not _validate_id_card(value):
                    continue
                if not _is_valid_region(value):
                    continue
            matches.append(
                {
                    "type": entity,
                    "value": value,
                    "start": m.start(),
                    "end": m.end(),
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


class _PiiCn:
    def __init__(
        self,
        *,
        action: str = "block",
        entities: Optional[List[str]] = None,
    ) -> None:
        self.name = "pii-cn"
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
                guard_name="pii-cn",
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
                guard_name="pii-cn",
                passed=True,
                action="override",
                override_text=_mask_text(text, matches),
                latency_ms=round(elapsed, 2),
                details={"detected": detected},
            )

        return GuardResult(
            guard_name="pii-cn",
            passed=False,
            action=self.action,
            message="Chinese PII detected in text",
            latency_ms=round(elapsed, 2),
            details={
                "detected": detected,
                "reason": (
                    "Text contains Chinese personally"
                    " identifiable information"
                ),
            },
        )


def pii_cn(
    *,
    action: str = "block",
    entities: Optional[List[str]] = None,
) -> _PiiCn:
    return _PiiCn(action=action, entities=entities)
