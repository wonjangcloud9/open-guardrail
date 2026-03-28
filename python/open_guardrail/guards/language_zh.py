"""Detect Chinese language presence."""
from __future__ import annotations

import re
import time

from open_guardrail.core import GuardResult

_CHINESE = re.compile(
    r"[\u4E00-\u9FFF\u3400-\u4DBF\uF900-\uFAFF]"
)


class _LanguageZh:
    def __init__(
        self, *, action: str = "warn", min_ratio: float = 0.3
    ) -> None:
        self.name = "language-zh"
        self.action = action
        self._min_ratio = min_ratio

    def check(self, text: str, stage: str = "input") -> GuardResult:
        start = time.perf_counter()
        stripped = re.sub(r"\s", "", text)
        if not stripped:
            elapsed = (time.perf_counter() - start) * 1000
            return GuardResult(
                guard_name="language-zh",
                passed=False,
                action=self.action,
                score=0.0,
                latency_ms=round(elapsed, 2),
            )

        matches = _CHINESE.findall(stripped)
        ratio = len(matches) / len(stripped)
        passed = ratio >= self._min_ratio
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="language-zh",
            passed=passed,
            action="allow" if passed else self.action,
            score=round(ratio, 3),
            latency_ms=round(elapsed, 2),
            details={"chinese_ratio": round(ratio, 3)},
        )


def language_zh(
    *, action: str = "warn", min_ratio: float = 0.3
) -> _LanguageZh:
    return _LanguageZh(action=action, min_ratio=min_ratio)
