"""Detect Korean language presence."""

import re
import time

from open_guardrail.core import GuardResult

_KOREAN = re.compile(r"[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F]")


class _LanguageKo:
    def __init__(
        self, *, action: str = "warn", min_ratio: float = 0.3
    ) -> None:
        self.name = "language-ko"
        self.action = action
        self._min_ratio = min_ratio

    def check(self, text: str, stage: str = "input") -> GuardResult:
        start = time.perf_counter()
        stripped = re.sub(r"\s", "", text)
        if not stripped:
            elapsed = (time.perf_counter() - start) * 1000
            return GuardResult(
                guard_name="language-ko",
                passed=False,
                action=self.action,
                score=0.0,
                latency_ms=round(elapsed, 2),
            )

        matches = _KOREAN.findall(stripped)
        ratio = len(matches) / len(stripped)
        passed = ratio >= self._min_ratio
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="language-ko",
            passed=passed,
            action="allow" if passed else self.action,
            score=round(ratio, 3),
            latency_ms=round(elapsed, 2),
            details={"korean_ratio": round(ratio, 3)},
        )


def language_ko(
    *, action: str = "warn", min_ratio: float = 0.3
) -> _LanguageKo:
    return _LanguageKo(action=action, min_ratio=min_ratio)
