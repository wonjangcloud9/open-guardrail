"""Detect model denial-of-service attempts."""

import re
import time

from open_guardrail.core import GuardResult

_REPEATED_CHAR = re.compile(r"(.)\1{99,}")
_NESTED_BRACKETS = re.compile(
    r"[\[\(\{]{10,}",
)
_LONG_WORD = re.compile(r"\S{200,}")


class _ModelDenial:
    def __init__(
        self,
        *,
        action: str = "block",
        max_input_length: int = 100000,
        max_repetitions: int = 100,
    ) -> None:
        self.name = "model-denial"
        self.action = action
        self._max_len = max_input_length
        self._max_rep = max_repetitions
        self._rep_pat = re.compile(
            r"(.)\1{" + str(max_repetitions - 1) + r",}"
        )

    def check(
        self, text: str, stage: str = "input"
    ) -> GuardResult:
        start = time.perf_counter()
        reasons: list[str] = []

        if len(text) > self._max_len:
            reasons.append("excessive_length")

        if self._rep_pat.search(text):
            reasons.append("repeated_characters")

        if _NESTED_BRACKETS.search(text):
            reasons.append("nested_brackets")

        if _LONG_WORD.search(text):
            reasons.append("long_single_word")

        triggered = len(reasons) > 0
        score = min(len(reasons) / 3, 1.0) if triggered else 0.0
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="model-denial",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=score,
            message=(
                "Model denial-of-service attempt detected"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {
                    "reasons": reasons,
                    "input_length": len(text),
                    "max_input_length": self._max_len,
                    "reason": (
                        "Text contains patterns designed"
                        " to exhaust model resources"
                        " or cause denial of service"
                    ),
                }
                if triggered
                else None
            ),
        )


def model_denial(
    *,
    action: str = "block",
    max_input_length: int = 100000,
    max_repetitions: int = 100,
) -> _ModelDenial:
    return _ModelDenial(
        action=action,
        max_input_length=max_input_length,
        max_repetitions=max_repetitions,
    )
