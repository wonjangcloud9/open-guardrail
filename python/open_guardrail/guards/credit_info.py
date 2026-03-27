"""Credit card number detection and masking guard."""

import re
import time
from typing import List, Optional

from open_guardrail.core import GuardResult

_PATTERNS: dict[str, re.Pattern[str]] = {
    "visa": re.compile(r"4\d{15}"),
    "mastercard": re.compile(r"5[1-5]\d{14}"),
    "amex": re.compile(r"3[47]\d{13}"),
}

_MASK_LABELS: dict[str, str] = {
    "visa": "[CREDIT-CARD]",
    "mastercard": "[CREDIT-CARD]",
    "amex": "[CREDIT-CARD]",
}


def _detect(
    text: str, entities: list[str]
) -> list[dict]:
    matches: list[dict] = []
    for entity in entities:
        pat = _PATTERNS.get(entity)
        if not pat:
            continue
        for m in pat.finditer(text):
            matches.append(
                {
                    "type": entity,
                    "value": m.group(),
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


class _CreditInfo:
    def __init__(
        self,
        *,
        action: str = "block",
        entities: Optional[List[str]] = None,
    ) -> None:
        self.name = "credit-info"
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
                guard_name="credit-info",
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
                guard_name="credit-info",
                passed=True,
                action="override",
                override_text=_mask_text(text, matches),
                latency_ms=round(elapsed, 2),
                details={"detected": detected},
            )

        return GuardResult(
            guard_name="credit-info",
            passed=False,
            action=self.action,
            message="Credit card number detected",
            latency_ms=round(elapsed, 2),
            details={
                "detected": detected,
                "reason": (
                    "Text contains credit card numbers"
                ),
            },
        )


def credit_info(
    *,
    action: str = "block",
    entities: Optional[List[str]] = None,
) -> _CreditInfo:
    return _CreditInfo(action=action, entities=entities)
