"""Validate phone country codes and detect premium rate numbers."""
from __future__ import annotations

import re
import time
from typing import List, Optional

from open_guardrail.core import GuardResult

_PREMIUM_PREFIXES = ["900", "976", "809", "284", "876"]

_PHONE_RE = re.compile(
    r"\+(\d{1,3})[\s.-]?"
    r"\(?\d{1,4}\)?[\s.-]?"
    r"\d{2,4}[\s.-]?\d{2,8}"
)


class _PhoneCountryCheck:
    def __init__(
        self,
        *,
        action: str = "block",
        allowed_country_codes: Optional[List[str]] = None,
    ) -> None:
        self.name = "phone-country-check"
        self.action = action
        self._allowed = allowed_country_codes or []

    def check(
        self, text: str, stage: str = "input"
    ) -> GuardResult:
        start = time.perf_counter()
        issues: list[str] = []

        for m in _PHONE_RE.finditer(text):
            cc = m.group(1)
            full = re.sub(r"[\s.()+\-]", "", m.group(0))

            if self._allowed and cc not in self._allowed:
                issues.append(f"restricted_country:+{cc}")

            for prefix in _PREMIUM_PREFIXES:
                if (
                    full.startswith(f"1{prefix}")
                    or full.startswith(prefix)
                ):
                    issues.append(f"premium_rate:{prefix}")

        triggered = len(issues) > 0
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="phone-country-check",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=(
                min(len(issues) / 3, 1.0)
                if triggered
                else 0.0
            ),
            message=(
                "Phone country code issue detected"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {"issues": issues} if triggered else None
            ),
        )


def phone_country_check(
    *,
    action: str = "block",
    allowed_country_codes: Optional[List[str]] = None,
) -> _PhoneCountryCheck:
    return _PhoneCountryCheck(
        action=action,
        allowed_country_codes=allowed_country_codes,
    )
