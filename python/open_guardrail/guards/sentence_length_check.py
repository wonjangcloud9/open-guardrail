"""Validate sentence length for readability."""
from __future__ import annotations

import re
import time

from open_guardrail.core import GuardResult


def _count_words(s: str) -> int:
    return len(
        [w for w in s.strip().split() if w]
    )


class _SentenceLengthCheck:
    def __init__(
        self,
        *,
        action: str = "warn",
        max_words: int = 50,
    ) -> None:
        self.name = "sentence-length-check"
        self.action = action
        self._max_words = max_words

    def check(
        self, text: str, stage: str = "output"
    ) -> GuardResult:
        start = time.perf_counter()
        issues: list[str] = []
        sentences = [
            s.strip()
            for s in re.split(r"(?<=[.!?])\s+", text)
            if s.strip()
        ]

        for sent in sentences:
            wc = _count_words(sent)
            if wc > self._max_words:
                issues.append(
                    f"Sentence too long ({wc} words):"
                    f' "{sent[:40]}..."'
                )
            if (
                0 < wc < 3
                and not re.match(r"^#+\s", sent)
            ):
                issues.append(
                    f"Very short sentence ({wc} words):"
                    f' "{sent[:40]}"'
                )

        run_ons = re.findall(
            r"[^.!?]{200,}[.!?]", text
        )
        for run in run_ons:
            if len(re.findall(r",", run)) > 5:
                issues.append(
                    "Possible run-on sentence:"
                    f' "{run[:40]}..."'
                )

        triggered = len(issues) > 0
        score = (
            min(len(issues) / 4, 1.0)
            if triggered
            else 0.0
        )
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="sentence-length-check",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=score,
            message=(
                "Sentence length issues found"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {"issues": issues} if triggered else None
            ),
        )


def sentence_length_check(
    *,
    action: str = "warn",
    max_words: int = 50,
) -> _SentenceLengthCheck:
    return _SentenceLengthCheck(
        action=action, max_words=max_words
    )
