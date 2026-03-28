"""Copyrighted code pattern detection guard."""
from __future__ import annotations

import re
import time
from typing import List, Optional

from open_guardrail.core import GuardResult

_LICENSE_PATTERNS: list[tuple[str, re.Pattern[str]]] = [
    ("gpl", re.compile(
        r"GNU\s+General\s+Public\s+License|GPL[-\s]?\d",
        re.IGNORECASE,
    )),
    ("lgpl", re.compile(
        r"GNU\s+Lesser\s+General\s+Public\s+License"
        r"|LGPL[-\s]?\d",
        re.IGNORECASE,
    )),
    ("agpl", re.compile(
        r"GNU\s+Affero\s+General\s+Public\s+License"
        r"|AGPL[-\s]?\d",
        re.IGNORECASE,
    )),
    ("copyright-notice", re.compile(
        r"Copyright\s*\(c\)\s*\d{4}", re.IGNORECASE
    )),
    ("all-rights-reserved", re.compile(
        r"All\s+rights\s+reserved", re.IGNORECASE
    )),
    ("mit", re.compile(r"MIT\s+License", re.IGNORECASE)),
    ("apache", re.compile(
        r"Apache\s+License", re.IGNORECASE
    )),
    ("bsd", re.compile(
        r"BSD\s+\d-Clause\s+License", re.IGNORECASE
    )),
    ("proprietary", re.compile(
        r"PROPRIETARY\s+(AND\s+)?CONFIDENTIAL",
        re.IGNORECASE,
    )),
    ("license-header", re.compile(
        r"^\s*[#/*]+\s*(License|Copyright)\b",
        re.IGNORECASE | re.MULTILINE,
    )),
]


class _CopyrightCode:
    def __init__(
        self,
        *,
        action: str = "block",
        allowed_licenses: Optional[List[str]] = None,
    ) -> None:
        self.name = "copyright-code"
        self.action = action
        self._allowed = set(
            (l.lower() for l in (allowed_licenses or []))
        )

    def check(
        self, text: str, stage: str = "output"
    ) -> GuardResult:
        start = time.perf_counter()
        matched: list[str] = []
        for name, pat in _LICENSE_PATTERNS:
            if name in self._allowed:
                continue
            if pat.search(text):
                matched.append(name)
        triggered = len(matched) > 0
        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(
            guard_name="copyright-code",
            passed=not triggered,
            action=self.action if triggered else "allow",
            message=(
                "Copyrighted code patterns detected"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {"matched": matched}
                if triggered
                else None
            ),
        )


def copyright_code(
    *,
    action: str = "block",
    allowed_licenses: Optional[List[str]] = None,
) -> _CopyrightCode:
    return _CopyrightCode(
        action=action, allowed_licenses=allowed_licenses
    )
