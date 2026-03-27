"""Block content matching known bad fingerprints."""

import hashlib
import time
from typing import List

from open_guardrail.core import GuardResult


def _fingerprint(text: str) -> str:
    sig = text[:100] + str(len(text))
    return hashlib.sha256(sig.encode()).hexdigest()[:16]


class _ContentFingerprint:
    def __init__(
        self,
        *,
        action: str = "block",
        known_fingerprints: List[str] | None = None,
    ) -> None:
        self.name = "content-fingerprint"
        self.action = action
        self.known = set(known_fingerprints or [])

    def check(
        self, text: str, stage: str = "input"
    ) -> GuardResult:
        start = time.perf_counter()
        fp = _fingerprint(text)
        triggered = fp in self.known
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="content-fingerprint",
            passed=not triggered,
            action=self.action if triggered else "allow",
            message=(
                "Content matches known bad fingerprint"
                if triggered else None
            ),
            latency_ms=round(elapsed, 2),
            details={
                "fingerprint": fp,
                "matched": triggered,
            },
        )


def content_fingerprint(
    *,
    action: str = "block",
    known_fingerprints: List[str] | None = None,
) -> _ContentFingerprint:
    return _ContentFingerprint(
        action=action,
        known_fingerprints=known_fingerprints,
    )
