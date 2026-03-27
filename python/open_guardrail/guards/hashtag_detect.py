"""Detect hashtags in text."""

import re
import time
from typing import List

from open_guardrail.core import GuardResult

_HASHTAG_RE = re.compile(r"#(\w+)")


class _HashtagDetect:
    def __init__(
        self,
        *,
        action: str = "warn",
        max_hashtags: int = 5,
        denied_hashtags: List[str] | None = None,
    ) -> None:
        self.name = "hashtag-detect"
        self.action = action
        self._max = max_hashtags
        self._denied = [
            h.lower().lstrip("#")
            for h in (denied_hashtags or [])
        ]

    def check(
        self, text: str, stage: str = "input"
    ) -> GuardResult:
        start = time.perf_counter()
        found = _HASHTAG_RE.findall(text)
        denied_found = [
            h for h in found if h.lower() in self._denied
        ]
        over_limit = len(found) > self._max
        triggered = over_limit or len(denied_found) > 0
        elapsed = (time.perf_counter() - start) * 1000

        reasons: list[str] = []
        if over_limit:
            reasons.append(
                f"{len(found)} hashtags (max {self._max})"
            )
        if denied_found:
            reasons.append(
                "denied: " + ", ".join(denied_found)
            )

        return GuardResult(
            guard_name="hashtag-detect",
            passed=not triggered,
            action=(
                self.action if triggered else "allow"
            ),
            message=(
                "Hashtag issue: " + "; ".join(reasons)
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {
                    "count": len(found),
                    "hashtags": found,
                    "denied_found": denied_found,
                }
                if triggered
                else None
            ),
        )


def hashtag_detect(
    *,
    action: str = "warn",
    max_hashtags: int = 5,
    denied_hashtags: List[str] | None = None,
) -> _HashtagDetect:
    return _HashtagDetect(
        action=action,
        max_hashtags=max_hashtags,
        denied_hashtags=denied_hashtags or [],
    )
