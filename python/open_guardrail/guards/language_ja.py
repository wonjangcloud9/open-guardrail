"""Detect Japanese language presence."""

import re
import time

from open_guardrail.core import GuardResult

_JAPANESE = re.compile(
    r"[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF\uFF65-\uFF9F]"
)


class _LanguageJa:
    def __init__(
        self, *, action: str = "warn", min_ratio: float = 0.3
    ) -> None:
        self.name = "language-ja"
        self.action = action
        self._min_ratio = min_ratio

    def check(self, text: str, stage: str = "input") -> GuardResult:
        start = time.perf_counter()
        stripped = re.sub(r"\s", "", text)
        if not stripped:
            elapsed = (time.perf_counter() - start) * 1000
            return GuardResult(
                guard_name="language-ja",
                passed=False,
                action=self.action,
                score=0.0,
                latency_ms=round(elapsed, 2),
            )

        matches = _JAPANESE.findall(stripped)
        ratio = len(matches) / len(stripped)
        passed = ratio >= self._min_ratio
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="language-ja",
            passed=passed,
            action="allow" if passed else self.action,
            score=round(ratio, 3),
            latency_ms=round(elapsed, 2),
            details={"japanese_ratio": round(ratio, 3)},
        )


def language_ja(
    *, action: str = "warn", min_ratio: float = 0.3
) -> _LanguageJa:
    return _LanguageJa(action=action, min_ratio=min_ratio)
