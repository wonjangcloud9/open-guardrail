"""Keyword deny/allow list guard."""

import time
from typing import List, Optional

from open_guardrail.core import GuardResult


class _Keyword:
    def __init__(
        self,
        *,
        action: str = "block",
        denied: Optional[List[str]] = None,
        allowed: Optional[List[str]] = None,
        case_sensitive: bool = False,
    ) -> None:
        self.name = "keyword"
        self.action = action
        self._denied = denied
        self._allowed = allowed
        self._case_sensitive = case_sensitive

    def _normalize(self, s: str) -> str:
        return s if self._case_sensitive else s.lower()

    def check(
        self, text: str, stage: str = "input"
    ) -> GuardResult:
        start = time.perf_counter()
        norm_text = self._normalize(text)
        triggered = False
        found: list[str] = []

        if self._denied:
            for word in self._denied:
                if self._normalize(word) in norm_text:
                    triggered = True
                    found.append(word)

        if self._allowed and not triggered:
            has = any(
                self._normalize(w) in norm_text
                for w in self._allowed
            )
            if not has:
                triggered = True

        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="keyword",
            passed=not triggered,
            action=self.action if triggered else "allow",
            message=(
                "Denied keyword found in text"
                if found
                else (
                    "No allowed keyword found in text"
                    if triggered
                    else None
                )
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {
                    "matched": found,
                    "reason": (
                        "Text contains denied keywords"
                    ),
                }
                if found
                else (
                    {
                        "reason": (
                            "Text does not contain any"
                            " of the allowed keywords"
                        )
                    }
                    if triggered
                    else None
                )
            ),
        )


def keyword(
    *,
    action: str = "block",
    denied: Optional[List[str]] = None,
    allowed: Optional[List[str]] = None,
    case_sensitive: bool = False,
) -> _Keyword:
    return _Keyword(
        action=action,
        denied=denied,
        allowed=allowed,
        case_sensitive=case_sensitive,
    )
