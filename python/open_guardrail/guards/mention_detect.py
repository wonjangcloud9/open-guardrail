"""Detect @mentions in text."""

import re
import time
from typing import List

from open_guardrail.core import GuardResult

_MENTION_RE = re.compile(r"@(\w+)")


class _MentionDetect:
    def __init__(
        self,
        *,
        action: str = "warn",
        max_mentions: int = 5,
        denied_mentions: List[str] | None = None,
    ) -> None:
        self.name = "mention-detect"
        self.action = action
        self._max = max_mentions
        self._denied = [
            m.lower().lstrip("@")
            for m in (denied_mentions or [])
        ]

    def check(
        self, text: str, stage: str = "input"
    ) -> GuardResult:
        start = time.perf_counter()
        found = _MENTION_RE.findall(text)
        denied_found = [
            m for m in found if m.lower() in self._denied
        ]
        over_limit = len(found) > self._max
        triggered = over_limit or len(denied_found) > 0
        elapsed = (time.perf_counter() - start) * 1000

        reasons: list[str] = []
        if over_limit:
            reasons.append(
                f"{len(found)} mentions (max {self._max})"
            )
        if denied_found:
            reasons.append(
                "denied: " + ", ".join(denied_found)
            )

        return GuardResult(
            guard_name="mention-detect",
            passed=not triggered,
            action=(
                self.action if triggered else "allow"
            ),
            message=(
                "Mention issue: " + "; ".join(reasons)
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {
                    "count": len(found),
                    "mentions": found,
                    "denied_found": denied_found,
                }
                if triggered
                else None
            ),
        )


def mention_detect(
    *,
    action: str = "warn",
    max_mentions: int = 5,
    denied_mentions: List[str] | None = None,
) -> _MentionDetect:
    return _MentionDetect(
        action=action,
        max_mentions=max_mentions,
        denied_mentions=denied_mentions or [],
    )
