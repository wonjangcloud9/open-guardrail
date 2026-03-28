"""Cryptocurrency address detection guard."""
from __future__ import annotations

import re
import time
from typing import List

from open_guardrail.core import GuardResult

_PATTERNS: dict[str, re.Pattern[str]] = {
    "bitcoin": re.compile(r"\b[13][a-km-zA-HJ-NP-Z1-9]{25,34}\b"),
    "bitcoin-bech32": re.compile(r"\bbc1[a-z0-9]{39,59}\b"),
    "ethereum": re.compile(r"\b0x[0-9a-fA-F]{40}\b"),
    "litecoin": re.compile(r"\b[LM3][a-km-zA-HJ-NP-Z1-9]{26,33}\b"),
    "monero": re.compile(r"\b4[0-9AB][1-9A-HJ-NP-Za-km-z]{93}\b"),
}


class _CryptoAddress:
    def __init__(self, *, action: str = "block") -> None:
        self.name = "crypto-address"
        self.action = action

    def check(self, text: str, stage: str = "output") -> GuardResult:
        start = time.perf_counter()
        found: List[dict] = []
        for crypto, pat in _PATTERNS.items():
            for m in pat.finditer(text):
                found.append({"type": crypto, "value": m.group()[:12] + "..."})
        triggered = len(found) > 0
        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(guard_name="crypto-address", passed=not triggered, action=self.action if triggered else "allow", message=f"Crypto address detected: {len(found)}" if triggered else None, latency_ms=round(elapsed, 2), details={"detected": found} if triggered else None)


def crypto_address(*, action: str = "block") -> _CryptoAddress:
    return _CryptoAddress(action=action)
