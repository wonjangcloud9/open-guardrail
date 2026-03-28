"""Validate list formatting consistency."""
from __future__ import annotations

import re
import time

from open_guardrail.core import GuardResult

_NUMBERED_RE = re.compile(r"^(\d+)\.\s", re.MULTILINE)
_BULLET_RE = re.compile(r"^[\-\*\+]\s", re.MULTILINE)


class _ListFormat:
    def __init__(
        self,
        *,
        action: str = "warn",
        max_items: int = 50,
    ) -> None:
        self.name = "list-format"
        self.action = action
        self._max_items = max_items

    def check(
        self, text: str, stage: str = "output"
    ) -> GuardResult:
        start = time.perf_counter()
        issues: list[str] = []

        numbered = list(_NUMBERED_RE.finditer(text))
        if numbered:
            nums = [
                int(m.group(1)) for m in numbered
            ]
            for i in range(1, len(nums)):
                if (
                    nums[i] != nums[i - 1] + 1
                    and nums[i] != 1
                ):
                    issues.append(
                        f"numbering_gap:"
                        f"{nums[i-1]}->{nums[i]}"
                    )
                    break
            if len(nums) > self._max_items:
                issues.append(
                    f"too_many_items:{len(nums)}"
                )

        bullets = list(_BULLET_RE.finditer(text))
        if bullets:
            chars = [m.group()[0] for m in bullets]
            if len(set(chars)) > 1:
                issues.append("mixed_bullets")
            if len(bullets) > self._max_items:
                issues.append(
                    f"too_many_items:{len(bullets)}"
                )

        triggered = len(issues) > 0
        score = min(len(issues) / 3, 1.0) if triggered else 0.0
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="list-format",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=score,
            message=(
                "List format issue detected"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {"issues": issues} if triggered else None
            ),
        )


def list_format(
    *, action: str = "warn", max_items: int = 50
) -> _ListFormat:
    return _ListFormat(
        action=action, max_items=max_items
    )
