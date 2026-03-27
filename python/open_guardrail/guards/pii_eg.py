"""Egyptian PII detection and masking guard."""

import re
import time
from typing import List, Optional

from open_guardrail.core import GuardResult

_PATTERNS: dict[str, re.Pattern[str]] = {
    "national-id": re.compile(r"\d{14}"),
    "passport": re.compile(r"[A-Z]\d{7,8}"),
    "phone": re.compile(
        r"\+20[\s-]?\d{2,3}[\s-]?\d{3}[\s-]?\d{4}"
    ),
}

_MASK_LABELS: dict[str, str] = {
    "national-id": "[EG-ID]",
    "passport": "[PASSPORT]",
    "phone": "[PHONE]",
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


class _PiiEg:
    def __init__(
        self,
        *,
        action: str = "block",
        entities: Optional[List[str]] = None,
    ) -> None:
        self.name = "pii-eg"
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
                guard_name="pii-eg",
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
                guard_name="pii-eg",
                passed=True,
                action="override",
                override_text=_mask_text(text, matches),
                latency_ms=round(elapsed, 2),
                details={"detected": detected},
            )

        return GuardResult(
            guard_name="pii-eg",
            passed=False,
            action=self.action,
            message="Egyptian PII detected in text",
            latency_ms=round(elapsed, 2),
            details={
                "detected": detected,
                "reason": (
                    "Text contains Egyptian personally"
                    " identifiable information"
                ),
            },
        )


def pii_eg(
    *,
    action: str = "block",
    entities: Optional[List[str]] = None,
) -> _PiiEg:
    return _PiiEg(action=action, entities=entities)
