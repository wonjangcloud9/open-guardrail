"""Limit response length."""

import time
from typing import Optional

from open_guardrail.core import GuardResult


class _ResponseLengthLimit:
    def __init__(
        self,
        *,
        action: str = "block",
        min_words: int = 1,
        max_words: int = 5000,
        min_chars: Optional[int] = None,
        max_chars: Optional[int] = None,
    ) -> None:
        self.name = "response-length-limit"
        self.action = action
        self._min_w = min_words
        self._max_w = max_words
        self._min_c = min_chars
        self._max_c = max_chars

    def check(
        self, text: str, stage: str = "output"
    ) -> GuardResult:
        start = time.perf_counter()
        words = text.split()
        wc = len(words)
        cc = len(text)
        issues: list[str] = []

        if wc < self._min_w:
            issues.append(
                f"too_few_words ({wc} < {self._min_w})"
            )
        if wc > self._max_w:
            issues.append(
                f"too_many_words ({wc} > {self._max_w})"
            )
        if self._min_c is not None and cc < self._min_c:
            issues.append(
                f"too_few_chars ({cc} < {self._min_c})"
            )
        if self._max_c is not None and cc > self._max_c:
            issues.append(
                f"too_many_chars ({cc} > {self._max_c})"
            )

        triggered = len(issues) > 0
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="response-length-limit",
            passed=not triggered,
            action=(
                self.action if triggered else "allow"
            ),
            score=1.0 if triggered else 0.0,
            message=(
                "; ".join(issues) if triggered else None
            ),
            latency_ms=round(elapsed, 2),
            details={
                "word_count": wc,
                "char_count": cc,
            },
        )


def response_length_limit(
    *,
    action: str = "block",
    min_words: int = 1,
    max_words: int = 5000,
    min_chars: Optional[int] = None,
    max_chars: Optional[int] = None,
) -> _ResponseLengthLimit:
    return _ResponseLengthLimit(
        action=action,
        min_words=min_words,
        max_words=max_words,
        min_chars=min_chars,
        max_chars=max_chars,
    )
