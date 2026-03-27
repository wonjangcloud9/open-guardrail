"""Disclaimer enforcement guard."""

import time
from typing import List, Optional

from open_guardrail.core import GuardResult

_DEFAULT_DISCLAIMERS = [
    "not medical advice",
    "not legal advice",
    "not financial advice",
    "consult a professional",
    "consult a doctor",
    "consult a lawyer",
    "consult an expert",
    "i am an ai",
    "as an ai",
    "ai assistant",
    "not a substitute for professional",
    "for informational purposes only",
]


class _DisclaimerRequire:
    def __init__(
        self, *, action: str = "warn", disclaimers: Optional[List[str]] = None, require_any: bool = True,
    ) -> None:
        self.name = "disclaimer-require"
        self.action = action
        self._disclaimers = [d.lower() for d in (disclaimers or _DEFAULT_DISCLAIMERS)]
        self.require_any = require_any

    def check(self, text: str, stage: str = "output") -> GuardResult:
        start = time.perf_counter()
        lower = text.lower()
        found = [d for d in self._disclaimers if d in lower]
        if self.require_any:
            triggered = len(found) == 0
        else:
            triggered = len(found) < len(self._disclaimers)
        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(
            guard_name="disclaimer-require",
            passed=not triggered,
            action=self.action if triggered else "allow",
            message="Required disclaimer not found" if triggered else None,
            latency_ms=round(elapsed, 2),
            details={"found": found, "required_count": 1 if self.require_any else len(self._disclaimers)} if triggered else None,
        )


def disclaimer_require(
    *, action: str = "warn", disclaimers: Optional[List[str]] = None, require_any: bool = True,
) -> _DisclaimerRequire:
    return _DisclaimerRequire(action=action, disclaimers=disclaimers, require_any=require_any)
