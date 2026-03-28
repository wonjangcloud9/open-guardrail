"""IP address detection and blocking guard."""
from __future__ import annotations

import re
import time
from typing import List, Optional

from open_guardrail.core import GuardResult

_PATTERNS: dict[str, re.Pattern[str]] = {
    "ipv4": re.compile(
        r"\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}"
    ),
    "ipv6": re.compile(
        r"(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}"
        r"|(?:[0-9a-fA-F]{1,4}:){1,7}:"
        r"|::(?:[0-9a-fA-F]{1,4}:){0,6}[0-9a-fA-F]{1,4}"
    ),
}

_MASK_LABELS: dict[str, str] = {
    "ipv4": "[IP-ADDRESS]",
    "ipv6": "[IP-ADDRESS]",
}

_PRIVATE_RANGES = [
    re.compile(r"^10\."),
    re.compile(r"^172\.(1[6-9]|2\d|3[01])\."),
    re.compile(r"^192\.168\."),
    re.compile(r"^127\."),
]


def _is_private_ip(ip: str) -> bool:
    for pat in _PRIVATE_RANGES:
        if pat.match(ip):
            return True
    return False


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


class _IpGuard:
    def __init__(
        self,
        *,
        action: str = "block",
        entities: Optional[List[str]] = None,
        private_only: bool = True,
    ) -> None:
        self.name = "ip-guard"
        self.action = action
        self._entities = entities or list(_PATTERNS.keys())
        self._private_only = private_only

    def check(
        self, text: str, stage: str = "input"
    ) -> GuardResult:
        start = time.perf_counter()
        matches = _detect(text, self._entities)

        if self._private_only:
            matches = [
                m for m in matches
                if m["type"] != "ipv4"
                or _is_private_ip(m["value"])
            ]

        elapsed = (time.perf_counter() - start) * 1000

        if not matches:
            return GuardResult(
                guard_name="ip-guard",
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
                guard_name="ip-guard",
                passed=True,
                action="override",
                override_text=_mask_text(text, matches),
                latency_ms=round(elapsed, 2),
                details={"detected": detected},
            )

        return GuardResult(
            guard_name="ip-guard",
            passed=False,
            action=self.action,
            message="IP address detected in text",
            latency_ms=round(elapsed, 2),
            details={
                "detected": detected,
                "reason": (
                    "Text contains IP addresses"
                ),
            },
        )


def ip_guard(
    *,
    action: str = "block",
    entities: Optional[List[str]] = None,
    private_only: bool = True,
) -> _IpGuard:
    return _IpGuard(
        action=action,
        entities=entities,
        private_only=private_only,
    )
