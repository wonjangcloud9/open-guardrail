"""Validates schema version compatibility."""
from __future__ import annotations

import re
import time
from typing import Optional

from open_guardrail.core import GuardResult

_VER_RE = re.compile(
    r'(?:"?version"?\s*[:=]\s*"?)(\d+(?:\.\d+){0,2})',
    re.IGNORECASE,
)


def _parse(v: str) -> list[int]:
    return [int(n) for n in v.split(".")]


def _cmp(a: list[int], b: list[int]) -> int:
    for i in range(max(len(a), len(b))):
        av = a[i] if i < len(a) else 0
        bv = b[i] if i < len(b) else 0
        if av != bv:
            return av - bv
    return 0


class _SchemaVersion:
    def __init__(
        self,
        *,
        action: str = "block",
        min_version: Optional[str] = None,
        max_version: Optional[str] = None,
    ) -> None:
        self.name = "schema-version"
        self.action = action
        self._min = _parse(min_version) if min_version else None
        self._max = _parse(max_version) if max_version else None

    def check(
        self, text: str, stage: str = "input"
    ) -> GuardResult:
        start = time.perf_counter()
        issues: list[str] = []

        matches = _VER_RE.findall(text)
        if not matches:
            issues.append("missing_version_field")

        for ver_str in matches:
            ver = _parse(ver_str)
            if self._min and _cmp(ver, self._min) < 0:
                issues.append(f"version_below_min:{ver_str}")
            if self._max and _cmp(ver, self._max) > 0:
                issues.append(f"version_above_max:{ver_str}")

        triggered = len(issues) > 0
        score = min(len(issues) / 2, 1.0) if triggered else 0.0
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="schema-version",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=score,
            message="Schema version issue" if triggered else None,
            latency_ms=round(elapsed, 2),
            details=(
                {"issues": issues, "versions_found": matches}
                if triggered
                else None
            ),
        )


def schema_version(
    *,
    action: str = "block",
    min_version: Optional[str] = None,
    max_version: Optional[str] = None,
) -> _SchemaVersion:
    return _SchemaVersion(
        action=action,
        min_version=min_version,
        max_version=max_version,
    )
